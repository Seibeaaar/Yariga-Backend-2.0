import { FilterQuery, Model, PopulateOptions } from "mongoose";

export type PaginatedRequestConfig<T> = {
  model: Model<T>;
  query: FilterQuery<object>;
  page?: string;
  totalLimit?: number;
  populate?: PopulateOptions[];
};
