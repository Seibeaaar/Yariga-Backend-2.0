import { FilterQuery, Model, PopulateOptions, SortOrder } from "mongoose";

export type PaginatedRequestConfig<T> = {
  model: Model<T>;
  query: FilterQuery<object>;
  page?: string;
  totalLimit?: number;
  populate?: PopulateOptions[];
  sort?: { [key: string]: SortOrder };
};
