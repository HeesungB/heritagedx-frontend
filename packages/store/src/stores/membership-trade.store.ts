import { createStore } from "zustand/vanilla";
import type { GeneralRepositories, TradeListParams } from "@heritage-dx/api";
import type { FetchStatus, PaginationState } from "../entities/common";
import type { MembershipTradeEntity } from "../entities/membership-trade";
import { mapMembershipTradeDtoToEntity } from "../mappers/membership-trade.mapper";
import { normalizePagination } from "../mappers/helpers";

// 공개 거래 store는 read-only.
// 거래 생성/수정/삭제/액션 엔드포인트는 모두 제거되었고 (거래는 상담 APPROVE_FIRST 시 백엔드가 자동 생성),
// 관리자만 admin 경로에서 변경할 수 있다.
export interface MembershipTradeStoreState {
  items: MembershipTradeEntity[];
  pagination: PaginationState | null;
  status: FetchStatus;
  lastParams: TradeListParams | null;

  fetch: (params?: TradeListParams) => Promise<void>;
  hydrate: (items: MembershipTradeEntity[], pagination: PaginationState) => void;
}

export function createMembershipTradeStore(repos: GeneralRepositories) {
  return createStore<MembershipTradeStoreState>((set, get) => ({
    items: [],
    pagination: null,
    status: "idle",
    lastParams: null,

    fetch: async (params?: TradeListParams) => {
      const { items, status } = get();
      if (status === "loading" || status === "refreshing") return;
      set({
        status: items.length > 0 ? "refreshing" : "loading",
        lastParams: params ?? null,
      });

      try {
        const response = await repos.membershipTrades.getAll(params);
        if (response.success && response.data) {
          set({
            items: response.data.trades.map(mapMembershipTradeDtoToEntity),
            pagination: normalizePagination(response.data.pagination),
            status: "success",
          });
        } else {
          set({ status: "error" });
        }
      } catch {
        set({ status: "error" });
      }
    },

    hydrate: (items: MembershipTradeEntity[], pagination: PaginationState) => {
      set({ items, pagination, status: "success" });
    },
  }));
}

export type MembershipTradeStore = ReturnType<typeof createMembershipTradeStore>;
