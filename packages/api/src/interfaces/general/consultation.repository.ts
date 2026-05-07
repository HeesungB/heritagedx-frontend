import type {
  ApiResponse,
  ApprovalActionInput,
  Consultation,
  ConsultationAiInput,
  ConsultationAiResponse,
  ConsultationInput,
  ConsultationNoteInput,
  ConsultationNotesData,
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
  // 자연어 텍스트 → 상담일지 초안 추출 (AI)
  createDraftFromText(
    input: ConsultationAiInput,
  ): Promise<ApiResponse<ConsultationAiResponse>>;
  // 메모 CRUD — notes JSONB 의 entry 단위로 추가/수정/삭제.
  // 응답은 갱신된 notes 만 (`{notes: {entries: [...]}}`) — 전체 Consultation 이 아니다.
  // 작성자/관리자 권한, 완료 거래 연결 시 차단 등은 서버가 검증한다.
  addNote(
    id: string,
    input: ConsultationNoteInput,
  ): Promise<ApiResponse<ConsultationNotesData>>;
  updateNote(
    id: string,
    noteId: string,
    input: ConsultationNoteInput,
  ): Promise<ApiResponse<ConsultationNotesData>>;
  deleteNote(
    id: string,
    noteId: string,
  ): Promise<ApiResponse<ConsultationNotesData>>;
}
