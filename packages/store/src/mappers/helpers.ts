import type { Pagination } from "@heritage-dx/types";
import type { PaginationState } from "../entities/common";

/** string | number | null → number | null */
export function coerceToNumber(val: string | number | null | undefined): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

/** number | Record<string, number> | undefined → Record<string, number> */
export function normalizeGreenFee(
  val: number | Record<string, number> | undefined,
): Record<string, number> {
  if (val == null) return {};
  if (typeof val === "number") return { 기본: val };
  return val;
}

/** 3가지 페이지네이션 포맷 → PaginationState 통합 */
export function normalizePagination(
  p:
    | Pagination
    | { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number }
    | null
    | undefined,
): PaginationState {
  if (!p) {
    return {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 20,
      hasNext: false,
      hasPrev: false,
    };
  }

  // TradeMemosResponse / TradeRecordsResponse 형식
  if ("currentPage" in p) {
    return {
      currentPage: p.currentPage,
      totalPages: p.totalPages,
      totalItems: p.totalItems,
      itemsPerPage: p.itemsPerPage,
      hasNext: p.currentPage < p.totalPages,
      hasPrev: p.currentPage > 1,
    };
  }

  // Pagination 형식 (from @heritage-dx/types)
  return {
    currentPage: p.page,
    totalPages: p.totalPages,
    totalItems: p.total,
    itemsPerPage: p.limit,
    hasNext: p.hasNext,
    hasPrev: p.hasPrev,
  };
}
