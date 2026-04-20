import type { Consultation, ConsultationInput } from "@heritage-dx/types";
import type { ConsultationEntity } from "../entities/consultation";
import { coerceToNumber } from "./helpers";

export function mapConsultationDtoToEntity(dto: Consultation): ConsultationEntity {
  return {
    id: dto.id,
    customerId: dto.customerId,
    clubId: dto.clubId,
    clubName: dto.clubName,
    membershipId: dto.membershipId,
    membershipType: dto.membershipName,
    tradeType: dto.tradeType as "매수" | "매도",
    customerName: dto.customerName,
    contact: dto.contact,
    offerPrice: coerceToNumber(dto.offerPrice),
    offerPriceNote: dto.offerPriceNote,
    desiredPrice: coerceToNumber(dto.desiredPrice),
    desiredPriceNote: dto.desiredPriceNote,
    depositAmount: dto.depositAmount,
    customFields: dto.customFields ?? {},
    notes: dto.notes,
    registrationDate: dto.registrationDate,
    tradeDate: dto.tradeDate,
    remarks: dto.remarks,
    isDone: dto.isDone,
    isShared: dto.isShared ?? false,
    approvalStatus: dto.approvalStatus,
    approvalRequestedAt: dto.approvalRequestedAt,
    firstApprovedAt: dto.firstApprovedAt,
    holdReason: dto.holdReason,
    rejectionReason: dto.rejectionReason,
    linkedTradeId: dto.linkedTradeId,
    createdByName: dto.createdByName ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapConsultationEntityToInput(
  entity: Partial<ConsultationEntity>,
): ConsultationInput {
  return {
    club: entity.clubId || entity.clubName || "",
    membership: entity.membershipId || entity.membershipType || "",
    tradeType: entity.tradeType ?? "매수",
    customerName: entity.customerName ?? "",
    contact: entity.contact ?? "",
    offerPrice: entity.offerPrice,
    offerPriceNote: entity.offerPriceNote,
    desiredPrice: entity.desiredPrice,
    desiredPriceNote: entity.desiredPriceNote,
    depositAmount: entity.depositAmount,
    customFields: entity.customFields,
    notes: entity.notes,
    registrationDate: entity.registrationDate,
    tradeDate: entity.tradeDate,
    remarks: entity.remarks,
    isDone: entity.isDone,
    isShared: entity.isShared,
  };
}
