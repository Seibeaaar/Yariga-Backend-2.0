import dayjs from "dayjs";
import week from "dayjs/plugin/weekOfYear";
import {
  AGREEMENT_CREATOR_PARAM,
  AGREEMENT_STATUS,
  AGREEMENT_TOTAL_INTERVAL,
  AgreementDocument,
  TotalByInterval,
} from "@/types/agreement";
import Agreement from "@/models/Agreement";
import { USER_ROLE, User } from "@/types/user";
import {
  AGGREGATE_CONFIG_BY_INTERVAL,
  DAY_STATS_THRESHOLD,
  MONTH_STATS_THRESHOLD,
  WEEK_STATS_THRESHOLD,
  YEAR_STATS_THRESHOLD,
} from "@/constants/agreement";
import { castToObjectId } from "./common";

dayjs.extend(week);

export const getAgreementUniqueNumber = () => {
  return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
};

const buildAgreementCreatorQuery = (
  userId: string,
  createdByMeFlag?: string,
) => {
  switch (createdByMeFlag) {
    case AGREEMENT_CREATOR_PARAM.Mine:
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
  createdByMeFlag?: string,
) => {
  return {
    [user.role === USER_ROLE.Landlord ? "landlord" : "tenant"]: user.id,
    isArchived,
    ...buildAgreementCreatorQuery(user.id, createdByMeFlag),
  };
};

export const getAgreementCounterpart = (
  agreement: AgreementDocument,
  userId: string,
) => {
  return [agreement.landlord, agreement.tenant].find(
    (part) => part !== castToObjectId(userId),
  );
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
  const result = await Agreement.aggregate([
    {
      $match: {
        [user.role === USER_ROLE.Landlord ? "landlord" : "tenant"]: userId,
        status: AGREEMENT_STATUS.Accepted,
        startDate: {
          $gte: dayjs(dates[0]).startOf(unit).toISOString(),
          $lte: dayjs(dates[dates.length - 1])
            .endOf(unit)
            .toISOString(),
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: {
              $dateFromString: { dateString: "$startDate", format: "%Y-%m-%d" },
            },
          },
        },
        totalAmount: { $sum: "$amount" },
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
