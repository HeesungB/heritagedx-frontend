import type { Membership } from "@heritage-dx/types";
import type { MembershipEntity } from "../entities/membership";
import { coerceToNumber } from "./helpers";
import { mapMembershipDocumentDtoToEntity } from "./document.mapper";

export function mapMembershipDtoToEntity(dto: Membership): MembershipEntity {
  return {
    id: dto.id,
    clubId: dto.clubId,
    membershipType: dto.membershipType,
    membershipName: dto.membershipName ?? null,

    weekdayGreenFee: dto.weekdayGreenFee ?? {},
    weekendGreenFee: dto.weekendGreenFee ?? {},

    reservationNotes: dto.reservationNotes ?? null,
    weekendReservationDifficulty: coerceToNumber(dto.weekendReservationDifficulty),
    memberDaySchedule: dto.memberDaySchedule ?? null,
    reservationSystem: dto.reservationSystem ?? null,

    recentMarketPrice: dto.recentMarketPrice ?? null,
    recentPriceUpdateDate: dto.recentPriceUpdateDate ?? null,
    avgMarketPrice3y: dto.avgMarketPrice3y ?? null,
    dealerPriceRange: dto.dealerPriceRange ?? null,

    minTransactionUnit: dto.minTransactionUnit ?? null,
    transactionTendency: dto.transactionTendency ?? null,
    recentTransactionType: dto.recentTransactionType ?? null,
    tradableTypeSummary: dto.tradableTypeSummary ?? null,
    registrationDifficulty: coerceToNumber(dto.registrationDifficulty),
    additionalDocumentFrequency: coerceToNumber(dto.additionalDocumentFrequency),
    balanceRisk: coerceToNumber(dto.balanceRisk),
    transactionRiskMemo: dto.transactionRiskMemo ?? null,

    registeredPersonCount: dto.registeredPersonCount ?? null,

    initialSalePrice: dto.initialSalePrice ?? null,
    initialSaleYear: dto.initialSaleYear ?? null,
    initialSaleMethod: dto.initialSaleMethod ?? null,
    estimatedSalePrice: dto.estimatedSalePrice ?? null,
    estimatedPriceDate: dto.estimatedPriceDate ?? null,

    memberBenefits: dto.memberBenefits ?? null,
    specialNotes: dto.specialNotes ?? null,

    transferManagerName: dto.transferManagerName ?? null,
    transferManagerPhone: dto.transferManagerPhone ?? null,
    buyerDocuments: dto.buyerDocuments ?? null,
    sellerDocuments: dto.sellerDocuments ?? null,

    isActive: dto.isActive,
    displayOrder: dto.displayOrder,
    documents: (dto.documents ?? []).map(mapMembershipDocumentDtoToEntity),
  };
}
