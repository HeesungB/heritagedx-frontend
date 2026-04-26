import type {
  AdminConsultationAction,
  ApiResponse,
  ApprovalActionInput,
  Consultation,
  ConsultationInput,
  ConsultationsResponse,
} from "@heritage-dx/types";
import type { TradeListParams } from "../../types";

export interface IConsultationAdminRepository {
  getAll(params?: TradeListParams): Promise<ApiResponse<ConsultationsResponse>>;
  getById(id: string): Promise<ApiResponse<Consultation>>;
  create(data: ConsultationInput): Promise<ApiResponse<Consultation>>;
  update(id: string, data: ConsultationInput): Promise<ApiResponse<Consultation>>;
  delete(id: string): Promise<ApiResponse<void>>;
  // 관리자 상담 액션은 APPROVE_FIRST, REOPEN 만 허용
  approvalAction(
    id: string,
    body: ApprovalActionInput<AdminConsultationAction>,
  ): Promise<ApiResponse<Consultation>>;
}
