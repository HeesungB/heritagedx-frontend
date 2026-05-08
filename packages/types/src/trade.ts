import type { ApprovalStatus, WorkflowStatus } from "./approval";
import type { Pagination } from "./api";

// 거래 유형 (OpenAPI 스펙 enum)
export type TradeType = "매도" | "매수";

// 상담 메모 entry (notes JSONB 구조)
// - id, author, authorId, createdAt: 서버 자동 채움
// - updatedAt, updatedByUserId: 최초 null, 메모 수정 시 갱신
export interface ConsultationNoteEntry {
  id: string;
  author: string;
  authorId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  updatedByUserId: string | null;
}

export interface ConsultationNotes {
  entries: ConsultationNoteEntry[];
}

export interface ConsultationNoteInput {
  content: string;
}

// POST/PATCH/DELETE /consultations/:id/notes[/:noteId] 응답 — 갱신된 notes 만 반환.
// 다른 mutation 들과 달리 전체 Consultation 이 아니라 notes 한 필드만 돌아오므로
// store 는 기존 entity 의 다른 필드를 보존하면서 notes 만 patch 해야 한다.
export interface ConsultationNotesData {
  notes: ConsultationNotes;
}

// 상담 (OpenAPI ConsultationResponseDto)
export interface Consultation {
  id: string;
  customerId: string | null;
  clubId: string | null;
  clubName: string;
  membershipId: string | null;
  membershipName: string;
  isShared?: boolean;
  tradeType: TradeType;
  customerName: string;
  contact: string;
  offerPrice: string | number | null;
  offerPriceNote: string | null;
  desiredPrice: string | number | null;
  desiredPriceNote: string | null;
  depositAmount: number | null;
  accountNumber: string | null;
  customFields: Record<string, unknown>;
  notes: ConsultationNotes;
  registrationDate: string | null;
  tradeDate: string | null;
  remarks: string | null;
  isDone: boolean;
  approvalStatus: ApprovalStatus;
  approvalRequestedAt: string | null;
  firstApprovedAt: string | null;
  holdReason: string | null;
  rejectionReason: string | null;
  linkedTradeId: string | null;
  // 연결된 입출금표 메타 (백엔드 2026-05-08 추가).
  // REQUEST_APPROVAL / APPROVE_FIRST 게이트는 settlementDocumentGenerated 가 true 일 때만 통과.
  settlementId?: string | null;
  settlementDocumentGenerated?: boolean | null;
  settlementDocumentGeneratedAt?: string | null;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationsResponse {
  trades: Consultation[];
  pagination: Pagination;
}

// ──────────────────────────────────────────────────────────────────────────
// AI 자연어 → 상담일지 초안 추출 (POST /api/consultations/ai)
// ──────────────────────────────────────────────────────────────────────────

export interface ConsultationAiInput {
  text: string;
}

export interface ConsultationAiDraft {
  club: string | null;
  membership: string | null;
  tradeType: TradeType;
  customerName: string;
  contact: string;
  desiredPrice: number | null;
  customFields: Record<string, unknown>;
  isShared: boolean;
}

export interface ConsultationAiCandidate {
  id: string;
  name: string;
  membershipType?: "개인" | "법인";
}

export interface ConsultationAiMatchInfo {
  matched: boolean;
  ambiguous: boolean;
  id: string | null;
  name: string | null;
  membershipType?: "개인" | "법인";
  candidates: ConsultationAiCandidate[];
}

export type ConsultationAiMissingField =
  | "club"
  | "membership"
  | "customerName"
  | "contact"
  | "tradeType";

export interface ConsultationAiResponse {
  draft: ConsultationAiDraft;
  matches: {
    club: ConsultationAiMatchInfo;
    membership: ConsultationAiMatchInfo;
  };
  missingRequiredFields: ConsultationAiMissingField[];
  warnings: string[];
}

// 상담 생성/수정 입력.
// - 백엔드가 isDone 필드를 거부하므로 입력 페이로드에서 제외 (응답 Consultation 에는 표시용으로 존재).
// - notes 는 **상담 생성 시에만** 1개의 첫 entry 텍스트로 사용. PUT /consultations/:id 에서는
//   notes 직접 수정이 금지되어 있으므로 update 호출 시에는 반드시 omit 해야 한다.
//   메모 추가/수정/삭제는 별도 엔드포인트(POST/PATCH/DELETE /consultations/:id/notes[/:noteId]) 사용.
export interface ConsultationInput {
  club: string;
  membership: string;
  tradeType: TradeType;
  customerName: string;
  contact: string;
  offerPrice?: number | null;
  offerPriceNote?: string | null;
  desiredPrice?: number | null;
  desiredPriceNote?: string | null;
  depositAmount?: number | null;
  accountNumber?: string | null;
  customFields?: Record<string, unknown>;
  notes?: string;
  registrationDate?: string | null;
  tradeDate?: string | null;
  remarks?: string | null;
  isShared?: boolean;
}

// 거래 내역 (OpenAPI MembershipTradeResponseDto)
export interface MembershipTrade {
  id: string;
  customerId: string | null;
  sourceConsultationId: string | null;
  clubId: string | null;
  clubName?: string;
  membershipId: string | null;
  customerName: string;
  contact: string;
  tradeType: TradeType;
  membershipName: string;
  workflowStatus: WorkflowStatus;
  contractDate: string | null;
  amount: number | null;
  depositAmount: number | null;
  tradingPartner: string | null;
  tradeAmount: number | null;
  commission: number | null;
  marketProfit: number | null;
  total: number | null;
  expense: number | null;
  description: string | null;
  netProfit: number | null;
  balanceDate: string | null;
  balanceCompleted: boolean;
  manager: string | null;
  taxTransfer: boolean;
  taxAcquisition: boolean;
  invoiceSales: number | null;
  invoicePurchase: number | null;
  remarks: string | null;
  actualTransactionDate: string | null;
  submittedForFinalReviewAt: string | null;
  finalApprovedAt: string | null;
  finalRejectedAt: string | null;
  finalRejectionReason: string | null;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipTradesResponse {
  trades: MembershipTrade[];
  pagination: Pagination;
}

export interface MembershipTradeInput {
  clubId: string;
  membershipId: string;
  customerId?: string | null;
  customerName: string;
  contact?: string;
  tradeType: TradeType;
  contractDate?: string | null;
  amount?: number | null;
  depositAmount?: number | null;
  tradingPartner?: string | null;
  tradeAmount?: number | null;
  commission?: number | null;
  marketProfit?: number | null;
  total?: number | null;
  expense?: number | null;
  description?: string | null;
  netProfit?: number | null;
  balanceDate?: string | null;
  balanceCompleted?: boolean;
  manager?: string | null;
  taxTransfer?: boolean;
  taxAcquisition?: boolean;
  invoiceSales?: number | null;
  invoicePurchase?: number | null;
  remarks?: string | null;
  actualTransactionDate?: string | null;
}
