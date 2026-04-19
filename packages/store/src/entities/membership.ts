import type { MembershipDocumentEntity } from "./document";

export interface MembershipEntity {
  id: string;
  clubId: string;
  membershipType: string;
  membershipName: string | null;

  // 비용
  weekdayGreenFee: Record<string, number>;
  weekendGreenFee: Record<string, number>;

  // 예약
  reservationNotes: string | null;
  weekendReservationDifficulty: number | null;
  memberDaySchedule: string | null;
  reservationSystem: unknown;

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
  registrationDifficulty: number | null;
  additionalDocumentFrequency: number | null;
  balanceRisk: number | null;
  transactionRiskMemo: string | null;

  // 기명인
  registeredPersonCount: number | null;

  // 분양/입회
  initialSalePrice: string | null;
  initialSaleYear: string | null;
  initialSaleMethod: string | null;
  estimatedSalePrice: string | null;
  estimatedPriceDate: string | null;

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
