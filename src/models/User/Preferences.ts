import {
  PROPERTY_FACILITY,
  PROPERTY_PAYMENT_PERIOD,
  PROPERTY_TYPE,
} from "@/types/property";
import { AGREEMENT_TYPE } from "@/types/agreement";
import {
  MAX_AREA,
  MAX_BEDS,
  MAX_FLOORS,
  MAX_FLOOR_LEVEL,
  MAX_ROOMS,
  MAX_SALE_AMOUNT,
  MIN_AREA,
  MIN_BEDS,
  MIN_FLOORS,
  MIN_FLOOR_LEVEL,
  MIN_ROOMS,
  MIN_SALE_AMOUNT,
} from "@/constants/property";
import { MAX_RATING, MIN_RATING } from "@/constants/common";
import { Schema } from "mongoose";

const constructMinMaxPair = (min: number, max: number) => ({
  min: {
    type: Number,
    min,
  },
  max: {
    type: Number,
    max,
  },
});

export const PropertyPreferences = new Schema(
  {
    agreementType: {
      type: String,
      enum: {
        values: Object.values(AGREEMENT_TYPE),
      },
    },
    facilities: {
      type: [
        {
          type: String,
          enum: {
            values: Object.values(PROPERTY_FACILITY),
          },
        },
      ],
      default: undefined,
    },
    propertyType: {
      type: String,
      enum: {
        values: Object.values(PROPERTY_TYPE),
      },
    },
    beds: constructMinMaxPair(MIN_BEDS, MAX_BEDS),
    rooms: constructMinMaxPair(MIN_ROOMS, MAX_ROOMS),
    area: constructMinMaxPair(MIN_AREA, MAX_AREA),
    amount: constructMinMaxPair(MIN_SALE_AMOUNT, MAX_SALE_AMOUNT),
    paymentPeriod: {
      type: String,
      enum: {
        values: Object.values(PROPERTY_PAYMENT_PERIOD),
      },
    },
    rating: constructMinMaxPair(MIN_RATING, MAX_RATING),
    floors: constructMinMaxPair(MIN_FLOORS, MAX_FLOORS),
    floorLevel: constructMinMaxPair(MIN_FLOOR_LEVEL, MAX_FLOOR_LEVEL),
  },
  { _id: false },
);
