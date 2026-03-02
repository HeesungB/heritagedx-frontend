import type { TradeMemo, TradeMemoInput } from "@heritage-dx/types";
import type { TradeMemoEntity } from "../entities/trade-memo";
import { coerceToNumber } from "./helpers";

export function mapTradMemoDtoToEntity(dto: TradeMemo): TradeMemoEntity {
  return {
    id: dto.id,
    clubId: dto.clubId,
    clubName: dto.clubName,
    membershipType: dto.membershipName,
    tradeType: dto.tradeType as "매수" | "매도",
    customerName: dto.customerName,
    contact: dto.contact,
    offerPrice: coerceToNumber(dto.offerPrice),
    offerPriceNote: dto.offerPriceNote,
    desiredPrice: coerceToNumber(dto.desiredPrice),
    desiredPriceNote: dto.desiredPriceNote,
    notes: dto.notes,
    registrationDate: dto.registrationDate,
    tradeDate: dto.tradeDate,
    remarks: dto.remarks,
    isDone: dto.isDone,
    createdByName: dto.createdByName ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapTradeMemoEntityToInput(
  entity: Partial<TradeMemoEntity>,
): TradeMemoInput {
  return {
    club: entity.clubName ?? "",
    membership: entity.membershipType ?? "",
    tradeType: entity.tradeType ?? "매수",
    customerName: entity.customerName ?? "",
    contact: entity.contact ?? "",
    offerPrice: entity.offerPrice,
    offerPriceNote: entity.offerPriceNote,
    desiredPrice: entity.desiredPrice,
    desiredPriceNote: entity.desiredPriceNote,
    notes: entity.notes,
    registrationDate: entity.registrationDate,
    tradeDate: entity.tradeDate,
    remarks: entity.remarks,
    isDone: entity.isDone,
  };
}
