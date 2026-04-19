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

/** Pagination (스펙) → PaginationState */
export function normalizePagination(
  p: Pagination | null | undefined,
): PaginationState {
  if (!p) {
    return {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };
  }
  return {
    page: p.page,
    limit: p.limit,
    total: p.total,
    totalPages: p.totalPages,
    hasNext: p.hasNext,
    hasPrev: p.hasPrev,
  };
}
