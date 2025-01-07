import dayjs from "dayjs";
import week from "dayjs/plugin/weekOfYear";
import {
  AGREEMENT_STATUS,
  AGREEMENT_TOTAL_INTERVAL,
  AGREEMENT_TYPE,
  TotalByInterval,
} from "@/types/agreement";
import Agreement from "@/models/Agreement";
import { USER_ROLE, User } from "@/types/user";
import {
  AGGREGATE_CONFIG_BY_INTERVAL,
  DAY_STATS_THRESHOLD,
  MONTH_STATS_THRESHOLD,
  YEAR_STATS_THRESHOLD,
  WEEK_STATS_THRESHOLD,
} from "@/constants/agreement";
import { castToObjectId } from "../common";
import { PROPERTY_PAYMENT_PERIOD } from "@/types/property";

dayjs.extend(week);

export const calculateTotalByWeeks = async (user: User) => {
  const currentWeek = dayjs().endOf("week");
  const weeks = Array.from({ length: WEEK_STATS_THRESHOLD }).map((_, i) => {
    const week = currentWeek.subtract(WEEK_STATS_THRESHOLD - (i + 1), "weeks");
    return week.format("YYYY-MM-DD");
  });

  const totalByWeeks = await aggregateTotalsByInterval(
    weeks,
    user,
    AGREEMENT_TOTAL_INTERVAL.Weekly,
  );

  return totalByWeeks;
};

export const calculateTotalByMonth = async (user: User) => {
  const currentMonth = dayjs().endOf("month");
  const months = Array.from({ length: MONTH_STATS_THRESHOLD }).map((_, i) => {
    const month = currentMonth.subtract(
      MONTH_STATS_THRESHOLD - (i + 1),
      "months",
    );
    return month.format("YYYY-MM");
  });

  const totalByMonths = await aggregateTotalsByInterval(
    months,
    user,
    AGREEMENT_TOTAL_INTERVAL.Monthly,
  );

  return totalByMonths;
};

export const calculateTotalByDays = async (user: User) => {
  const currentDay = dayjs().endOf("day");
  const days = Array.from({ length: DAY_STATS_THRESHOLD }).map((_, i) => {
    const day = currentDay.subtract(DAY_STATS_THRESHOLD - (i + 1), "days");
    return day.format("YYYY-MM-DD");
  });

  const totalByDays = await aggregateTotalsByInterval(
    days,
    user,
    AGREEMENT_TOTAL_INTERVAL.Daily,
  );

  return totalByDays;
};

export const calculateTotalByYears = async (user: User) => {
  const currentYear = dayjs().endOf("year");
  const years = Array.from({ length: YEAR_STATS_THRESHOLD }).map((_, i) => {
    const year = currentYear.subtract(YEAR_STATS_THRESHOLD - (i + 1), "years");
    return year.format("YYYY");
  });

  const totalByYears = await aggregateTotalsByInterval(
    years,
    user,
    AGREEMENT_TOTAL_INTERVAL.Yearly,
  );

  return totalByYears;
};

const getNameByIntervalUnit = (
  unit: AGREEMENT_TOTAL_INTERVAL,
  date: string,
) => {
  const dateObject = dayjs(date);
  switch (unit) {
    case AGREEMENT_TOTAL_INTERVAL.Daily:
      return dateObject.format("DD.MM");
    case AGREEMENT_TOTAL_INTERVAL.Monthly:
      return dateObject.format("MMM");
    case AGREEMENT_TOTAL_INTERVAL.Weekly:
      return `Week ${dateObject.week()}`;
    default:
      return dateObject.format("YYYY");
  }
};

const aggregateTotalsByInterval = async (
  dates: string[],
  user: User,
  intervalUnit: AGREEMENT_TOTAL_INTERVAL,
) => {
  const userId = castToObjectId(user.id);
  const { unit, format } = AGGREGATE_CONFIG_BY_INTERVAL[intervalUnit];

  const intervalStart = dayjs(dates[0]).startOf(unit).toISOString();
  const intervalEnd = dayjs(dates[dates.length - 1])
    .endOf(unit)
    .toISOString();

  const result = await Agreement.aggregate([
    {
      $match: {
        [user.role === USER_ROLE.Landlord ? "landlord" : "tenant"]: userId,
        status: AGREEMENT_STATUS.Accepted,
        startDate: {
          $lte: intervalEnd,
          $gte: intervalStart,
        },
      },
    },
    {
      $project: {
        startDate: 1,
        amount: 1,
        paymentPeriod: 1,
        type: 1,
        iterations: {
          $cond: {
            if: {
              $eq: ["$type", AGREEMENT_TYPE.Rent],
            },
            then: {
              $dateDiff: {
                startDate: {
                  $max: [{ $toDate: intervalStart }, { $toDate: "$startDate" }],
                },
                endDate: {
                  $min: [{ $toDate: "$endDate" }, { $toDate: intervalEnd }],
                },
                unit: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            "$paymentPeriod",
                            PROPERTY_PAYMENT_PERIOD.Monthly,
                          ],
                        },
                        then: "month",
                      },
                      {
                        case: {
                          $eq: [
                            "$paymentPeriod",
                            PROPERTY_PAYMENT_PERIOD.Yearly,
                          ],
                        },
                        then: "year",
                      },
                      {
                        case: {
                          $eq: [
                            "$paymentPeriod",
                            PROPERTY_PAYMENT_PERIOD.Weekly,
                          ],
                        },
                        then: "week",
                      },
                    ],
                    default: "day",
                  },
                },
                startOfWeek: "mon",
              },
            },
            else: 1,
          },
        },
      },
    },
    {
      $addFields: {
        totalAmount: {
          $multiply: ["$iterations", "$amount"],
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: "$agreementStart",
          },
        },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return dates.reduce((acc: TotalByInterval[], date) => {
    const periodInfo = result.find((r) => r._id === date);
    const totalValue = periodInfo ? periodInfo.totalAmount : 0;
    const periodName = getNameByIntervalUnit(intervalUnit, date);
    acc.push({
      name: periodName,
      value: totalValue,
    });
    return acc;
  }, []);
};
