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

// PUT /admin/clubs/:id 의 UpdateClubDto 화이트리스트 (docs/api/admin/clubs.md 기준).
// 응답에는 포함되지만 update 본문에서는 허용되지 않는 필드(taxOfficial, operationType 등)는
// 의도적으로 제외한다.
export const CLUB_UPDATE_ALLOWED_FIELDS = [
  "code",
  "name",
  "companyName",
  "region",
  "address",
  "coordinates",
  "registrationFee",
  "taxOfficialRaw",
  "memo",
  "registrationHours",
  "documentLink",
  "registrationProcedure",
  "dealerMemo",
  "membershipInfo",
  "openingDate",
  "holes",
  "totalLength",
  "memberCount",
  "cityAccessibility",
  "courseNames",
  "courseComposition",
  "claimFrequency",
  "website",
  "operatorCompany",
  "admissionAge",
  "introduction",
  "facilities",
  "operationTypes",
  "stampDuty",
  "agencyFee",
  "otherCosts",
  "caddyFee",
  "cartFee",
] as const;

export type ClubUpdateField = (typeof CLUB_UPDATE_ALLOWED_FIELDS)[number];

// 응답(source) + 폼(overrides) 을 머지해 update 본문을 구성. 허용 필드 외엔 모두 제거되므로
// 백엔드의 forbidNonWhitelisted 검증에 걸리지 않는다.
export function pickClubUpdatePayload(
  source: Record<string, unknown> | null | undefined,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (source) {
    for (const key of CLUB_UPDATE_ALLOWED_FIELDS) {
      const value = source[key];
      if (value === null || value === undefined) continue;
      payload[key] = value;
    }
  }
  for (const key of CLUB_UPDATE_ALLOWED_FIELDS) {
    if (!(key in overrides)) continue;
    const value = overrides[key];
    if (value === undefined) continue;
    payload[key] = value;
  }
  // operationTypes 정규화: 키 이름은 복수지만 UpdateClubDto 는 단일 enum 값을 요구한다
  // (응답에는 `operationTypes: Array<...>` 와 `operationType: "..."`(singular) 가 함께 옴).
  // array → 첫 원소, 비어있으면 singular fallback, 아무것도 없으면 키 제거.
  let opType: unknown = payload.operationTypes;
  if (opType === undefined && source) opType = source.operationType;
  if (Array.isArray(opType)) opType = opType[0];
  if (typeof opType === "string" && opType.length > 0) {
    payload.operationTypes = opType;
  } else {
    delete payload.operationTypes;
  }
  return payload;
}
