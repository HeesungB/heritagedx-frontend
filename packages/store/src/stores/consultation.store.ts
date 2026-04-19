import { createStore } from "zustand/vanilla";
import type { GeneralRepositories, TradeListParams } from "@heritage-dx/api";
import type { ConsultationInput } from "@heritage-dx/types";
import { APPROVAL_ACTIONS } from "@heritage-dx/types";
import type { FetchStatus, PaginationState } from "../entities/common";
import type { ConsultationEntity } from "../entities/consultation";
import { mapConsultationDtoToEntity } from "../mappers/consultation.mapper";
import { normalizePagination } from "../mappers/helpers";

export interface ConsultationStoreState {
  items: ConsultationEntity[];
  pagination: PaginationState | null;
  status: FetchStatus;
  lastParams: TradeListParams | null;

  fetch: (params?: TradeListParams) => Promise<void>;
  create: (data: ConsultationInput) => Promise<ConsultationEntity | null>;
  update: (id: string, data: ConsultationInput) => Promise<ConsultationEntity | null>;
  remove: (id: string) => Promise<boolean>;
  toggleDone: (id: string, isDone: boolean) => Promise<boolean>;
  requestApproval: (id: string, reason?: string) => Promise<ConsultationEntity | null>;
  reopen: (id: string, reason?: string) => Promise<ConsultationEntity | null>;
  hydrate: (items: ConsultationEntity[], pagination: PaginationState) => void;
}

export function createConsultationStore(repos: GeneralRepositories) {
  return createStore<ConsultationStoreState>((set, get) => ({
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
        const response = await repos.consultations.getAll(params);
        if (response.success && response.data) {
          set({
            items: response.data.trades.map(mapConsultationDtoToEntity),
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

    create: async (data: ConsultationInput) => {
      try {
        const response = await repos.consultations.create(data);
        if (response.success && response.data) {
          const entity = mapConsultationDtoToEntity(response.data);
          // 목록 재조회
          const { lastParams } = get();
          get().fetch(lastParams ?? undefined);
          return entity;
        }
        return null;
      } catch {
        return null;
      }
    },

    update: async (id: string, data: ConsultationInput) => {
      try {
        const response = await repos.consultations.update(id, data);
        if (response.success && response.data) {
          const entity = mapConsultationDtoToEntity(response.data);
          // 낙관적 업데이트
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
        const response = await repos.consultations.delete(id);
        if (response.success) {
          // 낙관적 제거
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

    toggleDone: async (id: string, isDone: boolean) => {
      const { items } = get();
      const item = items.find((i) => i.id === id);
      if (!item) return false;

      // 낙관적 업데이트
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, isDone } : i)),
      }));

      try {
        const response = await repos.consultations.update(id, {
          club: item.clubName,
          membership: item.membershipType,
          tradeType: item.tradeType,
          customerName: item.customerName,
          contact: item.contact,
          isDone,
        });
        if (!response.success) {
          // 롤백
          set((s) => ({
            items: s.items.map((i) => (i.id === id ? { ...i, isDone: !isDone } : i)),
          }));
          return false;
        }
        return true;
      } catch {
        // 롤백
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, isDone: !isDone } : i)),
        }));
        return false;
      }
    },

    requestApproval: async (id: string, reason?: string) => {
      try {
        const response = await repos.consultations.approvalAction(id, {
          action: APPROVAL_ACTIONS.REQUEST_APPROVAL,
          reason,
        });
        if (response.success && response.data) {
          const entity = mapConsultationDtoToEntity(response.data);
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

    reopen: async (id: string, reason?: string) => {
      try {
        const response = await repos.consultations.approvalAction(id, {
          action: APPROVAL_ACTIONS.REOPEN,
          reason,
        });
        if (response.success && response.data) {
          const entity = mapConsultationDtoToEntity(response.data);
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

    hydrate: (items: ConsultationEntity[], pagination: PaginationState) => {
      set({ items, pagination, status: "success" });
    },
  }));
}

export type ConsultationStore = ReturnType<typeof createConsultationStore>;
