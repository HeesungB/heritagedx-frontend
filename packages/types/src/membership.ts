// 회원권 유형 (OpenAPI 스펙 enum)
export type MembershipType = "개인" | "법인";

// 회원권별 서류 (MembershipDocumentResponseDto)
export interface MembershipDocument {
  id: string;
  membershipId: string;
  name: string;
  fileName: string;
  fileDescription: string;
  downloadUrl: string;
  downloadUrlExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// 회원권 (OpenAPI MembershipResponseDto / AdminMembershipDto)
export interface Membership {
  id: string;
  clubId: string;
  membershipType: MembershipType;
  membershipName?: string;

  // 비용 정보
  weekdayGreenFee?: Record<string, number>;
  weekendGreenFee?: Record<string, number>;

  // 예약 정보
  reservationNotes?: string;
  weekendReservationDifficulty?: number;
  memberDaySchedule?: string;
  reservationSystem?: unknown;

  // 시세 정보
  recentMarketPrice?: string;
  recentPriceUpdateDate?: string;
  avgMarketPrice3y?: string;
  dealerPriceRange?: string;

  // 거래 정보
  minTransactionUnit?: string;
  transactionTendency?: string;
  recentTransactionType?: string;
  tradableTypeSummary?: string;
  registrationDifficulty?: number;
  additionalDocumentFrequency?: number;
  balanceRisk?: number;
  transactionRiskMemo?: string;

  // 기명인
  registeredPersonCount?: number;

  // 분양/입회 정보
  initialSalePrice?: string;
  initialSaleYear?: string;
  initialSaleMethod?: string;
  estimatedSalePrice?: string;
  estimatedPriceDate?: string;

  // 회원 혜택/특이사항
  memberBenefits?: string;
  specialNotes?: string;

  // 명의개서 담당자
  transferManagerName?: string;
  transferManagerPhone?: string;
  buyerDocuments?: string;
  sellerDocuments?: string;

  // 메타 정보
  isActive: boolean;
  displayOrder: number;
  documents?: MembershipDocument[];
  createdAt: string;
  updatedAt: string;
}
