import { Request, Response, NextFunction } from "express";
import { generateErrorMesaage } from "@/utils/common";
import { PROPERTY_DATA_VALIDATION_SCHEMA } from "@/validators/property";

export const validatePropertyRequestBody = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await PROPERTY_DATA_VALIDATION_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};
