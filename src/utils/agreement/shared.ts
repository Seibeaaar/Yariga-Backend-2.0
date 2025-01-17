import {
  ARCHIVED_AGREEMENT_STATUSES,
  NON_ARCHIVED_AGREEMENT_STATUSES,
} from "@/constants/agreement";
import { castToObjectId } from "../common";
import { AgreementDocument } from "@/types/agreement";
import { Document } from "mongoose";

export const getAgreementCounterpart = (
  agreement: AgreementDocument,
  userId: string,
) => {
  return [agreement.landlord, agreement.tenant].find(
    (part) => part !== castToObjectId(userId),
  );
};

export const getAgreementUniqueNumber = () => {
  return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
};

export const getDefaultAgreementStatus = (isArchived: boolean) =>
  isArchived ? ARCHIVED_AGREEMENT_STATUSES : NON_ARCHIVED_AGREEMENT_STATUSES;

export const populateAgreement = async (agreement: Document | null) => {
  return await agreement?.populate([
    {
      path: "landlord",
      select: "-password",
    },
    {
      path: "tenant",
      select: "-password",
    },
    {
      path: "parent",
      populate: "property",
    },
    {
      path: "property",
    },
  ]);
};
