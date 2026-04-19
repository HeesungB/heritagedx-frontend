import { createStore } from "zustand/vanilla";
import type { AdminRepositories, TradeListParams } from "@heritage-dx/api";
import type { ApprovalAction, MembershipTradeInput } from "@heritage-dx/types";
import { APPROVAL_ACTIONS } from "@heritage-dx/types";
import type { FetchStatus, PaginationState } from "../entities/common";
import type { MembershipTradeEntity } from "../entities/membership-trade";
import { mapMembershipTradeDtoToEntity } from "../mappers/membership-trade.mapper";
import { normalizePagination } from "../mappers/helpers";

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
    action: ApprovalAction,
    reason?: string,
  ) => Promise<MembershipTradeEntity | null>;
  requestFinalReview: (id: string, reason?: string) => Promise<MembershipTradeEntity | null>;
  approveFirst: (id: string, reason?: string) => Promise<MembershipTradeEntity | null>;
  hold: (id: string, reason: string) => Promise<MembershipTradeEntity | null>;
  reject: (id: string, reason: string) => Promise<MembershipTradeEntity | null>;
  reopen: (id: string, reason?: string) => Promise<MembershipTradeEntity | null>;
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

    requestFinalReview: (id, reason) =>
      get().workflowAction(id, APPROVAL_ACTIONS.REQUEST_APPROVAL, reason),
    approveFirst: (id, reason) =>
      get().workflowAction(id, APPROVAL_ACTIONS.APPROVE_FIRST, reason),
    hold: (id, reason) =>
      get().workflowAction(id, APPROVAL_ACTIONS.HOLD, reason),
    reject: (id, reason) =>
      get().workflowAction(id, APPROVAL_ACTIONS.REJECT, reason),
    reopen: (id, reason) =>
      get().workflowAction(id, APPROVAL_ACTIONS.REOPEN, reason),

    hydrate: (items: MembershipTradeEntity[], pagination: PaginationState) => {
      set({ items, pagination, status: "success" });
    },
  }));
}

export type MembershipTradeAdminStore = ReturnType<typeof createMembershipTradeAdminStore>;
