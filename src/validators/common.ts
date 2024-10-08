import { MAX_RATING, MIN_RATING } from "@/constants/common";
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
  MIN_RENT_AMOUNT,
} from "@/constants/property";
import { AGREEMENT_TYPE } from "@/types/agreement";
import {
  PROPERTY_FACILITY,
  PROPERTY_PAYMENT_PERIOD,
  PROPERTY_TYPE,
} from "@/types/property";
import * as yup from "yup";
import { buildMinMaxValidation } from "@/utils/validation";

export const PROPERTY_PREFERENCES_VALIDATION_SCHEMA = yup.object({
  beds: buildMinMaxValidation(MIN_BEDS, MAX_BEDS, "beds"),
  floors: buildMinMaxValidation(MIN_FLOORS, MAX_FLOORS, "floors"),
  floorLevel: buildMinMaxValidation(
    MIN_FLOOR_LEVEL,
    MAX_FLOOR_LEVEL,
    "floor level",
  ),
  area: buildMinMaxValidation(MIN_AREA, MAX_AREA, "area"),
  amount: buildMinMaxValidation(MIN_RENT_AMOUNT, MAX_SALE_AMOUNT, "price"),
  rooms: buildMinMaxValidation(MIN_ROOMS, MAX_ROOMS, "rooms"),
  rating: buildMinMaxValidation(MIN_RATING, MAX_RATING, "rating"),
  agreementType: yup
    .array()
    .ensure()
    .required()
    .of(
      yup
        .mixed<AGREEMENT_TYPE>()
        .oneOf(Object.values(AGREEMENT_TYPE))
        .required(),
    ),
  propertyType: yup
    .array()
    .ensure()
    .required()
    .of(
      yup.mixed<PROPERTY_TYPE>().oneOf(Object.values(PROPERTY_TYPE)).required(),
    ),
  facilities: yup
    .array()
    .ensure()
    .required()
    .of(
      yup
        .mixed<PROPERTY_FACILITY>()
        .oneOf(Object.values(PROPERTY_FACILITY))
        .required(),
    ),
  paymemtPeriod: yup
    .array()
    .ensure()
    .required()
    .of(
      yup
        .mixed<PROPERTY_PAYMENT_PERIOD>()
        .oneOf(Object.values(PROPERTY_PAYMENT_PERIOD))
        .required(),
    ),
});
