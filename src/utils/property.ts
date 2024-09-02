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
  MIN_RENT_AMOUNT,
  MIN_ROOMS,
} from "@/constants/property";
import { AGREEMENT_TYPE } from "@/types/agreement";
import {
  PROPERTY_PAYMENT_PERIOD,
  PROPERTY_TYPE,
  PropertyFilters,
} from "@/types/property";

export const buildPropertyFiltersQuery = (filters: PropertyFilters) => {
  return {
    amount: {
      $gte: filters.amount?.min || MIN_RENT_AMOUNT,
      $lte: filters.amount?.max || MAX_SALE_AMOUNT,
    },
    beds: {
      $gte: filters.beds?.min || MIN_BEDS,
      $lte: filters.beds?.max || MAX_BEDS,
    },
    rooms: {
      $gte: filters.rooms?.min || MIN_ROOMS,
      $lte: filters.rooms?.max || MAX_ROOMS,
    },
    floors: {
      $gte: filters.floors?.min || MIN_FLOORS,
      $lte: filters.floors?.max || MAX_FLOORS,
    },
    floorLevel: {
      $gte: filters.floorLevel?.min || MIN_FLOOR_LEVEL,
      $lte: filters.floorLevel?.max || MAX_FLOOR_LEVEL,
    },
    rating: {
      $gte: filters.rating?.min || MIN_RATING,
      $lte: filters.rating?.max || MAX_RATING,
    },
    area: {
      $gte: filters.area?.min || MIN_AREA,
      $lte: filters.area?.max || MAX_AREA,
    },
    agreementType: {
      $in: filters.agreementType ?? Object.values(AGREEMENT_TYPE),
    },
    type: {
      $in: filters.propertyType ?? Object.values(PROPERTY_TYPE),
    },
    paymentPeriod: {
      $in: filters.paymentPeriod ?? Object.values(PROPERTY_PAYMENT_PERIOD),
    },
    ...(filters.facilities && {
      facilities: {
        $in: filters.facilities,
      },
    }),
  };
};
