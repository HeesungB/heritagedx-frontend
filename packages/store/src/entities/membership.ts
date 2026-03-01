import type { MembershipDocumentEntity } from "./document";

export interface MembershipEntity {
  id: string;
  clubId: string;
  membershipType: string;
  membershipName: string | null;

  // 비용
  weekdayGreenFee: Record<string, number>;
  weekendGreenFee: Record<string, number>;
  caddyFee: number | null;
  cartFee: number | null;

  // 예약
  reservationNotes: string | null;
  weekendReservationDifficulty: number | null;
  memberDaySchedule: string | null;

  // 시세
  recentMarketPrice: string | null;
  recentPriceUpdateDate: string | null;
  avgMarketPrice3y: string | null;
  dealerPriceRange: string | null;

  // 거래
  minTransactionUnit: string | null;
  transactionTendency: string | null;
  recentTransactionType: string | null;
  tradableTypeSummary: string | null;
  registrationDifficulty: string | null;
  additionalDocumentFrequency: string | null;
  balanceRisk: string | null;
  transactionRiskMemo: string | null;

  // 준회원
  hasAssociateMember: boolean;
  associateMemberCondition: string | null;
  associateMemberWeekdayFee: number | null;
  associateMemberWeekendFee: number | null;

  // 가족회원
  hasFamilyMember: boolean;
  familyMemberCondition: string | null;
  familyMemberWeekdayFee: number | null;
  familyMemberWeekendFee: number | null;

  // 기명인
  registeredPersonCount: number | null;

  // 위임
  canDelegate: boolean;
  delegationWeekdayRule: string | null;
  delegationWeekendRule: string | null;
  delegationRestriction: string | null;

  // 분양/입회
  initialSalePrice: string | null;
  initialSaleYear: string | null;
  initialSaleMethod: string | null;
  estimatedSalePrice: string | null;
  estimatedPriceDate: string | null;
  admissionAge: number | null;

  // 혜택
  memberBenefits: string | null;
  specialNotes: string | null;

  // 명의개서 담당자
  transferManagerName: string | null;
  transferManagerPhone: string | null;
  buyerDocuments: string | null;
  sellerDocuments: string | null;

  // 메타
  isActive: boolean;
  displayOrder: number;
  documents: MembershipDocumentEntity[];
}
