import {
  AGREEMENT_STATUS,
  AGREEMENT_TOTAL_INTERVAL,
  IntervalConfig,
} from "@/types/agreement";

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

export const AGGREGATE_CONFIG_BY_INTERVAL: IntervalConfig = {
  [AGREEMENT_TOTAL_INTERVAL.Daily]: {
    unit: "day",
    format: "%Y-%m-%d",
  },
  [AGREEMENT_TOTAL_INTERVAL.Weekly]: {
    unit: "week",
    format: "%V",
  },
  [AGREEMENT_TOTAL_INTERVAL.Monthly]: {
    unit: "month",
    format: "%Y-%m",
  },
  [AGREEMENT_TOTAL_INTERVAL.Yearly]: {
    unit: "year",
    format: "%Y",
  },
};

export const MONTH_STATS_THRESHOLD = 6;
export const DAY_STATS_THRESHOLD = 7;
export const WEEK_STATS_THRESHOLD = 5;
export const YEAR_STATS_THRESHOLD = 5;
