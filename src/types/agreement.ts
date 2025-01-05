import { AgreementSchema } from "@/models/Agreement";
import { InferSchemaType } from "mongoose";
import { OpUnitType } from "dayjs";

export enum AGREEMENT_TYPE {
  Sale = "sale",
  Rent = "rent",
}

export enum AGREEMENT_STATUS {
  Pending = "pending",
  Declined = "declined",
  Accepted = "accepted",
  Countered = "countered",
}

export enum AGREEMENT_TOTAL_INTERVAL {
  Monthly = "monthly",
  Daily = "daily",
  Weekly = "weekly",
  Yearly = "yearly",
}

export type AgreementDocument = InferSchemaType<typeof AgreementSchema>;

export type TotalByInterval = {
  name: string;
  value: number;
};

export type IntervalConfig = {
  [key in AGREEMENT_TOTAL_INTERVAL]: {
    unit: OpUnitType;
    format: string;
  };
};

export enum AGREEMENT_CREATOR_PARAM {
  Me = "me",
  Others = "others",
  All = "all",
}

export type FilterAgreementsRequest = {
  status: AGREEMENT_STATUS[];
  type: AGREEMENT_TYPE[];
  createdBefore?: string;
  createdAfter?: string;
};
