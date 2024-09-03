import { AGREEMENT_STATUS } from "@/types/agreement";

export const MAX_START_DATE_THRESHOLD = 30;
export const MIN_START_DATE_THRESHOLD = 1;

export const NON_ARCHIVED_AGREEMENT_STATUSES = [
  AGREEMENT_STATUS.Accepted,
  AGREEMENT_STATUS.Pending,
];
export const ARCHIVED_AGREEMENT_STATUSES = [
  AGREEMENT_STATUS.Declined,
  AGREEMENT_STATUS.Countered,
];
