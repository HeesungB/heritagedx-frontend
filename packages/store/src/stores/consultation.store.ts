import { createStore } from "zustand/vanilla";
import type { GeneralRepositories, TradeListParams } from "@heritage-dx/api";
import type { ConsultationInput, ConsultationNoteEntry } from "@heritage-dx/types";
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
  // 메모(notes JSONB entry) CRUD — 응답으로 갱신된 상담 entity 를 반환하고
  // store 의 items 도 같이 동기화한다. content 길이/권한/완료 거래 차단 등 검증은 서버 책임.
  addNote: (id: string, content: string) => Promise<ConsultationEntity | null>;
  updateNote: (
    id: string,
    noteId: string,
    content: string,
  ) => Promise<ConsultationEntity | null>;
  deleteNote: (id: string, noteId: string) => Promise<ConsultationEntity | null>;
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
  hydrate: (items: ConsultationEntity[], pagination: PaginationState) => void;
}

// 메모 CRUD 응답은 `{notes: {entries: [...]}}` 부분 응답이라 entity 를 통째로 재생성하면
// 다른 필드(거래유형/골프장/고객 등)가 모두 undefined 가 된다. 기존 item 을 보존한 채
// notes 만 patch 하고, 갱신된 entity 를 반환한다.
function mergeNotesIntoItem(
  set: (
    fn: (state: ConsultationStoreState) => Partial<ConsultationStoreState>,
  ) => void,
  get: () => ConsultationStoreState,
  id: string,
  entries: ConsultationNoteEntry[] | undefined,
): ConsultationEntity | null {
  const next = entries ?? [];
  const now = new Date().toISOString();
  set((s) => ({
    items: s.items.map((item) =>
      item.id === id ? { ...item, notes: next, updatedAt: now } : item,
    ),
  }));
  return get().items.find((item) => item.id === id) ?? null;
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

    // 백엔드가 ConsultationInput 으로 isDone 을 더 이상 받지 않아 서버 영구화는 보류 상태.
    // 새로고침 시 토글 결과가 사라질 수 있으므로 별도 토글 엔드포인트가 생기면 그쪽으로 연결.
    toggleDone: async (id: string, isDone: boolean) => {
      const { items } = get();
      const item = items.find((i) => i.id === id);
      if (!item) return false;
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, isDone } : i)),
      }));
      return true;
    },

    addNote: async (id, content) => {
      const trimmed = content.trim();
      if (!trimmed) return null;
      try {
        const response = await repos.consultations.addNote(id, { content: trimmed });
        if (!response.success || !response.data) return null;
        return mergeNotesIntoItem(set, get, id, response.data.notes?.entries);
      } catch {
        return null;
      }
    },

    updateNote: async (id, noteId, content) => {
      const trimmed = content.trim();
      if (!trimmed) return null;
      try {
        const response = await repos.consultations.updateNote(id, noteId, {
          content: trimmed,
        });
        if (!response.success || !response.data) return null;
        return mergeNotesIntoItem(set, get, id, response.data.notes?.entries);
      } catch {
        return null;
      }
    },

    deleteNote: async (id, noteId) => {
      try {
        const response = await repos.consultations.deleteNote(id, noteId);
        if (!response.success || !response.data) return null;
        return mergeNotesIntoItem(set, get, id, response.data.notes?.entries);
      } catch {
        return null;
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

    hydrate: (items: ConsultationEntity[], pagination: PaginationState) => {
      set({ items, pagination, status: "success" });
    },
  }));
}

export type ConsultationStore = ReturnType<typeof createConsultationStore>;
