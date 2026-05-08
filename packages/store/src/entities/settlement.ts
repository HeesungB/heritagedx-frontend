/**
 * Settlement entity — 백엔드 DTO 와 모양은 같으나 nullable 정책을 명확히 한다.
 *   - 메타: PK 인 consultationId 외엔 모두 null 가능
 *   - 셀 값: string | number | boolean | null. 양식 셀 ↔ entity 변환은 settlement-sheet-adapter 가 담당
 *
 * 첫 GET/POST 응답에서 추가 필드(예: taxInvoice/route/profit/expense/tax 그룹) 가 발견되면
 * 이 인터페이스에 보강하고 mapper 한 곳에서 흡수한다.
 */
export interface SettlementEntity {
  // 메타
  consultationId: string;
  membershipTradeId: string | null;
  documentGeneratedAt: string | null;
  documentGeneratedByUserId: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  // 헤더
  membershipName: string | null;
  tradeDate: string | null;
  salesContractAmount: number | null;
  remarks: string | null;

  // 매도자
  sellName: string | null;
  sellPhone: string | null;
  sellDealerId: string | null;
  sellEntityType: string | null;
  sellMembershipAmount: number | null;
  sellCommissionDeducted: boolean | null;

  // 매수자
  buyName: string | null;
  buyPhone: string | null;
  buyDealerId: string | null;
  buyEntityType: string | null;
  buyMembershipAmount: number | null;
  buyStampTaxIncluded: boolean | null;
}

/** 메타 외의 셀 키 union — adapter / mapper 가 활용. */
export type SettlementCellKey = Exclude<
  keyof SettlementEntity,
  | "consultationId"
  | "membershipTradeId"
  | "documentGeneratedAt"
  | "documentGeneratedByUserId"
  | "createdAt"
  | "updatedAt"
>;

export const SETTLEMENT_CELL_KEYS: SettlementCellKey[] = [
  "membershipName",
  "tradeDate",
  "salesContractAmount",
  "remarks",
  "sellName",
  "sellPhone",
  "sellDealerId",
  "sellEntityType",
  "sellMembershipAmount",
  "sellCommissionDeducted",
  "buyName",
  "buyPhone",
  "buyDealerId",
  "buyEntityType",
  "buyMembershipAmount",
  "buyStampTaxIncluded",
];

export const EMPTY_SETTLEMENT_ENTITY = (
  consultationId: string,
): SettlementEntity => ({
  consultationId,
  membershipTradeId: null,
  documentGeneratedAt: null,
  documentGeneratedByUserId: null,
  createdAt: null,
  updatedAt: null,
  membershipName: null,
  tradeDate: null,
  salesContractAmount: null,
  remarks: null,
  sellName: null,
  sellPhone: null,
  sellDealerId: null,
  sellEntityType: null,
  sellMembershipAmount: null,
  sellCommissionDeducted: null,
  buyName: null,
  buyPhone: null,
  buyDealerId: null,
  buyEntityType: null,
  buyMembershipAmount: null,
  buyStampTaxIncluded: null,
});
