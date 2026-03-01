import type { Pagination } from "@heritage-dx/types";

const DEFAULT_PAGINATION: Pagination = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

/**
 * Normalize various API response formats into a consistent structure.
 *
 * Handles 3 response formats:
 * 1. { [key]: [...], pagination } — standard format
 * 2. [...] — array format
 * 3. { ...spread, meta } — spread + meta format
 */
export function normalizeListResponse<T>(
  data: unknown,
  listKey: string,
  identifierKey: string = "id",
): { items: T[]; pagination: Pagination } {
  if (!data || typeof data !== "object") {
    return { items: [], pagination: DEFAULT_PAGINATION };
  }

  const obj = data as Record<string, unknown>;

  // Format 1: { [listKey]: [...], pagination }
  if (obj[listKey] && Array.isArray(obj[listKey])) {
    return {
      items: obj[listKey] as T[],
      pagination: (obj.pagination as Pagination) || {
        ...DEFAULT_PAGINATION,
        total: (obj[listKey] as T[]).length,
      },
    };
  }

  // Format 2: data is array
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      pagination: {
        ...DEFAULT_PAGINATION,
        total: (data as T[]).length,
      },
    };
  }

  // Format 3: { ...spread, meta }
  if (obj.meta) {
    const items = Object.values(obj).filter(
      (v) => typeof v === "object" && v !== null && identifierKey in v,
    ) as T[];
    return {
      items,
      pagination: obj.meta as Pagination,
    };
  }

  return { items: [], pagination: DEFAULT_PAGINATION };
}
