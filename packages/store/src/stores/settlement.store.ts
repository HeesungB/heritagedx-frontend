import { createStore } from "zustand/vanilla";
import type { GeneralRepositories } from "@heritage-dx/api";
import type {
  SettlementInput,
  SettlementUpdateInput,
} from "@heritage-dx/types";
import type { SettlementEntity } from "../entities/settlement";
import {
  mapSettlementDtoToEntity,
  mapSettlementEntityToInput,
  mapSettlementEntityToUpdateInput,
} from "../mappers/settlement.mapper";

export interface SettlementStoreState {
  /** consultationId → entity. 1:1 관계라 Map 형태가 자연스럽다. */
  byConsultation: Record<string, SettlementEntity>;

  /**
   * 상담 기준 초안값 산출. 응답을 캐시에 넣지는 않는다(DB 미저장 가정).
   * 백엔드 응답이 `{ draft, missingFields, warnings }` 한 단계 감싸진 형태라
   * draft 만 entity 로 풀고 missingFields 도 함께 반환한다.
   */
  createDraft: (consultationId: string) => Promise<{
    entity: SettlementEntity;
    missingFields: string[];
  } | null>;

  /**
   * 첫 persist. 응답을 캐시에 반영.
   * 검증 실패 시 `{ errors }` 반환 — 호출 측이 form.setError 등으로 처리.
   */
  create: (
    entity: SettlementEntity,
  ) => Promise<{ entity: SettlementEntity } | { errors: string[] } | null>;

  /** 단건 조회. 캐시에 반영하고 entity 반환. 404/실패 시 null. */
  fetchOne: (consultationId: string) => Promise<SettlementEntity | null>;

  /** 부분 수정. 응답 entity 로 캐시 갱신. 검증 실패 시 `{ errors }`. */
  update: (
    consultationId: string,
    patch: Partial<SettlementEntity>,
  ) => Promise<{ entity: SettlementEntity } | { errors: string[] } | null>;

  /**
   * 문서 생성 완료 마킹. 검증 실패 시 errors / errorCode / errorDetails 반환.
   * SETTLEMENT_REQUIRED_FIELDS 코드의 경우 `errorDetails.missingFields` 가 채워져 옴.
   */
  markDocumentGenerated: (
    consultationId: string,
  ) => Promise<
    | { entity: SettlementEntity }
    | {
        errors: string[];
        errorCode?: string;
        errorDetails?: Record<string, unknown> | null;
      }
    | null
  >;

  /** 삭제. 캐시에서도 제거. */
  remove: (consultationId: string) => Promise<boolean>;
}

export function createSettlementStore(repos: GeneralRepositories) {
  return createStore<SettlementStoreState>((set) => {
    const setEntity = (entity: SettlementEntity) =>
      set((s) => ({
        byConsultation: { ...s.byConsultation, [entity.consultationId]: entity },
      }));

    return {
      byConsultation: {},

      createDraft: async (consultationId: string) => {
        try {
          const response = await repos.settlements.createDraft(consultationId);
          if (response.success && response.data) {
            return {
              entity: mapSettlementDtoToEntity(response.data.draft),
              missingFields: response.data.missingFields ?? [],
            };
          }
          return null;
        } catch {
          return null;
        }
      },

      create: async (entity: SettlementEntity) => {
        try {
          const payload: SettlementInput = mapSettlementEntityToInput(entity);
          const response = await repos.settlements.create(payload);
          if (response.success && response.data) {
            const next = mapSettlementDtoToEntity(response.data);
            setEntity(next);
            return { entity: next };
          }
          if (response.errors && response.errors.length > 0) {
            return { errors: response.errors };
          }
          if (response.error) return { errors: [response.error] };
          return null;
        } catch {
          return null;
        }
      },

      fetchOne: async (consultationId: string) => {
        try {
          const response = await repos.settlements.getOne(consultationId);
          if (response.success && response.data) {
            const next = mapSettlementDtoToEntity(response.data);
            setEntity(next);
            return next;
          }
          return null;
        } catch {
          return null;
        }
      },

      update: async (
        consultationId: string,
        patch: Partial<SettlementEntity>,
      ) => {
        try {
          const payload: SettlementUpdateInput =
            mapSettlementEntityToUpdateInput(patch);
          const response = await repos.settlements.update(
            consultationId,
            payload,
          );
          if (response.success && response.data) {
            const next = mapSettlementDtoToEntity(response.data);
            setEntity(next);
            return { entity: next };
          }
          if (response.errors && response.errors.length > 0) {
            return { errors: response.errors };
          }
          if (response.error) return { errors: [response.error] };
          return null;
        } catch {
          return null;
        }
      },

      markDocumentGenerated: async (consultationId: string) => {
        try {
          const response = await repos.settlements.markDocumentGenerated(
            consultationId,
          );
          if (response.success && response.data) {
            const next = mapSettlementDtoToEntity(response.data);
            setEntity(next);
            return { entity: next };
          }
          if (response.errors && response.errors.length > 0) {
            return {
              errors: response.errors,
              errorCode: response.errorCode,
              errorDetails: response.errorDetails ?? null,
            };
          }
          if (response.error) {
            return {
              errors: [response.error],
              errorCode: response.errorCode,
              errorDetails: response.errorDetails ?? null,
            };
          }
          return null;
        } catch {
          return null;
        }
      },

      remove: async (consultationId: string) => {
        try {
          const response = await repos.settlements.delete(consultationId);
          if (response.success) {
            set((s) => {
              const { [consultationId]: _removed, ...rest } = s.byConsultation;
              return { byConsultation: rest };
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    };
  });
}

export type SettlementStore = ReturnType<typeof createSettlementStore>;
