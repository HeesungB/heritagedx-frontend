export type FetchStatus = "idle" | "loading" | "refreshing" | "success" | "error";

// 스펙 PaginationMetaDto 와 동일 키셋
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
