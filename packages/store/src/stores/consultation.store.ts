import { createStore } from "zustand/vanilla";
import type { GeneralRepositories, TradeListParams } from "@heritage-dx/api";
import type { ConsultationInput } from "@heritage-dx/types";
import { APPROVAL_ACTIONS } from "@heritage-dx/types";
import type { FetchStatus, PaginationState } from "../entities/common";
import type {
  ConsultationEntity,
  ConsultationApprovalFillableField,
} from "../entities/consultation";
import { collectMissingConsultationApprovalFields } from "../entities/consultation";

const FILLABLE_FIELD_SET: ReadonlySet<ConsultationApprovalFillableField> = new Set([
  "customerName",
  "contact",
  "offerPrice",
  "depositAmount",
]);

export interface RequestApprovalResult {
  entity: ConsultationEntity | null;
  missingFillable?: ConsultationApprovalFillableField[];
  errorMessage?: string;
}
import {
  mapConsultationDtoToEntity,
  mapConsultationEntityToInput,
} from "../mappers/consultation.mapper";
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
  requestApproval: (
    id: string,
    input?: {
      depositAmount?: number;
      offerPrice?: number;
      customerName?: string;
      contact?: string;
      reason?: string;
    },
  ) => Promise<RequestApprovalResult>;
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
          ...mapConsultationEntityToInput(item),
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

    requestApproval: async (
      id: string,
      input?: {
        depositAmount?: number;
        offerPrice?: number;
        customerName?: string;
        contact?: string;
        reason?: string;
      },
    ): Promise<RequestApprovalResult> => {
      try {
        const needsUpdate =
          input?.depositAmount !== undefined ||
          input?.offerPrice !== undefined ||
          input?.customerName !== undefined ||
          input?.contact !== undefined;
        if (needsUpdate) {
          const current = get().items.find((i) => i.id === id);
          if (!current) return { entity: null };
          const base = mapConsultationEntityToInput(current);
          const patch: Partial<typeof base> = {};
          if (input?.depositAmount !== undefined) patch.depositAmount = input.depositAmount;
          if (input?.offerPrice !== undefined) patch.offerPrice = input.offerPrice;
          if (input?.customerName !== undefined) patch.customerName = input.customerName.trim();
          if (input?.contact !== undefined) patch.contact = input.contact.trim();
          const updateResponse = await repos.consultations.update(id, {
            ...base,
            ...patch,
          });
          if (!updateResponse.success || !updateResponse.data) {
            return { entity: null, errorMessage: updateResponse.error };
          }
          const updated = mapConsultationDtoToEntity(updateResponse.data);
          set((s) => ({
            items: s.items.map((item) => (item.id === id ? updated : item)),
          }));
        }

        const latest = get().items.find((i) => i.id === id);
        if (!latest) return { entity: null };
        const preCheck = collectMissingConsultationApprovalFields(latest);
        if (preCheck.structural.length > 0) {
          return { entity: null };
        }
        if (preCheck.fillable.length > 0) {
          return { entity: null, missingFillable: preCheck.fillable };
        }

        const response = await repos.consultations.approvalAction(id, {
          action: APPROVAL_ACTIONS.REQUEST_APPROVAL,
          reason: input?.reason,
        });
        if (response.success && response.data) {
          const entity = mapConsultationDtoToEntity(response.data);
          set((s) => ({
            items: s.items.map((item) => (item.id === id ? entity : item)),
          }));
          return { entity };
        }

        // 서버가 missingFields를 돌려줄 때(드리프트): 클라이언트 상태를 서버 기준으로 맞추고
        // 채울 수 있는 필드 목록을 UI로 전달 → 모달 재오픈 유도
        if (response.errorCode === "CONSULTATION_APPROVAL_REQUIRED_FIELDS") {
          const rawMissing = response.errorDetails?.missingFields;
          const serverMissing = Array.isArray(rawMissing)
            ? (rawMissing.filter(
                (f): f is ConsultationApprovalFillableField =>
                  typeof f === "string" && FILLABLE_FIELD_SET.has(f as ConsultationApprovalFillableField),
              ))
            : [];
          if (serverMissing.length > 0) {
            set((s) => ({
              items: s.items.map((item) => {
                if (item.id !== id) return item;
                const patched = { ...item };
                for (const field of serverMissing) {
                  if (field === "customerName" || field === "contact") {
                    patched[field] = "";
                  } else {
                    patched[field] = null;
                  }
                }
                return patched;
              }),
            }));
            return { entity: null, missingFillable: serverMissing };
          }
        }

        return { entity: null, errorMessage: response.error };
      } catch {
        return { entity: null };
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
