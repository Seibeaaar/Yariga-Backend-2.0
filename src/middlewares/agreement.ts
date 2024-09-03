import { Request, Response, NextFunction } from "express";
import {
  AGREEMENT_VALIDATION_SCHEMA,
  AGREEMENT_FILTER_SCHEMA,
} from "@/validators/agreement";
import { generateErrorMesaage } from "@/utils/common";
import User from "@/models/User";
import Property from "@/models/Property";
import Agreement from "@/models/Agreement";
import { isValidObjectId } from "mongoose";

export const validateAgreementRequestBody = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await AGREEMENT_VALIDATION_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const validateAgreementFilters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await AGREEMENT_FILTER_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const validateAgreementEntities = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { property, tenant, landlord, parent } = req.body;

    res.statusCode = 404;
    const tenantDoc = await User.findById(tenant);
    if (!tenantDoc) {
      throw new Error(`No tenant with id ${tenant} found.`);
    }

    const landlordDoc = await User.findById(landlord);
    if (!landlordDoc) {
      throw new Error(`No landlord with id ${landlord} found.`);
    }

    const propertyDoc = await Property.findById(property);
    if (!propertyDoc) {
      throw new Error(`No property with id ${property} found.`);
    }

    if (parent) {
      const parentAgreement = await Agreement.findById(parent);
      if (!parentAgreement) {
        throw new Error(`No agreement with id ${parent} found.`);
      }
    }

    if (!property.owner.equals(landlord)) {
      res.statusCode = 403;
      throw new Error(`Property ${property} is not owned by ${landlord}`);
    }

    next();
  } catch (e) {
    res.send(generateErrorMesaage(e));
  }
};

export const checkAgreementIdParam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.statusCode = 400;
      throw new Error("Invalid agreement id");
    }

    const agreement = await Agreement.findById(id);

    if (!agreement) {
      res.statusCode = 404;
      throw new Error(`No agreement with id ${id} found`);
    }

    res.locals.agreement = agreement;
    next();
  } catch (e) {
    res.send(generateErrorMesaage(e));
  }
};

export const checkIsAgreementOwner = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, agreement } = res.locals;
    if (!agreement.creator.equals(userId)) {
      throw new Error("Only an owner of agreement can peform such operation.");
    }

    next();
  } catch (e) {
    res.status(403).send(generateErrorMesaage(e));
  }
};

export const checkIsAgreementCounterpart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, agreement } = res.locals;
    if (agreement.creator.equals(userId)) {
      throw new Error(
        "Only an agreement counterpart can perform such operation",
      );
    }

    next();
  } catch (e) {
    res.status(403).send(generateErrorMesaage(e));
  }
};
