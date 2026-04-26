import type {
  ApiResponse,
  ApprovalActionInput,
  Consultation,
  ConsultationInput,
  ConsultationsResponse,
  UserConsultationAction,
} from "@heritage-dx/types";
import type { TradeListParams } from "../../types";

export interface IConsultationRepository {
  getAll(params?: TradeListParams): Promise<ApiResponse<ConsultationsResponse>>;
  create(data: ConsultationInput): Promise<ApiResponse<Consultation>>;
  update(id: string, data: ConsultationInput): Promise<ApiResponse<Consultation>>;
  delete(id: string): Promise<ApiResponse<void>>;
  // 공개 사이트 사용자는 REQUEST_APPROVAL 만 호출 가능
  approvalAction(
    id: string,
    body: ApprovalActionInput<UserConsultationAction>,
  ): Promise<ApiResponse<Consultation>>;
}
