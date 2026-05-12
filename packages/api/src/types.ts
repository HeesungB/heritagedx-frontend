import type {
  ApprovalStatus,
  Pagination,
  TradeWorkflowStatus,
} from "@heritage-dx/types";

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
  isShared?: boolean;
  isConverted?: boolean;
  organizationId?: string;
  customerId?: string;
  // 상담 전용
  approvalStatus?: ApprovalStatus;
  linkedTradeId?: string;
  // 거래 전용
  workflowStatus?: TradeWorkflowStatus;
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
