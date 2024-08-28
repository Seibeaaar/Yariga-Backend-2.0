import { generateErrorMesaage } from "@/utils/common";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const verifyJWToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      res.statusCode = 401;
      throw new Error("No authorization header provided");
    }
    const token = authorization?.split(" ")[1];
    if (!token) {
      res.statusCode = 401;
      throw new Error("No token provided");
    }
    jwt.verify(token!, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        res.statusCode = 403;
        throw new Error("Invalid JWT token");
      } else {
        const { data } = decoded as JwtPayload;
        res.locals.userId = data;
        next();
      }
    });
  } catch (e) {
    res.send(generateErrorMesaage(e));
  }
};
