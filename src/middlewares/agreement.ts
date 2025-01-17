import { Request, Response, NextFunction } from "express";
import {
  CREATE_AGREEMENT_SCHEMA,
  AGREEMENT_UPDATE_SCHEMA,
  buildAgreementFiltersSchema,
} from "@/validators/agreement";
import { generateErrorMesaage } from "@/utils/common";
import Property from "@/models/Property";
import Agreement from "@/models/Agreement";
import { convertQueryParamToBoolean } from "@/utils/common";
import { AGREEMENT_TOTAL_INTERVAL } from "@/types/agreement";
import { PROPERTY_STATUS } from "@/types/property";

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

export const validateAgreementProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { property } = req.body;

    const propertyDoc = await Property.findById(property);

    if (!propertyDoc) {
      res.statusCode = 404;
      throw new Error(`No property with id ${property} found.`);
    }

    if (propertyDoc.status !== PROPERTY_STATUS.Free) {
      res.statusCode = 403;
      throw new Error(
        "You cannot create an agreement for a property that is not available.",
      );
    }

    res.locals.landlord = propertyDoc.owner;
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

export const checkIsAgreementPart = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, agreement } = res.locals;

    if (
      !agreement.landlord.equals(userId) &&
      !agreement.tenant.equals(userId)
    ) {
      throw new Error("You cannot access an agreement you are not a part of");
    }

    next();
  } catch (e) {
    res.status(403).send(generateErrorMesaage(e));
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
