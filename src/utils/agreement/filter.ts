import dayjs from "dayjs";
import {
  AGREEMENT_CREATOR_PARAM,
  AGREEMENT_TYPE,
  AgreementDocument,
  FilterAgreementsRequest,
} from "@/types/agreement";
import { USER_ROLE, User } from "@/types/user";
import { isDefined, valueOrDefault } from "../common";
import { FilterQuery } from "mongoose";
import { PROPERTY_PAYMENT_PERIOD } from "@/types/property";
import { getDefaultAgreementStatus } from "./shared";

const buildAgreementCreatorQuery = (userId: string, createdByFlag?: string) => {
  switch (createdByFlag) {
    case AGREEMENT_CREATOR_PARAM.Me:
      return { creator: userId };
    case AGREEMENT_CREATOR_PARAM.Others:
      return { creator: { $ne: userId } };
    default:
      return {};
  }
};

export const buildAgreementGetQuery = (
  user: User,
  isArchived: boolean,
  createdByFlag?: string,
) => {
  return {
    [user.role === USER_ROLE.Landlord ? "landlord" : "tenant"]: user.id,
    isArchived,
    ...buildAgreementCreatorQuery(user.id, createdByFlag),
  };
};

const buildAgreementCreateTimeQuery = (
  createdBefore?: string,
  createdAfter?: string,
) => {
  const beforeLimitImposed = isDefined(createdBefore);
  const afterLimitImposed = isDefined(createdAfter);

  if (!beforeLimitImposed && !afterLimitImposed) return {};

  const query = {} as FilterQuery<AgreementDocument>;

  if (afterLimitImposed) {
    query.$gte = dayjs(createdAfter).startOf("day").toISOString();
  }

  if (beforeLimitImposed) {
    query.$lte = dayjs(createdBefore).endOf("day").toISOString();
  }

  return { createdAt: query };
};

export const buildAgreementFilterQuery = (
  isArchived: boolean,
  request: FilterAgreementsRequest,
) => {
  return {
    status: {
      $in: valueOrDefault(
        request.status,
        getDefaultAgreementStatus(isArchived),
      ),
    },
    type: {
      $in: valueOrDefault(request.type, Object.values(AGREEMENT_TYPE)),
    },
    paymentPeriod: {
      $in: valueOrDefault(
        request.paymentPeriod,
        Object.values(PROPERTY_PAYMENT_PERIOD),
      ),
    },
    ...buildAgreementCreateTimeQuery(
      request.createdBefore,
      request.createdAfter,
    ),
  };
};
