import type { Customer, CustomerInput, CustomerUpdateInput } from "@heritage-dx/types";
import type { CustomerEntity } from "../entities/customer";
import { flattenMemoHistoryNotes } from "../entities/memo-history";

export function mapCustomerDtoToEntity(dto: Customer): CustomerEntity {
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
    memo: flattenMemoHistoryNotes(dto.memo ?? null),
    ageBracket: dto.ageBracket ?? null,
    occupation: dto.occupation ?? null,
    ownedMembershipSummary: dto.ownedMembershipSummary ?? null,
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
    residenceArea: entity.residenceArea ?? undefined,
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
  if (entity.residenceArea !== undefined) input.residenceArea = entity.residenceArea ?? undefined;
  return input;
}
