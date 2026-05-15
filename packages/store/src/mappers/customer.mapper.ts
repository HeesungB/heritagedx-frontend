import type {
  Customer,
  CustomerHistorySummary,
  CustomerInput,
  CustomerOwnedMembership,
  CustomerUpdateInput,
} from "@heritage-dx/types";
import type {
  CustomerEntity,
  CustomerHistorySummaryEntity,
  OwnedMembershipEntity,
} from "../entities/customer";
import {
  decodeMemoEntries,
  flattenMemoHistoryNotes,
} from "../entities/memo-history";

export function mapOwnedMembershipDtoToEntity(
  dto: CustomerOwnedMembership,
): OwnedMembershipEntity {
  return {
    clubId: dto.clubId,
    membershipId: dto.membershipId,
    status: dto.status,
    quantity: dto.quantity,
    note: dto.note ?? null,
    displayOrder: dto.displayOrder,
    clubName: dto.clubName ?? null,
    membershipName: dto.membershipName ?? null,
  };
}

export function mapOwnedMembershipEntityToInput(
  entity: OwnedMembershipEntity,
): CustomerOwnedMembership {
  // 요청 페이로드에는 join 필드(clubName/membershipName)는 보내지 않는다 — 응답 전용.
  return {
    clubId: entity.clubId,
    membershipId: entity.membershipId,
    status: entity.status,
    quantity: entity.quantity,
    note: entity.note ?? undefined,
    displayOrder: entity.displayOrder,
  };
}

export function mapCustomerDtoToEntity(dto: Customer): CustomerEntity {
  const rawMemo = dto.memo ?? null;
  const ownedMemberships = (dto.ownedMemberships ?? [])
    .map(mapOwnedMembershipDtoToEntity)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  return {
    id: dto.id,
    organizationId: dto.organizationId,
    createdByUserId: dto.createdByUserId,
    createdByName: dto.createdByName,
    name: dto.name,
    contact: dto.contact,
    email: dto.email ?? null,
    address: dto.address ?? null,
    // customer.memo 는 단일 텍스트 필드지만, 과거 데이터에 메모 히스토리 인코딩이 흘러들어온
    // 케이스가 있어 표시 단계에서 plain text 로 정규화한다.
    memo: flattenMemoHistoryNotes(rawMemo),
    // raw memo 가 __MEMO_V1__ 마커 형태이면 항목별 entries 도 함께 노출.
    memoEntries: decodeMemoEntries(rawMemo),
    ageBracket: dto.ageBracket ?? null,
    occupation: dto.occupation ?? null,
    ownedMembershipSummary: dto.ownedMembershipSummary ?? null,
    ownedMemberships,
    customerGrade: dto.customerGrade ?? null,
    residenceArea: dto.residenceArea ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapCustomerEntityToInput(
  entity: Partial<CustomerEntity>,
): CustomerInput {
  return {
    name: entity.name ?? "",
    contact: entity.contact ?? "",
    email: entity.email ?? undefined,
    address: entity.address ?? undefined,
    memo: entity.memo ?? undefined,
    ageBracket: entity.ageBracket ?? undefined,
    occupation: entity.occupation ?? undefined,
    ownedMembershipSummary: entity.ownedMembershipSummary ?? undefined,
    ownedMemberships: entity.ownedMemberships?.map(mapOwnedMembershipEntityToInput),
    residenceArea: entity.residenceArea ?? undefined,
  };
}

export function mapCustomerHistorySummaryDtoToEntity(
  dto: CustomerHistorySummary,
): CustomerHistorySummaryEntity {
  return {
    customerId: dto.customerId,
    summary: {
      consultationCount: dto.summary.consultationCount,
      membershipTradeCount: dto.summary.membershipTradeCount,
    },
    recentConsultations: (dto.recentConsultations ?? []).map((c) => ({
      id: c.id,
      clubName: c.clubName,
      membershipName: c.membershipName,
      tradeType: c.tradeType,
      registrationDate: c.registrationDate ?? null,
      approvalStatus: c.approvalStatus,
      accountNumber: c.accountNumber ?? null,
    })),
    recentMembershipTrades: (dto.recentMembershipTrades ?? []).map((t) => ({
      id: t.id,
      clubName: t.clubName,
      membershipName: t.membershipName,
      tradeType: t.tradeType,
      contractDate: t.contractDate ?? null,
      workflowStatus: t.workflowStatus,
    })),
  };
}

export function mapCustomerEntityToUpdateInput(
  entity: Partial<CustomerEntity>,
): CustomerUpdateInput {
  const input: CustomerUpdateInput = {};
  if (entity.name !== undefined) input.name = entity.name;
  if (entity.contact !== undefined) input.contact = entity.contact;
  if (entity.email !== undefined) input.email = entity.email ?? undefined;
  if (entity.address !== undefined) input.address = entity.address ?? undefined;
  if (entity.memo !== undefined) input.memo = entity.memo ?? undefined;
  if (entity.ageBracket !== undefined) input.ageBracket = entity.ageBracket ?? undefined;
  if (entity.occupation !== undefined) input.occupation = entity.occupation ?? undefined;
  if (entity.ownedMembershipSummary !== undefined)
    input.ownedMembershipSummary = entity.ownedMembershipSummary ?? undefined;
  // ownedMemberships: 키가 명시적으로 들어왔을 때만 페이로드에 포함.
  // 미포함 → 백엔드 "유지", [] → 전체 삭제, [...] → 전체 교체.
  if (entity.ownedMemberships !== undefined)
    input.ownedMemberships = entity.ownedMemberships.map(mapOwnedMembershipEntityToInput);
  if (entity.residenceArea !== undefined) input.residenceArea = entity.residenceArea ?? undefined;
  return input;
}
