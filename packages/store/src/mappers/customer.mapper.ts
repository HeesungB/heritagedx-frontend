import type { Customer, CustomerInput, CustomerUpdateInput } from "@heritage-dx/types";
import type { CustomerEntity } from "../entities/customer";

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
    memo: dto.memo ?? null,
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
  return input;
}
