import type { CustomerMemoEntry } from "./memo-history";

/**
 * 백엔드 customerGrade enum → 사용자 노출 한글 라벨.
 * 4단계 (강함 → 약함):
 *   - ACTIVE_DEAL: 거래 생성 시 자동 부여
 *   - HIGH_INTENT: 거래 REJECT/삭제 후 다른 거래가 없을 때 자동 하향
 *   - INTERESTED:  관심 표명 단계
 *   - PROSPECT:    잠재 고객(가장 약한 단계)
 */
export const CUSTOMER_GRADE_LABEL = {
  ACTIVE_DEAL: "거래 중인 고객",
  HIGH_INTENT: "거래 의사가 높은 고객",
  INTERESTED: "관심 고객",
  PROSPECT: "잠재 고객",
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

/**
 * 보유 회원권 status enum → 한글 라벨 (백엔드 검증 2026-05-07).
 * 미매핑 값은 raw 그대로 표시.
 */
export const OWNED_MEMBERSHIP_STATUS_LABEL = {
  OWNED: "보유",
  SELLING: "매도중",
  TRANSFER_PENDING: "명의이전중",
  SOLD: "매도완료",
  UNKNOWN: "알 수 없음",
} as const;

export type OwnedMembershipStatusKey = keyof typeof OWNED_MEMBERSHIP_STATUS_LABEL;

export function getOwnedMembershipStatusLabel(
  status: string | null | undefined,
): string | null {
  if (!status) return null;
  const trimmed = status.trim();
  if (!trimmed) return null;
  if (trimmed in OWNED_MEMBERSHIP_STATUS_LABEL) {
    return OWNED_MEMBERSHIP_STATUS_LABEL[trimmed as OwnedMembershipStatusKey];
  }
  return trimmed;
}

export interface OwnedMembershipEntity {
  clubId: string;
  membershipId: string;
  status: string;
  quantity: number;
  note: string | null;
  displayOrder: number;
  // 응답 join 필드 (서버가 함께 내려줄 때 채워짐)
  clubName: string | null;
  membershipName: string | null;
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
  /** 보유 회원권 목록 — displayOrder 오름차순 정렬됨. 빈 배열이 기본. */
  ownedMemberships: OwnedMembershipEntity[];
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
