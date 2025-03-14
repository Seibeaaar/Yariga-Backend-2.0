import { Request, Response, NextFunction } from "express";
import { generateErrorMesaage, isDefined } from "@/utils/common";
import {
  CREATE_PROPERTY_VALIDATION_SCHEMA,
  UPDATE_PROPERTY_VALIDATION_SCHEMA,
} from "@/validators/property";
import Property from "@/models/Property";
import { MAX_PROPERTY_NUMBER } from "@/constants/property";
import { PROPERTY_STATUS } from "@/types/property";

export const validateCreatePropertyRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await CREATE_PROPERTY_VALIDATION_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const validateUpdatePropertyRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await UPDATE_PROPERTY_VALIDATION_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const checkPropertyByIdParam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) {
      throw new Error(`Property with id ${id} does not exist`);
    }
    res.locals.property = property;
    next();
  } catch (e) {
    res.status(404).send(generateErrorMesaage(e));
  }
};

export const checkPropertyOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { property, userId } = res.locals;
    if (!property.owner.equals(userId)) {
      throw new Error(
        "Only an owner of this property can perform such operations.",
      );
    }

    next();
  } catch (e) {
    res.status(403).send(generateErrorMesaage(e));
  }
};

export const checkPropertyNumberLimit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = res.locals;

    if (
      isDefined(user.properties) &&
      user.properties.length === MAX_PROPERTY_NUMBER
    ) {
      throw new Error(
        `You cannot exceed the limit of ${MAX_PROPERTY_NUMBER} propeerties in your ownership`,
      );
    }

    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const checkCanAddFirstProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = res.locals;

    if (isDefined(user.properties) && user.properties.length > 0) {
      throw new Error(`You've already added your first property`);
    }

    next();
  } catch (e) {
    res.status(403).send(generateErrorMesaage(e));
  }
};

export const checkPropertySearchQuery = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { q } = req.query;

    if (q === undefined || typeof q !== "string") {
      throw new Error("Please provide a search query");
    }

    if (q.trim().length === 0) {
      throw new Error("Invalid search query");
    }

    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const checkPropertyNotSold = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { property } = res.locals;
    if (property.status === PROPERTY_STATUS.Sold) {
      throw new Error("You cannot perform this operation on a sold property");
    }

    next();
  } catch (e) {
    res.status(403).send(generateErrorMesaage(e));
  }
};
