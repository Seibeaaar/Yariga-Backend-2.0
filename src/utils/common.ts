import jwt from "jsonwebtoken";
import { COMMON_SERVER_ERROR } from "@/constants/common";
import { Document } from "mongoose";

export const generateErrorMesaage = (e: unknown) => {
  if (e instanceof Error) {
    return e.message;
  }
  return COMMON_SERVER_ERROR;
};

export const signJWT = (userId: string) => {
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      data: userId,
    },
    process.env.JWT_SECRET!,
  );
};

export const omitPasswordForUser = (user: Document) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...rest } = user.toObject();
  return rest;
};
