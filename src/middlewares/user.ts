import { Request, Response, NextFunction } from "express";
import { USER_COMPLETE_SCHEMA } from "@/validators/user";
import { generateErrorMesaage } from "@/utils/common";
import { PROPERTY_PREFERENCES_VALIDATION_SCHEMA } from "@/validators/common";

export const validateUserCompleteRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await USER_COMPLETE_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const validatePropertyPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await PROPERTY_PREFERENCES_VALIDATION_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};
