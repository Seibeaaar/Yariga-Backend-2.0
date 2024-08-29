import User from "@/models/User";
import { USER_ROLE } from "@/types/user";
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

export const fetchUserFromTokenData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = res.locals;
    if (!userId) {
      res.statusCode = 403;
      throw new Error("No user id from token provided");
    }

    const user = await User.findById(userId);

    if (!user) {
      res.statusCode = 404;
      throw new Error(`No use with id ${userId} found`);
    }

    res.locals.user = user;
    next();
  } catch (e) {
    res.send(generateErrorMesaage(e));
  }
};

export const checkIfTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = res.locals;
    if (user.role !== USER_ROLE.Tenant) {
      throw new Error("Only tenant is allowed to perform this operation.");
    }

    next();
  } catch (e) {
    res.status(403).send(generateErrorMesaage(e));
  }
};

export const checkIfLandlord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = res.locals;
    if (user.role !== USER_ROLE.Landlord) {
      throw new Error("Only landlord is allowed to perform this operation.");
    }
    next();
  } catch (e) {
    res.status(403).send(generateErrorMesaage(e));
  }
};
