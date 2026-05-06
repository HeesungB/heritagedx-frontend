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
    accountNumber: dto.accountNumber ?? null,
    customFields: dto.customFields ?? {},
    // notes 는 신규 JSONB 응답 ({entries:[...]}) 에서 entries 만 추출.
    // 과거 string 응답이 일시적으로 섞여 들어와도 [] 로 흡수해 화면 크래시를 막는다.
    notes: Array.isArray(dto.notes?.entries) ? dto.notes.entries : [],
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

// 백엔드는 club / membership 두 필드가 모두 UUID(ID 모드)이거나 모두 텍스트(이름 모드)일
// 때만 수락한다. 두 ID가 모두 있을 때만 ID 모드로 보내고, 하나라도 빠지면 텍스트 모드로
// 일치시켜 INVALID_INPUT_MODE 응답을 방지한다.
export function buildClubMembershipPair(args: {
  clubId?: string | null;
  clubName?: string | null;
  membershipId?: string | null;
  membershipType?: string | null;
}): { club: string; membership: string } {
  const { clubId, clubName, membershipId, membershipType } = args;
  if (clubId && membershipId) {
    return { club: clubId, membership: membershipId };
  }
  return { club: clubName ?? "", membership: membershipType ?? "" };
}

// PUT /consultations/:id 에서 notes 직접 수정이 금지되어 있어 update 페이로드에는 notes 를
// 포함하지 않는다. 메모 변경은 별도 엔드포인트(POST/PATCH/DELETE /consultations/:id/notes)로
// 수행하므로, 본 매퍼는 notes 를 일관되게 omit 한다.
export function mapConsultationEntityToInput(
  entity: Partial<ConsultationEntity>,
): ConsultationInput {
  const pair = buildClubMembershipPair({
    clubId: entity.clubId,
    clubName: entity.clubName,
    membershipId: entity.membershipId,
    membershipType: entity.membershipType,
  });
  return {
    ...pair,
    tradeType: entity.tradeType ?? "매수",
    customerName: (entity.customerName ?? "").trim(),
    contact: (entity.contact ?? "").trim(),
    offerPrice: entity.offerPrice,
    offerPriceNote: entity.offerPriceNote,
    desiredPrice: entity.desiredPrice,
    desiredPriceNote: entity.desiredPriceNote,
    depositAmount: entity.depositAmount,
    accountNumber: entity.accountNumber,
    customFields: entity.customFields,
    registrationDate: entity.registrationDate,
    tradeDate: entity.tradeDate,
    remarks: entity.remarks,
    isShared: entity.isShared,
  };
}
