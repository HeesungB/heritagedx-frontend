export interface TradeRecordEntity {
  id: string;
  clubName: string;
  tradeType: "매수" | "매도";

  customer: {
    name: string;
    contact: string;
  };

  trade: {
    membershipName: string;
    contractDate: string | null;
    amount: number | null;
    tradingPartner: string | null;
    tradeAmount: number | null;
    commission: number | null;
    contractFee: number | null;
    actualTransactionDate: string | null;
  };

  financials: {
    marketProfit: number | null;
    total: number | null;
    expense: number | null;
    netProfit: number | null;
  };

  tax: {
    taxTransfer: boolean;
    taxAcquisition: boolean;
    invoiceSales: number | null;
    invoicePurchase: number | null;
  };

  balance: {
    balanceDate: string | null;
    balanceCompleted: boolean;
  };

  manager: string | null;
  description: string | null;
  remarks: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}
