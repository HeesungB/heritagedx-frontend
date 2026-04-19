import { createStore } from "zustand/vanilla";
import type { AdminRepositories, TradeListParams } from "@heritage-dx/api";
import type { ApprovalAction, ConsultationInput } from "@heritage-dx/types";
import { APPROVAL_ACTIONS } from "@heritage-dx/types";
import type { FetchStatus, PaginationState } from "../entities/common";
import type { ConsultationEntity } from "../entities/consultation";
import { mapConsultationDtoToEntity } from "../mappers/consultation.mapper";
import { normalizePagination } from "../mappers/helpers";

export interface ConsultationAdminStoreState {
  items: ConsultationEntity[];
  pagination: PaginationState | null;
  status: FetchStatus;
  lastParams: TradeListParams | null;

  fetch: (params?: TradeListParams) => Promise<void>;
  create: (data: ConsultationInput) => Promise<ConsultationEntity | null>;
  update: (id: string, data: ConsultationInput) => Promise<ConsultationEntity | null>;
  remove: (id: string) => Promise<boolean>;
  approvalAction: (
    id: string,
    action: ApprovalAction,
    reason?: string,
  ) => Promise<ConsultationEntity | null>;
  requestApproval: (id: string, reason?: string) => Promise<ConsultationEntity | null>;
  approveFirst: (id: string, reason?: string) => Promise<ConsultationEntity | null>;
  hold: (id: string, reason: string) => Promise<ConsultationEntity | null>;
  reject: (id: string, reason: string) => Promise<ConsultationEntity | null>;
  reopen: (id: string, reason?: string) => Promise<ConsultationEntity | null>;
  hydrate: (items: ConsultationEntity[], pagination: PaginationState) => void;
}

export function createConsultationAdminStore(repos: AdminRepositories) {
  return createStore<ConsultationAdminStoreState>((set, get) => ({
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

    approvalAction: async (id, action, reason) => {
      try {
        const response = await repos.consultations.approvalAction(id, {
          action,
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

    requestApproval: (id, reason) =>
      get().approvalAction(id, APPROVAL_ACTIONS.REQUEST_APPROVAL, reason),
    approveFirst: (id, reason) =>
      get().approvalAction(id, APPROVAL_ACTIONS.APPROVE_FIRST, reason),
    hold: (id, reason) =>
      get().approvalAction(id, APPROVAL_ACTIONS.HOLD, reason),
    reject: (id, reason) =>
      get().approvalAction(id, APPROVAL_ACTIONS.REJECT, reason),
    reopen: (id, reason) =>
      get().approvalAction(id, APPROVAL_ACTIONS.REOPEN, reason),

    hydrate: (items: ConsultationEntity[], pagination: PaginationState) => {
      set({ items, pagination, status: "success" });
    },
  }));
}

export type ConsultationAdminStore = ReturnType<typeof createConsultationAdminStore>;
