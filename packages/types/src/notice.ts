import type { Pagination } from "./api";

// 공지 첨부파일 (OpenAPI NoticeFileResponseDto)
export interface NoticeFile {
  id: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  downloadUrl?: string;
  downloadUrlExpiresAt?: string;
  createdAt: string;
}

// 공지사항 (OpenAPI NoticeResponseDto)
export interface Notice {
  id: string;
  title: string;
  content: string;
  files?: NoticeFile[];
  createdAt: string;
  updatedAt: string;
}

export interface NoticeInput {
  title: string;
  content: string;
}

export interface NoticesData {
  notices: Notice[];
  pagination: Pagination;
}
