import { createStore } from "zustand/vanilla";
import type { GeneralRepositories, CustomerListParams } from "@heritage-dx/api";
import type { CustomerInput, CustomerUpdateInput } from "@heritage-dx/types";
import type { FetchStatus, PaginationState } from "../entities/common";
import type {
  CustomerEntity,
  CustomerHistorySummaryEntity,
} from "../entities/customer";
import {
  mapCustomerDtoToEntity,
  mapCustomerHistorySummaryDtoToEntity,
} from "../mappers/customer.mapper";
import { normalizePagination } from "../mappers/helpers";

export interface CustomerCreateResult {
  success: boolean;
  entity?: CustomerEntity;
  conflict?: boolean;
  errorMessage?: string;
}

export interface CustomerStoreState {
  items: CustomerEntity[];
  pagination: PaginationState | null;
  status: FetchStatus;
  lastParams: CustomerListParams | null;

  fetch: (params?: CustomerListParams) => Promise<void>;
  create: (data: CustomerInput) => Promise<CustomerCreateResult>;
  update: (id: string, data: CustomerUpdateInput) => Promise<CustomerEntity | null>;
  remove: (id: string) => Promise<boolean>;
  searchByQuery: (query: string, limit?: number) => Promise<CustomerEntity[]>;
  getOne: (id: string) => Promise<CustomerEntity | null>;
  getHistorySummary: (
    id: string,
  ) => Promise<CustomerHistorySummaryEntity | null>;
  hydrate: (items: CustomerEntity[], pagination: PaginationState) => void;
}

export function createCustomerStore(repos: GeneralRepositories) {
  return createStore<CustomerStoreState>((set, get) => ({
    items: [],
    pagination: null,
    status: "idle",
    lastParams: null,

    fetch: async (params?: CustomerListParams) => {
      const { items, status } = get();
      if (status === "loading" || status === "refreshing") return;
      set({
        status: items.length > 0 ? "refreshing" : "loading",
        lastParams: params ?? null,
      });

      try {
        const response = await repos.customers.getAll(params);
        if (response.success && response.data) {
          set({
            items: response.data.customers.map(mapCustomerDtoToEntity),
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

    create: async (data: CustomerInput) => {
      try {
        const response = await repos.customers.create(data);
        if (response.success && response.data) {
          const entity = mapCustomerDtoToEntity(response.data);
          const { lastParams } = get();
          get().fetch(lastParams ?? undefined);
          return { success: true, entity };
        }
        const errorMessage = response.error ?? "고객 등록에 실패했습니다.";
        const conflict =
          errorMessage.includes("409") ||
          errorMessage.includes("중복") ||
          errorMessage.toLowerCase().includes("conflict");
        return { success: false, conflict, errorMessage };
      } catch (error) {
        return {
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "고객 등록에 실패했습니다.",
        };
      }
    },

    update: async (id: string, data: CustomerUpdateInput) => {
      try {
        const response = await repos.customers.update(id, data);
        if (response.success && response.data) {
          const entity = mapCustomerDtoToEntity(response.data);
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
        const response = await repos.customers.delete(id);
        if (response.success) {
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

    searchByQuery: async (query: string, limit = 10) => {
      const trimmed = query.trim();
      if (!trimmed) return [];
      try {
        const response = await repos.customers.getAll({
          search: trimmed,
          limit,
          sort: "updatedAt",
          order: "DESC",
        });
        if (response.success && response.data) {
          return response.data.customers.map(mapCustomerDtoToEntity);
        }
        return [];
      } catch {
        return [];
      }
    },

    getOne: async (id: string) => {
      try {
        const response = await repos.customers.getOne(id);
        if (response.success && response.data) {
          return mapCustomerDtoToEntity(response.data);
        }
        return null;
      } catch {
        return null;
      }
    },

    getHistorySummary: async (id: string) => {
      try {
        const response = await repos.customers.getHistorySummary(id);
        if (response.success && response.data) {
          return mapCustomerHistorySummaryDtoToEntity(response.data);
        }
        return null;
      } catch {
        return null;
      }
    },

    hydrate: (items: CustomerEntity[], pagination: PaginationState) => {
      set({ items, pagination, status: "success" });
    },
  }));
}

export type CustomerStore = ReturnType<typeof createCustomerStore>;
