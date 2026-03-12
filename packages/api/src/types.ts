import type { Pagination } from "@heritage-dx/types";

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface TradeListParams extends ListParams {
  tradeType?: string;
  clubId?: string;
  sort?: string;
  order?: "ASC" | "DESC";
  isDone?: boolean;
}

export interface PaginatedList<T> {
  items: T[];
  pagination: Pagination;
}

export interface UsersResponse {
  users: import("@heritage-dx/types").AdminUser[];
  pagination: Pagination;
}
