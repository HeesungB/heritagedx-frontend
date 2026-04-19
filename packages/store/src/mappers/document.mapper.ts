import type {
  Document,
  GlobalDocument,
  CustomerDocument,
  MembershipDocument,
  DocumentsSummary,
} from "@heritage-dx/types";
import type {
  DocumentEntity,
  GlobalDocumentEntity,
  CustomerDocumentEntity,
  MembershipDocumentEntity,
} from "../entities/document";
import type { DocumentsSummaryEntity } from "../entities/scenario";

export function mapDocumentDtoToEntity(dto: Document): DocumentEntity {
  return {
    id: dto.id,
    clubDocumentId: dto.clubDocumentId ?? null,
    name: dto.name ?? "",
    fileName: dto.fileName ?? null,
    fileDescription: dto.fileDescription ?? null,
    minCount: dto.minCount ?? 1,
    unit: dto.unit ?? "부",
    isMandatory: dto.isMandatory ?? false,
    notes: Array.isArray(dto.notes) ? dto.notes.join(", ") : (dto.notes ?? ""),
    displayOrder: dto.displayOrder ?? 0,
    downloadUrl: dto.downloadUrl ?? null,
    downloadUrlExpiresAt: dto.downloadUrlExpiresAt ?? null,
  };
}

export function mapGlobalDocumentDtoToEntity(dto: GlobalDocument): GlobalDocumentEntity {
  return {
    id: dto.id,
    name: dto.name,
    fileName: dto.fileName ?? null,
    fileDescription: dto.fileDescription ?? null,
    downloadUrl: dto.downloadUrl ?? null,
    downloadUrlExpiresAt: dto.downloadUrlExpiresAt ?? null,
  };
}

export function mapCustomerDocumentDtoToEntity(dto: CustomerDocument): CustomerDocumentEntity {
  return {
    id: dto.id,
    clubId: dto.clubId,
    name: dto.name,
    description: dto.description ?? null,
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
  };
}

export function mapMembershipDocumentDtoToEntity(dto: MembershipDocument): MembershipDocumentEntity {
  return {
    id: dto.id,
    membershipId: dto.membershipId,
    name: dto.name,
    fileName: dto.fileName,
    fileDescription: dto.fileDescription,
    downloadUrl: dto.downloadUrl,
    downloadUrlExpiresAt: dto.downloadUrlExpiresAt,
  };
}

export function mapDocumentsSummaryDtoToEntity(dto: DocumentsSummary): DocumentsSummaryEntity {
  return {
    totalDocuments: dto.totalDocuments,
    mandatoryDocuments: dto.mandatoryDocuments,
    optionalDocuments: dto.optionalDocuments,
  };
}
