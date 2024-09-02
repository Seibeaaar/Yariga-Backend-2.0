import { Request, Response, NextFunction } from "express";
import { generateErrorMesaage } from "@/utils/common";
import { PROPERTY_DATA_VALIDATION_SCHEMA } from "@/validators/property";
import Property from "@/models/Property";

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
