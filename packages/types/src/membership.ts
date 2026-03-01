// 회원권별 서류
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

// 회원권 (Membership)
export interface Membership {
  id: string;
  clubId: string;
  membershipType: string;
  membershipName?: string;

  // 비용 정보
  weekdayGreenFee?: Record<string, number>;
  weekendGreenFee?: Record<string, number>;
  caddyFee?: number;
  cartFee?: number;

  // 예약 정보
  reservationNotes?: string;
  weekendReservationDifficulty?: number | string;
  memberDaySchedule?: string;

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
  registrationDifficulty?: string;
  additionalDocumentFrequency?: string;
  balanceRisk?: string;
  transactionRiskMemo?: string;

  // 준회원 정보
  hasAssociateMember?: boolean;
  associateMemberCondition?: string;
  associateMemberWeekdayFee?: number;
  associateMemberWeekendFee?: number;

  // 가족회원 정보
  hasFamilyMember?: boolean;
  familyMemberCondition?: string;
  familyMemberWeekdayFee?: number;
  familyMemberWeekendFee?: number;

  // 기명인
  registeredPersonCount?: number;

  // 위임 정보
  canDelegate?: boolean;
  delegationWeekdayRule?: string;
  delegationWeekendRule?: string;
  delegationRestriction?: string;

  // 분양/입회 정보
  initialSalePrice?: string;
  initialSaleYear?: string;
  initialSaleMethod?: string;
  estimatedSalePrice?: string;
  estimatedPriceDate?: string;
  admissionAge?: number;

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
  createdAt?: string;
  updatedAt?: string;
}
