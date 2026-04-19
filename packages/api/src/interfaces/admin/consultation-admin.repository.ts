import type {
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
  approvalAction(
    id: string,
    body: ApprovalActionInput,
  ): Promise<ApiResponse<Consultation>>;
}
