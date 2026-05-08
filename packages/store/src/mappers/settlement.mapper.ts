import type {
  Settlement,
  SettlementInput,
  SettlementUpdateInput,
} from "@heritage-dx/types";
import {
  EMPTY_SETTLEMENT_ENTITY,
  SETTLEMENT_CELL_KEYS,
  type SettlementEntity,
} from "../entities/settlement";

/**
 * Settlement DTO → Entity. 백엔드 평탄 필드를 1:1 로 흡수한다.
 * 응답에 없는 키는 base 의 null 값을 그대로 둔다.
 */
export function mapSettlementDtoToEntity(dto: Settlement): SettlementEntity {
  const entity = EMPTY_SETTLEMENT_ENTITY(dto.consultationId);
  entity.membershipTradeId = dto.membershipTradeId ?? null;
  entity.documentGeneratedAt = dto.documentGeneratedAt ?? null;
  entity.documentGeneratedByUserId = dto.documentGeneratedByUserId ?? null;
  entity.createdAt = dto.createdAt ?? null;
  entity.updatedAt = dto.updatedAt ?? null;

  for (const key of SETTLEMENT_CELL_KEYS) {
    const v = (dto as unknown as Record<string, unknown>)[key];
    if (v === undefined) continue;
    (entity as unknown as Record<string, unknown>)[key] = v ?? null;
  }
  return entity;
}

/**
 * 백엔드 DTO 가 받지 않거나 서버 산정 필드 — 페이로드에서 제외해야 한다.
 * - documentGenerated* / createdAt / updatedAt: 서버 산정
 * - membershipTradeId: 거래 전환 시 서버가 설정 (클라이언트는 보낼 수 없음)
 * - remarks: 백엔드 DTO 에 정의되어 있지 않음 (클라이언트 표시 전용)
 *
 * 사용자가 직접 알린 백엔드 거부 필드는 여기에 추가한다.
 */
const SERVER_OMIT_KEYS = new Set<string>([
  "documentGeneratedAt",
  "documentGeneratedByUserId",
  "createdAt",
  "updatedAt",
  "membershipTradeId",
  "remarks",
]);

/**
 * Entity → POST /api/settlements 페이로드 (전체 생성).
 * - SERVER_OMIT_KEYS 는 페이로드에서 제외
 * - null/undefined 셀 값도 omit — 백엔드의 nullable 정책 차이로 인한 거부를 회피.
 *   사용자가 비운 셀은 자동으로 페이로드에서 빠짐 (PUT 에서 dirty 로 명시 비움 가능).
 */
export function mapSettlementEntityToInput(
  entity: SettlementEntity,
): SettlementInput {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entity)) {
    if (SERVER_OMIT_KEYS.has(k)) continue;
    if (v === null || v === undefined) continue;
    out[k] = v;
  }
  return out as unknown as SettlementInput;
}

/**
 * partial entity → PUT /api/settlements/:id 페이로드.
 * 들어 있는 키만 보냄(다른 셀의 기존 값 보존).
 * SERVER_OMIT_KEYS 에 해당하는 필드는 제외하지만, dirty 로 들어온 셀의 null 은 명시 비움 의도라 보존한다.
 */
export function mapSettlementEntityToUpdateInput(
  patch: Partial<SettlementEntity>,
): SettlementUpdateInput {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === "consultationId") continue;
    if (SERVER_OMIT_KEYS.has(k)) continue;
    out[k] = v ?? null;
  }
  return out as SettlementUpdateInput;
}
