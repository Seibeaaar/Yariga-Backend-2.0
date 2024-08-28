import { Request, Response, NextFunction } from "express";
import { SIGN_UP_VALIDATION_SCHEMA } from "@/validators/auth";
import { generateErrorMesaage } from "@/utils/common";
import User from "@/models/User";

export const validateSignUpRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await SIGN_UP_VALIDATION_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const checkEmailAlreadyInUse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      throw new Error(`Email ${email} already in use`);
    }

    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};
