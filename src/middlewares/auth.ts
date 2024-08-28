import { compareSync } from "bcrypt";
import { Request, Response, NextFunction } from "express";
import {
  SIGN_UP_VALIDATION_SCHEMA,
  LOGIN_VALIDATION_SCHEMA,
} from "@/validators/auth";
import { generateErrorMesaage } from "@/utils/common";
import User from "@/models/User";
import { AUTH_PROVIDER } from "@/types/user";

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

export const validateLoginRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await LOGIN_VALIDATION_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const validateLoginCredentials = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email,
      provider: AUTH_PROVIDER.Password,
    });

    if (!user) {
      throw new Error(`No user with such credentials found`);
    }

    const isPasswordCorrect = compareSync(password, user.password);

    if (!isPasswordCorrect) {
      throw new Error(`No user with such credentials found`);
    }
    res.locals.user = user;
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};
