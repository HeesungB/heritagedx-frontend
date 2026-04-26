import { createStore } from "zustand/vanilla";
import type { AdminRepositories, TradeListParams } from "@heritage-dx/api";
import type { AdminTradeAction, MembershipTradeInput } from "@heritage-dx/types";
import { APPROVAL_ACTIONS } from "@heritage-dx/types";
import type { FetchStatus, PaginationState } from "../entities/common";
import type { MembershipTradeEntity } from "../entities/membership-trade";
import { mapMembershipTradeDtoToEntity } from "../mappers/membership-trade.mapper";
import { normalizePagination } from "../mappers/helpers";

// 관리자 거래 store
// - workflowAction: ADVANCE_TO_TAX_FILING / ADVANCE_TO_COMPLETED / REJECT 만 허용.
// - REJECT 는 거래 레코드를 물리 삭제하므로 응답 후 로컬 목록에서도 제거한다.
//   (서버는 원천 상담을 DRAFT 로 복귀시키고, 다른 거래가 없으면 고객 등급을 HIGH_INTENT 로 자동 하향)
export interface MembershipTradeAdminStoreState {
  items: MembershipTradeEntity[];
  pagination: PaginationState | null;
  status: FetchStatus;
  lastParams: TradeListParams | null;

  fetch: (params?: TradeListParams) => Promise<void>;
  create: (data: MembershipTradeInput) => Promise<MembershipTradeEntity | null>;
  update: (id: string, data: MembershipTradeInput) => Promise<MembershipTradeEntity | null>;
  remove: (id: string) => Promise<boolean>;
  workflowAction: (
    id: string,
    action: AdminTradeAction,
    reason?: string,
  ) => Promise<MembershipTradeEntity | null>;
  advanceToTaxFiling: (id: string) => Promise<MembershipTradeEntity | null>;
  advanceToCompleted: (id: string) => Promise<MembershipTradeEntity | null>;
  reject: (id: string, reason: string) => Promise<boolean>;
  hydrate: (items: MembershipTradeEntity[], pagination: PaginationState) => void;
}

export function createMembershipTradeAdminStore(repos: AdminRepositories) {
  return createStore<MembershipTradeAdminStoreState>((set, get) => ({
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

    create: async (data: MembershipTradeInput) => {
      try {
        const response = await repos.membershipTrades.create(data);
        if (response.success && response.data) {
          const entity = mapMembershipTradeDtoToEntity(response.data);
          const { lastParams } = get();
          get().fetch(lastParams ?? undefined);
          return entity;
        }
        return null;
      } catch {
        return null;
      }
    },

    update: async (id: string, data: MembershipTradeInput) => {
      try {
        const response = await repos.membershipTrades.update(id, data);
        if (response.success && response.data) {
          const entity = mapMembershipTradeDtoToEntity(response.data);
          set((s) => ({
            items: s.items.map((item) => (item.id === id ? entity : item)),
          }));
          return entity;
        }
        return null;
      } catch {
        return null;
      }
    },

    remove: async (id: string) => {
      try {
        const response = await repos.membershipTrades.delete(id);
        if (response.success) {
          set((s) => ({
            items: s.items.filter((item) => item.id !== id),
            pagination: s.pagination
              ? { ...s.pagination, total: s.pagination.total - 1 }
              : null,
          }));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    workflowAction: async (id, action, reason) => {
      try {
        const response = await repos.membershipTrades.workflowAction(id, {
          action,
          reason,
        });
        if (response.success && response.data) {
          const entity = mapMembershipTradeDtoToEntity(response.data);
          set((s) => ({
            items: s.items.map((item) => (item.id === id ? entity : item)),
          }));
          return entity;
        }
        return null;
      } catch {
        return null;
      }
    },

    advanceToTaxFiling: (id) =>
      get().workflowAction(id, APPROVAL_ACTIONS.ADVANCE_TO_TAX_FILING),
    advanceToCompleted: (id) =>
      get().workflowAction(id, APPROVAL_ACTIONS.ADVANCE_TO_COMPLETED),

    reject: async (id, reason) => {
      try {
        const response = await repos.membershipTrades.workflowAction(id, {
          action: APPROVAL_ACTIONS.REJECT,
          reason,
        });
        if (response.success) {
          // REJECT 시 서버가 거래 레코드를 물리 삭제하므로 목록에서도 제거
          set((s) => ({
            items: s.items.filter((item) => item.id !== id),
            pagination: s.pagination
              ? { ...s.pagination, total: Math.max(0, s.pagination.total - 1) }
              : null,
          }));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    hydrate: (items: MembershipTradeEntity[], pagination: PaginationState) => {
      set({ items, pagination, status: "success" });
    },
  }));
}

export type MembershipTradeAdminStore = ReturnType<typeof createMembershipTradeAdminStore>;
