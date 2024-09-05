import { AgreementSchema } from "@/models/Agreement";
import { InferSchemaType } from "mongoose";

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

export type AgreementDocument = InferSchemaType<typeof AgreementSchema>;
