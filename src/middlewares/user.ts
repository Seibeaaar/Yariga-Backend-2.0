import { Request, Response, NextFunction } from "express";
import { USER_COMPLETE_SCHEMA } from "@/validators/user";
import { generateErrorMesaage } from "@/utils/common";

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
