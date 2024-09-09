import { ReviewSchema } from "@/models/Review";
import { InferSchemaType } from "mongoose";

export enum REVIEW_OBJECT {
  User = "User",
  Property = "Property",
}

export enum RATING_UPDATE {
  Increase = "increase",
  Decrease = "decrease",
  Recalculate = "recalculate",
}

export type ReviewDocument = InferSchemaType<typeof ReviewSchema>;
