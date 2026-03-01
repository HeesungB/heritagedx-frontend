export type FetchStatus = "idle" | "loading" | "refreshing" | "success" | "error";

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}
