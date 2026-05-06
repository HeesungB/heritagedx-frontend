import type { CustomerMemoEntry } from "./memo-history";

/**
 * 백엔드 customerGrade enum → 사용자 노출 한글 라벨.
 * 현재 명시된 값은 2개 (`docs/api/README.md`):
 *   - ACTIVE_DEAL: 거래 생성 시 자동 부여
 *   - HIGH_INTENT: 거래 REJECT/삭제 후 다른 거래가 없을 때 자동 하향
 * 추가 단계는 백엔드 스펙 확정(Phase B) 후 enum 강화 예정.
 */
export const CUSTOMER_GRADE_LABEL = {
  ACTIVE_DEAL: "거래 중인 고객",
  HIGH_INTENT: "거래 의사가 높은 고객",
} as const;

export type CustomerGradeKey = keyof typeof CUSTOMER_GRADE_LABEL;

export function getCustomerGradeLabel(grade: string | null | undefined): string | null {
  if (!grade) return null;
  const trimmed = grade.trim();
  if (!trimmed) return null;
  if (trimmed in CUSTOMER_GRADE_LABEL) {
    return CUSTOMER_GRADE_LABEL[trimmed as CustomerGradeKey];
  }
  // 매핑되지 않은 값은 raw 그대로 표시 (백엔드가 enum 추가했을 때 코드 미반영 상태 대비)
  return trimmed;
}

export interface CustomerEntity {
  id: string;
  organizationId: string;
  createdByUserId: string;
  createdByName: string;
  name: string;
  contact: string;
  email: string | null;
  address: string | null;
  /** plain text 정규화된 메모 — 목록 컬럼 등에서 사용 */
  memo: string | null;
  /**
   * raw memo 가 `__MEMO_V1__` 마커 + JSON 형태일 때 항목별로 디코딩된 결과.
   * 마커가 아니면 null. 고객 상세의 상담 메모 항목별 표시에서 사용한다.
   */
  memoEntries: CustomerMemoEntry[] | null;
  ageBracket: string | null;
  occupation: string | null;
  ownedMembershipSummary: string | null;
  // 서버가 거래 라이프사이클에 맞춰 자동 산정. 클라이언트는 읽기 전용.
  customerGrade: string | null;
  residenceArea: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerHistoryRecentConsultationEntity {
  id: string;
  clubName: string;
  membershipName: string;
  tradeType: "매도" | "매수";
  registrationDate: string | null;
  approvalStatus: string;
  accountNumber?: string | null;
}

export interface CustomerHistoryRecentMembershipTradeEntity {
  id: string;
  clubName: string;
  membershipName: string;
  tradeType: "매도" | "매수";
  contractDate: string | null;
  workflowStatus: string;
}

export interface CustomerHistorySummaryEntity {
  customerId: string;
  summary: {
    consultationCount: number;
    membershipTradeCount: number;
  };
  recentConsultations: CustomerHistoryRecentConsultationEntity[];
  recentMembershipTrades: CustomerHistoryRecentMembershipTradeEntity[];
}
