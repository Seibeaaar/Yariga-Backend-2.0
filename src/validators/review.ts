import { MAX_RATING, MIN_RATING } from "@/constants/common";
import { REVIEW_OBJECT } from "@/types/review";
import { isValidObjectId } from "mongoose";
import * as yup from "yup";

export const REVIEW_DATA_VALIDATION_SCHEMA = yup.object({
  title: yup.string().required("Review title required").trim(),
  content: yup.string().required("Content title required").trim(),
  rating: yup
    .number()
    .required("Review rating required")
    .min(MIN_RATING)
    .max(MAX_RATING),
  reviewee: yup
    .string()
    .required("Reviewee id required")
    .test((v: string) => isValidObjectId(v)),
  object: yup
    .string()
    .required("Review object required")
    .oneOf(Object.values(REVIEW_OBJECT)),
});
