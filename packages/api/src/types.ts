import type { ApprovalStatus, Pagination, WorkflowStatus } from "@heritage-dx/types";

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
  isShared?: boolean;
  organizationId?: string;
  customerId?: string;
  // 상담 전용
  approvalStatus?: ApprovalStatus;
  linkedTradeId?: string;
  isConverted?: boolean;
  // 거래 전용
  workflowStatus?: WorkflowStatus;
  sourceConsultationId?: string;
}

export interface PaginatedList<T> {
  items: T[];
  pagination: Pagination;
}

export interface UsersResponse {
  users: import("@heritage-dx/types").AdminUser[];
  pagination: Pagination;
}
