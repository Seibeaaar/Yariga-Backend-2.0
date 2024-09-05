import jwt from "jsonwebtoken";
import { COMMON_SERVER_ERROR } from "@/constants/common";
import { Document, FilterQuery, Model } from "mongoose";
import { PAGINATION_LIMIT } from "@/constants/common";

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

export const makePaginatedRequest = async <T>(
  model: Model<T>,
  query: FilterQuery<object>,
  page?: string,
  totalLimit?: number,
) => {
  const pageNumber = processPageQueryParam(page);
  const startIndex = (pageNumber - 1) * PAGINATION_LIMIT;
  const results = await model
    .find(query)
    .limit(totalLimit ?? Number.MAX_SAFE_INTEGER)
    .skip(startIndex)
    .limit(PAGINATION_LIMIT);
  const total = await model.find(query).countDocuments();

  return {
    total,
    page: pageNumber,
    results,
    pages: Math.ceil(total / PAGINATION_LIMIT),
  };
};
