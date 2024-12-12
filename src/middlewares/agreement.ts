import { Request, Response, NextFunction } from "express";
import {
  CREATE_AGREEMENT_SCHEMA,
  AGREEMENT_UPDATE_SCHEMA,
  buildAgreementFiltersSchema,
} from "@/validators/agreement";
import { generateErrorMesaage } from "@/utils/common";
import User from "@/models/User";
import Property from "@/models/Property";
import Agreement from "@/models/Agreement";
import { convertQueryParamToBoolean } from "@/utils/common";
import { AGREEMENT_TOTAL_INTERVAL } from "@/types/agreement";

export const validateAgreementCreate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await CREATE_AGREEMENT_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const validateAgreementUpdateDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await AGREEMENT_UPDATE_SCHEMA.validate(req.body);
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
    const isArchived = convertQueryParamToBoolean(
      req.query.isArchived as string | undefined,
    );
    res.locals.isArchived = isArchived;
    await buildAgreementFiltersSchema(isArchived).validate(req.body);
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

    if (!propertyDoc.owner!.equals(landlord)) {
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
    const agreement = await Agreement.findById(id);

    if (!agreement) {
      throw new Error(`No agreement with id ${id} found`);
    }

    res.locals.agreement = agreement;
    next();
  } catch (e) {
    res.status(404).send(generateErrorMesaage(e));
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

export const validateGetTotalByIntervalRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const interval = req.query.interval as AGREEMENT_TOTAL_INTERVAL | undefined;
    if (!interval) {
      throw new Error("Please provide an interval");
    }

    if (!Object.values(AGREEMENT_TOTAL_INTERVAL).includes(interval)) {
      throw new Error(`Invalid interval: ${interval}`);
    }

    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};
