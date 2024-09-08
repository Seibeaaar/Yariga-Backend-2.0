import dayjs from "dayjs";
import week from "dayjs/plugin/weekOfYear";
import {
  AGREEMENT_STATUS,
  AGREEMENT_TOTAL_INTERVAL,
  Interval,
  TotalByInterval,
} from "@/types/agreement";
import Agreement from "@/models/Agreement";
import { USER_ROLE, User } from "@/types/user";
import { Types } from "mongoose";
import { AGGREGATE_CONFIG_BY_INTERVAL } from "@/constants/agreement";

dayjs.extend(week);

export const getAgreementUniqueNumber = () => {
  return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
};

export const calculateTotalByMonth = async (user: User) => {
  const currentMonth = dayjs().endOf("month");
  const months = Array.from({ length: 6 }).map((_, i) => {
    const month = currentMonth.subtract(i, "months");
    return {
      number: month.month() + 1,
      date: month.format("YYYY-MM"),
    };
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
  const days = Array.from({ length: 7 }).map((_, i) => {
    const day = currentDay.subtract(i, "days");
    return {
      number: day.day() + 1,
      date: day.format("YYYY-MM-DD"),
    };
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
  const weeks = Array.from({ length: 5 }).map((_, i) => {
    const week = currentWeek.subtract(i, "weeks");
    return {
      number: week.week() + 1,
      date: week.format("YYYY-MM-DD"),
    };
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
  const years = Array.from({ length: 5 }).map((_, i) => {
    const year = currentYear.subtract(i, "years");
    return {
      number: year.year(),
      date: year.format("YYYY"),
    };
  });

  const totalByYears = await aggregateTotalsByInterval(
    years,
    user,
    AGREEMENT_TOTAL_INTERVAL.Yearly,
  );

  return totalByYears;
};

const aggregateTotalsByInterval = async (
  intervals: Interval[],
  user: User,
  intervalUnit: AGREEMENT_TOTAL_INTERVAL,
) => {
  const userId = new Types.ObjectId(user.id);
  const { unit, format } = AGGREGATE_CONFIG_BY_INTERVAL[intervalUnit];
  const result = await Agreement.aggregate([
    {
      $match: {
        [user.role === USER_ROLE.Landlord ? "landlord" : "tenant"]: userId,
        status: AGREEMENT_STATUS.Accepted,
        startDate: {
          $gte: dayjs(intervals[intervals.length - 1].date)
            .startOf(unit)
            .toISOString(),
          $lte: dayjs(intervals[0].date).endOf(unit).toISOString(),
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

  const totalByIntervals = intervals.reduce(
    (acc: TotalByInterval, { number, date }) => {
      const found = result.find((r) => r._id === date);
      acc[number] = found ? found.totalAmount : 0;
      return acc;
    },
    {},
  );

  return totalByIntervals;
};
