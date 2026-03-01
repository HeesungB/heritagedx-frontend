import { createStore } from "zustand/vanilla";
import type { GeneralRepositories, TradeListParams } from "@heritage-dx/api";
import type { TradeRecordInput } from "@heritage-dx/types";
import type { FetchStatus, PaginationState } from "../entities/common";
import type { TradeRecordEntity } from "../entities/trade-record";
import { mapTradeRecordDtoToEntity } from "../mappers/trade-record.mapper";
import { normalizePagination } from "../mappers/helpers";

export interface TradeRecordStoreState {
  items: TradeRecordEntity[];
  pagination: PaginationState | null;
  status: FetchStatus;
  lastParams: TradeListParams | null;

  fetch: (params?: TradeListParams) => Promise<void>;
  create: (data: TradeRecordInput) => Promise<TradeRecordEntity | null>;
  update: (id: string, data: TradeRecordInput) => Promise<TradeRecordEntity | null>;
  remove: (id: string) => Promise<boolean>;
  hydrate: (items: TradeRecordEntity[], pagination: PaginationState) => void;
}

export function createTradeRecordStore(repos: GeneralRepositories) {
  return createStore<TradeRecordStoreState>((set, get) => ({
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
            items: response.data.trades.map(mapTradeRecordDtoToEntity),
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

    create: async (data: TradeRecordInput) => {
      try {
        const response = await repos.membershipTrades.create(data);
        if (response.success && response.data) {
          const entity = mapTradeRecordDtoToEntity(response.data);
          const { lastParams } = get();
          get().fetch(lastParams ?? undefined);
          return entity;
        }
        return null;
      } catch {
        return null;
      }
    },

    update: async (id: string, data: TradeRecordInput) => {
      try {
        const response = await repos.membershipTrades.update(id, data);
        if (response.success && response.data) {
          const entity = mapTradeRecordDtoToEntity(response.data);
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
              ? { ...s.pagination, totalItems: s.pagination.totalItems - 1 }
              : null,
          }));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    hydrate: (items: TradeRecordEntity[], pagination: PaginationState) => {
      set({ items, pagination, status: "success" });
    },
  }));
}

export type TradeRecordStore = ReturnType<typeof createTradeRecordStore>;
