import type { Club, ClubDetail } from "@heritage-dx/types";
import type { ClubEntity, ClubDetailEntity, ClubContactEntity, BankAccountEntity } from "../entities/club";
import { coerceToNumber, normalizeGreenFee } from "./helpers";
import { mapMembershipDtoToEntity } from "./membership.mapper";
import { mapScenarioWithDocsDtoToEntity } from "./scenario.mapper";
import { mapGlobalDocumentDtoToEntity, mapCustomerDocumentDtoToEntity } from "./document.mapper";

export function mapClubDtoToEntity(dto: Club): ClubEntity {
  return {
    code: dto.code,
    name: dto.name,
    region: dto.region ?? "",
    contact: dto.contact ?? "",
    holes: dto.holes ?? undefined,
    operationTypes: dto.operationTypes ?? [],
  };
}

export function mapClubDetailDtoToEntity(dto: ClubDetail): ClubDetailEntity {
  const contacts: ClubContactEntity[] = (dto.contacts ?? []).map((c) => ({
    id: c.id,
    phoneNumber: c.phoneNumber ?? null,
    fax: c.fax ?? null,
    email: c.email ?? null,
    contactPerson: c.contactPerson ?? null,
    department: c.department ?? null,
    isPrimary: c.isPrimary ?? false,
  }));

  const bankAccounts: BankAccountEntity[] = (dto.bankAccounts ?? []).map((b) => ({
    id: b.id,
    bankName: b.bankName ?? null,
    accountNumber: b.accountNumber ?? null,
    accountHolder: b.accountHolder ?? null,
  }));

  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    companyName: dto.companyName ?? null,
    region: dto.region ?? "",
    address: dto.address ?? "",
    memo: dto.memo ?? null,
    updatedAt: dto.updatedAt ?? null,

    basicInfo: {
      openingDate: dto.openingDate ?? null,
      holes: dto.holes ?? null,
      totalLength: dto.totalLength ?? null,
      memberCount: coerceToNumber(dto.memberCount),
      courseNames: dto.courseNames ?? [],
      courseComposition: dto.courseComposition ?? null,
      cityAccessibility: dto.cityAccessibility ?? null,
      introduction: dto.introduction ?? null,
      facilities: dto.facilities ?? null,
    },

    costs: {
      registrationFee: dto.registrationFee ?? null,
      stampDuty: dto.stampDuty ?? null,
      agencyFee: dto.agencyFee ?? null,
      otherCosts: dto.otherCosts ?? null,
      taxOfficial: dto.taxOfficial ?? null,
      weekdayGreenFee: normalizeGreenFee(dto.weekdayGreenFee),
      weekendGreenFee: normalizeGreenFee(dto.weekendGreenFee),
      caddyFee: dto.caddyFee ?? null,
      cartFee: dto.cartFee ?? null,
    },

    marketInfo: {
      recentMarketPrice: dto.recentMarketPrice ?? null,
      recentPriceUpdateDate: dto.recentPriceUpdateDate ?? null,
      avgMarketPrice3y: dto.avgMarketPrice3y ?? null,
      dealerPriceRange: dto.dealerPriceRange ?? null,
      transactionTendency: dto.transactionTendency ?? null,
      tradableTypeSummary: dto.tradableTypeSummary ?? null,
      minTransactionUnit: dto.minTransactionUnit ?? null,
      recentTransactionType: dto.recentTransactionType ?? null,
      balanceRisk: coerceToNumber(dto.balanceRisk),
      registrationDifficulty: coerceToNumber(dto.registrationDifficulty),
      dealerMemo: dto.dealerMemo ?? null,
      membershipInfo: dto.membershipInfo ?? null,
    },

    registration: {
      registrationHours: dto.registrationHours ?? null,
      registrationProcedure: dto.registrationProcedure ?? null,
      documentLink: dto.documentLink ?? null,
      submissionMethods: dto.submissionMethods ?? [],
      processingTime: dto.processingTime ?? null,
      externalUrl: dto.externalUrl ?? null,
      reservationNotes: dto.reservationNotes ?? null,
    },

    contacts,
    bankAccounts,
    memberships: (dto.memberships ?? []).map(mapMembershipDtoToEntity),
    scenarios: (dto.scenarios ?? []).map(mapScenarioWithDocsDtoToEntity),
    documentsGlobal: (dto.documentsGlobal ?? []).map(mapGlobalDocumentDtoToEntity),
    documentsCustomer: (dto.documentsCustomer ?? []).map(mapCustomerDocumentDtoToEntity),
  };
}
