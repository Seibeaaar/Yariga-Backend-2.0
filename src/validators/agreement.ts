import {
  MAX_START_DATE_THRESHOLD,
  MIN_START_DATE_THRESHOLD,
} from "@/constants/agreement";
import { MAX_SALE_AMOUNT, MIN_RENT_AMOUNT } from "@/constants/property";
import { AGREEMENT_TYPE } from "@/types/agreement";
import { PROPERTY_PAYMENT_PERIOD } from "@/types/property";
import { getDefaultAgreementStatus } from "@/utils/agreement";
import dayjs from "dayjs";
import { isValidObjectId } from "mongoose";
import * as yup from "yup";

export const buildAgreementFiltersSchema = (isArchived: boolean) => {
  const statuses = getDefaultAgreementStatus(isArchived);
  return yup.object({
    type: yup.array().of(yup.string().oneOf(Object.values(AGREEMENT_TYPE))),
    status: yup.array().of(yup.string().oneOf(Object.values(statuses))),
  });
};

export const AGREEMENT_VALIDATION_SCHEMA = yup.object({
  tenant: yup
    .string()
    .required("Tenant required")
    .test((v: string) => isValidObjectId(v)),
  landlord: yup
    .string()
    .required("Landlord required")
    .test((v: string) => isValidObjectId(v)),
  property: yup
    .string()
    .required("Property required")
    .test((v: string) => isValidObjectId(v)),
  type: yup
    .mixed<AGREEMENT_TYPE>()
    .required("Agreement type required")
    .oneOf(Object.values(AGREEMENT_TYPE)),
  amount: yup
    .number()
    .required("Agreement amount required")
    .min(MIN_RENT_AMOUNT)
    .max(MAX_SALE_AMOUNT),
  startDate: yup
    .string()
    .required("Start date required")
    .test("startDate", "Invalid start date", (v: string) => dayjs(v).isValid())
    .test(
      "startDate",
      "Start date should be in the future",
      (v: string) => dayjs(v).diff(dayjs(), "d") >= MIN_START_DATE_THRESHOLD,
    )
    .test(
      "startDate",
      `Start date should not be in more than ${MAX_START_DATE_THRESHOLD} days`,
      (v: string) => dayjs(v).diff(dayjs(), "d") <= MAX_START_DATE_THRESHOLD,
    ),
  endDate: yup
    .string()
    .when("type", ([type], schema) => {
      if (type === AGREEMENT_TYPE.Rent) {
        return schema.required("End date required");
      }

      return schema;
    })
    .test("endDate", "Invalid end date", (v?: string) => dayjs(v).isValid())
    .test({
      name: "endDate",
      params: {
        startDate: yup.ref("startDate"),
      },
      test: function (v?: string) {
        const { startDate } = this.parent as yup.AnyObject;
        return (
          dayjs(v).isValid() &&
          dayjs(v).diff(dayjs(startDate), "d") >= MIN_START_DATE_THRESHOLD
        );
      },
    }),
  parent: yup.string().test((v?: string) => {
    if (v) {
      return isValidObjectId(v);
    }
    return true;
  }),
  paymentPeriod: yup
    .mixed<PROPERTY_PAYMENT_PERIOD>()
    .required("Payment period required")
    .oneOf(Object.values(PROPERTY_PAYMENT_PERIOD)),
});
