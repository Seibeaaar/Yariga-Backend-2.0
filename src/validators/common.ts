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
import { buildMinMaxValidation, createEnumValidator } from "@/utils/validation";

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
  agreementType: createEnumValidator(AGREEMENT_TYPE),
  propertyType: createEnumValidator(PROPERTY_TYPE),
  facilities: yup.array().of(createEnumValidator(PROPERTY_FACILITY)),
  paymemtPeriod: createEnumValidator(PROPERTY_PAYMENT_PERIOD),
});
