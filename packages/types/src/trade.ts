// 거래 메모 (Consultation/Trade Memo)
export interface TradeMemo {
  id: string;
  clubId: string | null;
  clubName: string;
  membershipType: string;
  membershipId?: string | null;
  membershipName?: string;
  isShared?: boolean;
  tradeType: string;
  customerName: string;
  contact: string;
  offerPrice: string | number | null;
  offerPriceNote: string | null;
  desiredPrice: string | number | null;
  desiredPriceNote: string | null;
  notes: string | null;
  registrationDate: string | null;
  tradeDate: string | null;
  remarks: string | null;
  isDone: boolean;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeMemosResponse {
  trades: TradeMemo[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface TradeMemoInput {
  club: string;
  membership: string;
  tradeType: string;
  customerName: string;
  contact: string;
  offerPrice?: number | null;
  offerPriceNote?: string | null;
  desiredPrice?: number | null;
  desiredPriceNote?: string | null;
  notes?: string | null;
  registrationDate?: string | null;
  tradeDate?: string | null;
  remarks?: string | null;
  isDone?: boolean;
}

// 거래 내역 (Membership Trade Record)
export interface TradeRecord {
  id: string;
  clubName?: string;
  customerName: string;
  contact: string;
  tradeType: string;
  membershipName: string;
  contractDate: string | null;
  amount: number | null;
  tradingPartner: string | null;
  tradeAmount: number | null;
  commission: number | null;
  marketProfit: number | null;
  total: number | null;
  expense: number | null;
  description: string | null;
  netProfit: number | null;
  contractFee: number | null;
  balanceDate: string | null;
  balanceCompleted: boolean;
  manager: string | null;
  taxTransfer: boolean;
  taxAcquisition: boolean;
  invoiceSales: number | null;
  invoicePurchase: number | null;
  remarks: string | null;
  actualTransactionDate: string | null;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeRecordsResponse {
  trades: TradeRecord[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface TradeRecordInput {
  customerName: string;
  contact: string;
  tradeType: string;
  membershipName: string;
  contractDate?: string | null;
  amount?: number | null;
  tradingPartner?: string | null;
  tradeAmount?: number | null;
  commission?: number | null;
  marketProfit?: number | null;
  total?: number | null;
  expense?: number | null;
  description?: string | null;
  netProfit?: number | null;
  contractFee?: number | null;
  balanceDate?: string | null;
  balanceCompleted?: boolean;
  manager?: string | null;
  taxTransfer?: boolean;
  taxAcquisition?: boolean;
  invoiceSales?: number | null;
  invoicePurchase?: number | null;
  remarks?: string | null;
  actualTransactionDate?: string | null;
}
