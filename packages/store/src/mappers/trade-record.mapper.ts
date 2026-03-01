import type { TradeRecord, TradeRecordInput } from "@heritage-dx/types";
import type { TradeRecordEntity } from "../entities/trade-record";

export function mapTradeRecordDtoToEntity(dto: TradeRecord): TradeRecordEntity {
  return {
    id: dto.id,
    clubName: dto.clubName ?? "",
    tradeType: dto.tradeType as "매수" | "매도",

    customer: {
      name: dto.customerName,
      contact: dto.contact,
    },

    trade: {
      membershipName: dto.membershipName,
      contractDate: dto.contractDate,
      amount: dto.amount,
      tradingPartner: dto.tradingPartner,
      tradeAmount: dto.tradeAmount,
      commission: dto.commission,
      contractFee: dto.contractFee,
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

    manager: dto.manager,
    description: dto.description,
    remarks: dto.remarks,
    createdByName: dto.createdByName ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapTradeRecordEntityToInput(
  entity: Partial<TradeRecordEntity>,
): TradeRecordInput {
  return {
    customerName: entity.customer?.name ?? "",
    contact: entity.customer?.contact ?? "",
    tradeType: entity.tradeType ?? "매수",
    membershipName: entity.trade?.membershipName ?? "",
    contractDate: entity.trade?.contractDate,
    amount: entity.trade?.amount,
    tradingPartner: entity.trade?.tradingPartner,
    tradeAmount: entity.trade?.tradeAmount,
    commission: entity.trade?.commission,
    marketProfit: entity.financials?.marketProfit,
    total: entity.financials?.total,
    expense: entity.financials?.expense,
    netProfit: entity.financials?.netProfit,
    contractFee: entity.trade?.contractFee,
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
