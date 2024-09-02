import { Request, Response, NextFunction } from "express";
import { AGREEMENT_VALIDATION_SCHEMA } from "@/validators/agreement";
import { generateErrorMesaage } from "@/utils/common";
import User from "@/models/User";
import Property from "@/models/Property";
import Agreement from "@/models/Agreement";

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
