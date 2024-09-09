import { Request, Response, NextFunction } from "express";
import { REVIEW_DATA_VALIDATION_SCHEMA } from "@/validators/review";
import { generateErrorMesaage } from "@/utils/common";
import User from "@/models/User";
import Property from "@/models/Property";
import { REVIEW_OBJECT } from "@/types/review";

export const validateReviewRequestBody = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await REVIEW_DATA_VALIDATION_SCHEMA.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const validateReviewedObject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { object, reviewee } = req.body;
    const reviewedObject =
      object === REVIEW_OBJECT.User
        ? await User.findById(reviewee)
        : await Property.findById(reviewee);

    if (!reviewedObject) {
      throw new Error(`No ${object} with id ${reviewee} found`);
    }
    next();
  } catch (e) {
    res.status(404).send(generateErrorMesaage(e));
  }
};
