import { MAX_SALE_AMOUNT, MIN_RENT_AMOUNT } from "@/constants/property";
import { AGREEMENT_STATUS, AGREEMENT_TYPE } from "@/types/agreement";
import { Schema, model } from "mongoose";

export const AgreementSchema = new Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  landlord: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  property: {
    type: Schema.Types.ObjectId,
    ref: "Property",
  },
  amount: {
    type: Number,
    required: true,
    min: MIN_RENT_AMOUNT,
    max: MAX_SALE_AMOUNT,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
  },
  type: {
    type: String,
    required: true,
    enum: {
      values: Object.values(AGREEMENT_TYPE),
    },
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: Object.values(AGREEMENT_STATUS),
    },
    default: AGREEMENT_STATUS.Pending,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Agreement",
    default: null,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: String,
    default: new Date().toISOString(),
  },
  uniqueNumber: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: String,
    default: null,
  },
});

export default model("Agreement", AgreementSchema);
