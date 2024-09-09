import { MAX_RATING, MIN_RATING } from "@/constants/common";
import { REVIEW_OBJECT } from "@/types/review";
import { Schema, model } from "mongoose";

export const ReviewSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: MIN_RATING,
    max: MAX_RATING,
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: String,
    default: new Date().toISOString(),
  },
  reviewee: {
    type: Schema.Types.ObjectId,
    refPath: "object",
  },
  object: {
    type: String,
    required: true,
    enum: {
      values: Object.values(REVIEW_OBJECT),
    },
  },
});

export default model("Review", ReviewSchema);
