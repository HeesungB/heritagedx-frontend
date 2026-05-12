import type { MembershipTrade, MembershipTradeInput } from "@heritage-dx/types";
import type { MembershipTradeEntity } from "../entities/membership-trade";

export function mapMembershipTradeDtoToEntity(dto: MembershipTrade): MembershipTradeEntity {
  return {
    id: dto.id,
    customerId: dto.customerId,
    sourceConsultationId: dto.sourceConsultationId,
    settlementId: dto.settlementId ?? null,
    clubId: dto.clubId,
    clubName: dto.clubName ?? "",
    membershipId: dto.membershipId,
    tradeType: dto.tradeType as "매수" | "매도",
    workflowStatus: dto.workflowStatus,

    customer: {
      name: dto.customerName,
      contact: dto.contact,
    },

    trade: {
      membershipName: dto.membershipName,
      contractDate: dto.contractDate,
      amount: dto.amount,
      depositAmount: dto.depositAmount,
      tradingPartner: dto.tradingPartner,
      tradeAmount: dto.tradeAmount,
      commission: dto.commission,
      actualTransactionDate: dto.actualTransactionDate,
    },

    financials: {
      marketProfit: dto.marketProfit,
      total: dto.total,
      expense: dto.expense,
      netProfit: dto.netProfit,
    },

    tax: {
      taxTransfer: dto.taxTransfer,
      taxAcquisition: dto.taxAcquisition,
      invoiceSales: dto.invoiceSales,
      invoicePurchase: dto.invoicePurchase,
    },

    balance: {
      balanceDate: dto.balanceDate,
      balanceCompleted: dto.balanceCompleted,
    },

    finalApprovedAt: dto.finalApprovedAt,

    manager: dto.manager,
    description: dto.description,
    remarks: dto.remarks,
    createdByName: dto.createdByName ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapMembershipTradeEntityToInput(
  entity: Partial<MembershipTradeEntity>,
): MembershipTradeInput {
  return {
    clubId: entity.clubId ?? "",
    membershipId: entity.membershipId ?? "",
    customerId: entity.customerId ?? null,
    customerName: entity.customer?.name ?? "",
    contact: entity.customer?.contact ?? "",
    tradeType: entity.tradeType ?? "매수",
    contractDate: entity.trade?.contractDate,
    amount: entity.trade?.amount,
    depositAmount: entity.trade?.depositAmount,
    tradingPartner: entity.trade?.tradingPartner,
    tradeAmount: entity.trade?.tradeAmount,
    commission: entity.trade?.commission,
    marketProfit: entity.financials?.marketProfit,
    total: entity.financials?.total,
    expense: entity.financials?.expense,
    netProfit: entity.financials?.netProfit,
    balanceDate: entity.balance?.balanceDate,
    balanceCompleted: entity.balance?.balanceCompleted,
    manager: entity.manager,
    taxTransfer: entity.tax?.taxTransfer,
    taxAcquisition: entity.tax?.taxAcquisition,
    invoiceSales: entity.tax?.invoiceSales,
    invoicePurchase: entity.tax?.invoicePurchase,
    description: entity.description,
    remarks: entity.remarks,
    actualTransactionDate: entity.trade?.actualTransactionDate,
  };
}
