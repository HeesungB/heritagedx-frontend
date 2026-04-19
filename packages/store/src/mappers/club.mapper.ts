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
    address: "",
    contact: "",
    holes: dto.holes ?? undefined,
    operationTypes: dto.operationTypes ?? [],
    recentMarketPrice: undefined,
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
    website: dto.website ?? null,
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
      weekdayGreenFee: normalizeGreenFee(undefined),
      weekendGreenFee: normalizeGreenFee(undefined),
      caddyFee: dto.caddyFee ?? null,
      cartFee: dto.cartFee ?? null,
    },

    marketInfo: {
      recentMarketPrice: null,
      recentPriceUpdateDate: null,
      avgMarketPrice3y: null,
      dealerPriceRange: null,
      transactionTendency: null,
      tradableTypeSummary: null,
      minTransactionUnit: null,
      recentTransactionType: null,
      balanceRisk: null,
      registrationDifficulty: null,
      dealerMemo: dto.dealerMemo ?? null,
      membershipInfo: dto.membershipInfo ?? null,
    },

    registration: {
      registrationHours: dto.registrationHours ?? null,
      registrationProcedure: dto.registrationProcedure ?? null,
      documentLink: dto.documentLink ?? null,
      submissionMethods: [],
      processingTime: null,
      externalUrl: null,
      reservationNotes: null,
    },

    contacts,
    bankAccounts,
    memberships: (dto.memberships ?? []).map(mapMembershipDtoToEntity),
    scenarios: (dto.scenarios ?? []).map(mapScenarioWithDocsDtoToEntity),
    documentsGlobal: (dto.documentsGlobal ?? []).map(mapGlobalDocumentDtoToEntity),
    documentsCustomer: (dto.documentsCustomer ?? []).map(mapCustomerDocumentDtoToEntity),
  };
}
