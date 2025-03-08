import jwt from "jsonwebtoken";
import { COMMON_SERVER_ERROR } from "@/constants/common";
import { Document, Types } from "mongoose";
import { PAGINATION_LIMIT } from "@/constants/common";
import { PaginatedRequestConfig } from "@/types/common";

export const generateErrorMesaage = (e: unknown) => {
  if (e instanceof Error) {
    return e.message;
  }
  return COMMON_SERVER_ERROR;
};

export const signJWT = (userId: string) => {
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
      data: userId,
    },
    process.env.JWT_SECRET!,
  );
};

export const omitPasswordForUser = (user: Document) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...rest } = user.toObject();
  return rest;
};

const processPageQueryParam = (pageParam: string | undefined): number => {
  if (!pageParam || Number.isNaN(+pageParam)) {
    return 1;
  }

  return +pageParam;
};

const calculatePagination = (page?: string, totalLimit?: number) => {
  const pageNumber = processPageQueryParam(page);
  const startIndex = (pageNumber - 1) * PAGINATION_LIMIT;
  const remainingLimit = totalLimit
    ? Math.max(0, totalLimit - startIndex)
    : PAGINATION_LIMIT;
  const effectivePageLimit = Math.min(PAGINATION_LIMIT, remainingLimit);

  return { pageNumber, startIndex, effectivePageLimit };
};

export const makePaginatedRequest = async <T>(
  config: PaginatedRequestConfig<T>,
) => {
  const { page, model, query, totalLimit, populate = [] } = config;
  const { pageNumber, startIndex, effectivePageLimit } = calculatePagination(
    page,
    totalLimit,
  );

  const results = await model
    .find(query)
    .skip(startIndex)
    .limit(effectivePageLimit)
    .populate(populate);

  const total = await model.countDocuments(query);

  return {
    total,
    page: pageNumber,
    results,
    pages: Math.ceil(total / PAGINATION_LIMIT),
  };
};

export const castToObjectId = (id: string) => new Types.ObjectId(id);

export const isDefined = <T>(
  value: T | null | undefined,
): value is NonNullable<T> => {
  return value !== null && value !== undefined;
};

export const convertQueryParamToBoolean = (queryParam?: string) => {
  return queryParam === "true";
};

export const valueOrDefault = <T>(value: T | T[], fallback: T | T[]) => {
  const isEmptyArray = Array.isArray(value) && value.length === 0;
  if (!isDefined(value) || isEmptyArray) return fallback;
  return value;
};
