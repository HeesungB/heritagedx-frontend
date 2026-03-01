// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 인증 API 응답 타입
export interface AuthApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// API 페이지네이션
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 검색/필터 파라미터
export interface SearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
