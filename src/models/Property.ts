import { MAX_RATING, MIN_RATING } from "@/constants/common";
import {
  MAX_AREA,
  MAX_BEDS,
  MAX_FLOORS,
  MAX_ROOMS,
  MAX_SALE_AMOUNT,
  MIN_AREA,
  MIN_BEDS,
  MIN_FLOORS,
  MIN_RENT_AMOUNT,
  MIN_ROOMS,
} from "@/constants/property";
import { AGREEMENT_TYPE } from "@/types/agreement";
import {
  PROPERTY_FACILITY,
  PROPERTY_PAYMENT_PERIOD,
  PROPERTY_TYPE,
} from "@/types/property";
import { Schema, model } from "mongoose";

const PropertySchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  photos: [
    {
      type: String,
      required: true,
    },
  ],
  type: {
    type: String,
    required: true,
    enum: {
      values: Object.values(PROPERTY_TYPE),
    },
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  agreementType: {
    type: String,
    required: true,
    enum: {
      values: Object.values(AGREEMENT_TYPE),
    },
  },
  amount: {
    type: String,
    required: true,
    min: MIN_RENT_AMOUNT,
    max: MAX_SALE_AMOUNT,
  },
  paymentPeriod: {
    type: String,
    required: true,
    enum: {
      values: Object.values(PROPERTY_PAYMENT_PERIOD),
    },
  },
  facilities: [
    {
      type: String,
      enum: {
        values: Object.values(PROPERTY_FACILITY),
      },
    },
  ],
  location: {
    title: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lon: {
      type: Number,
      required: true,
    },
  },
  beds: {
    type: Number,
    required: true,
    min: MIN_BEDS,
    max: MAX_BEDS,
  },
  area: {
    type: Number,
    requied: true,
    min: MIN_AREA,
    max: MAX_AREA,
  },
  rooms: {
    type: Number,
    required: true,
    min: MIN_ROOMS,
    max: MAX_ROOMS,
  },
  floors: {
    type: Number,
    required: true,
    min: MIN_FLOORS,
    max: MAX_FLOORS,
  },
  floorLevel: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    min: MIN_RATING,
    max: MAX_RATING,
    default: MIN_RATING,
  },
  votes: {
    type: Number,
    default: 0,
  },
});

export default model("Property", PropertySchema);
