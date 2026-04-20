// 클라이언트 측 Result 타입
// `@heritage-dx/api-client` 의 ApiClient.request() 반환형이며, 서버 응답 envelope 과는 다르다.
// - 성공 시: { success: true, data: T }
// - 실패 시: { success: false, error: string }
// 서버 원본 envelope 은 ServerEnvelope<T> / ServerErrorEnvelope 참고.
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  errorDetails?: Record<string, unknown> | null;
}

// 인증 API 응답 타입 (ApiResponse 와 동일 모양이지만 의도적으로 분리 유지)
export interface AuthApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 서버 응답 envelope (OpenAPI 스펙 ApiResponseDto 대응)
// `docs/api/README.md` 의 "공통 응답 포맷" 섹션 참조.
export interface ServerEnvelope<T> {
  success: true;
  data: T;
  timestamp: string;
}

// 서버 에러 응답 (OpenAPI 스펙 ErrorResponseDto 대응)
export interface ServerErrorEnvelope {
  success: false;
  error: ErrorDto;
  timestamp: string;
}

// 서버 에러 본문 (OpenAPI 스펙 ErrorDto 대응)
export interface ErrorDto {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

// 공통 페이지네이션 (OpenAPI 스펙 PaginationMetaDto 대응)
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
