export interface TradeMemoEntity {
  id: string;
  clubId: string | null;
  clubName: string;
  membershipType: string;
  tradeType: "매수" | "매도";
  customerName: string;
  contact: string;
  offerPrice: number | null;
  offerPriceNote: string | null;
  desiredPrice: number | null;
  desiredPriceNote: string | null;
  notes: string | null;
  registrationDate: string | null;
  tradeDate: string | null;
  remarks: string | null;
  isDone: boolean;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}
