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
    caddyFee: dto.caddyFee ?? null,
    cartFee: dto.cartFee ?? null,

    reservationNotes: dto.reservationNotes ?? null,
    weekendReservationDifficulty: coerceToNumber(dto.weekendReservationDifficulty),
    memberDaySchedule: dto.memberDaySchedule ?? null,

    recentMarketPrice: dto.recentMarketPrice ?? null,
    recentPriceUpdateDate: dto.recentPriceUpdateDate ?? null,
    avgMarketPrice3y: dto.avgMarketPrice3y ?? null,
    dealerPriceRange: dto.dealerPriceRange ?? null,

    minTransactionUnit: dto.minTransactionUnit ?? null,
    transactionTendency: dto.transactionTendency ?? null,
    recentTransactionType: dto.recentTransactionType ?? null,
    tradableTypeSummary: dto.tradableTypeSummary ?? null,
    registrationDifficulty: dto.registrationDifficulty ?? null,
    additionalDocumentFrequency: dto.additionalDocumentFrequency ?? null,
    balanceRisk: dto.balanceRisk ?? null,
    transactionRiskMemo: dto.transactionRiskMemo ?? null,

    hasAssociateMember: dto.hasAssociateMember ?? false,
    associateMemberCondition: dto.associateMemberCondition ?? null,
    associateMemberWeekdayFee: dto.associateMemberWeekdayFee ?? null,
    associateMemberWeekendFee: dto.associateMemberWeekendFee ?? null,

    hasFamilyMember: dto.hasFamilyMember ?? false,
    familyMemberCondition: dto.familyMemberCondition ?? null,
    familyMemberWeekdayFee: dto.familyMemberWeekdayFee ?? null,
    familyMemberWeekendFee: dto.familyMemberWeekendFee ?? null,

    registeredPersonCount: dto.registeredPersonCount ?? null,

    canDelegate: dto.canDelegate ?? false,
    delegationWeekdayRule: dto.delegationWeekdayRule ?? null,
    delegationWeekendRule: dto.delegationWeekendRule ?? null,
    delegationRestriction: dto.delegationRestriction ?? null,

    initialSalePrice: dto.initialSalePrice ?? null,
    initialSaleYear: dto.initialSaleYear ?? null,
    initialSaleMethod: dto.initialSaleMethod ?? null,
    estimatedSalePrice: dto.estimatedSalePrice ?? null,
    estimatedPriceDate: dto.estimatedPriceDate ?? null,
    admissionAge: dto.admissionAge ?? null,

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
