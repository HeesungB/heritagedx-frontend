import { createStore } from "zustand/vanilla";
import type { AdminRepositories, TradeListParams } from "@heritage-dx/api";
import type { AdminConsultationAction, ConsultationInput } from "@heritage-dx/types";
import { APPROVAL_ACTIONS } from "@heritage-dx/types";
import type { FetchStatus, PaginationState } from "../entities/common";
import type { ConsultationEntity } from "../entities/consultation";
import { mapConsultationDtoToEntity } from "../mappers/consultation.mapper";
import { normalizePagination } from "../mappers/helpers";

// 관리자 상담 store
// - approvalAction: APPROVE_FIRST / REOPEN 만 허용 (REQUEST_APPROVAL/HOLD/REJECT 모두 제거)
// - REOPEN 은 거래내역 이관 *전* 승인 단계에서 무산된 경우에 호출되며, 상담을 DRAFT 로 복귀시킨다.
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
    action: AdminConsultationAction,
    reason?: string,
  ) => Promise<ConsultationEntity | null>;
  approveFirst: (id: string, reason?: string) => Promise<ConsultationEntity | null>;
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

    approveFirst: (id, reason) =>
      get().approvalAction(id, APPROVAL_ACTIONS.APPROVE_FIRST, reason),
    reopen: (id, reason) =>
      get().approvalAction(id, APPROVAL_ACTIONS.REOPEN, reason),

    hydrate: (items: ConsultationEntity[], pagination: PaginationState) => {
      set({ items, pagination, status: "success" });
    },
  }));
}

export type ConsultationAdminStore = ReturnType<typeof createConsultationAdminStore>;
