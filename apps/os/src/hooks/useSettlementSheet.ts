"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useSettlements, type SettlementEntity } from "@heritage-dx/store";
import { useAppStores } from "@/stores";
import type { MembershipTrade } from "@/types";
import {
  ENTITY_FIELD_LABEL,
  ENTITY_TO_SHEET,
  SHEET_TO_ENTITY,
  entityToOverrides,
  parseValidationField,
  translateValidationMessage,
  type SheetOverrides,
} from "./settlement-sheet-adapter";
import type { SettlementEntity as Entity } from "@heritage-dx/store";

export interface UseSettlementSheetReturn {
  /** FormProvider 에 spread. ApprovalRequestSheet 의 모든 셀이 이 form 을 useFormContext 로 참조. */
  form: UseFormReturn<SheetOverrides>;
  /** 서버 측 입출금표 삭제(이미 commit 된 경우) 후 draft 재산출 + localStorage 클리어. */
  reset: () => Promise<void>;
  /**
   * 명시적 서버 commit. 한 번 호출 — isDraft=true 면 POST /settlements, 아니면 PUT.
   * 성공: `{ ok: true }`. 실패: `{ ok: false, unmappedErrors }` —
   *   필드별 검증 에러는 form.setError 로 셀에 주입되고, 매핑되지 않는 메시지만 unmappedErrors 로 반환.
   */
  commit: () => Promise<
    | { ok: true }
    | { ok: false; unmappedErrors: string[] }
  >;
  /**
   * PATCH /document-generated 발사 + 응답 처리.
   * SETTLEMENT_REQUIRED_FIELDS 응답의 `errorDetails.missingFields` 를 form.setError 로 셀에 주입,
   * 매핑되지 않는 필드는 한국어 라벨로 unmappedErrors 에 추가.
   */
  markGenerated: () => Promise<
    | { ok: true }
    | { ok: false; unmappedErrors: string[] }
  >;
  isReady: boolean;
  documentGeneratedAt: string | null;
  /** 첫 PUT 이전(아직 DB 에 persist 되지 않은) draft 상태인지. */
  isDraft: boolean;
  /** 백엔드가 자동 채우지 못한 entity 필드 키 목록. */
  missingFields: string[];
}

const STORAGE_KEY_PREFIX = "hdx:settlement:";
const STORAGE_DEBOUNCE_MS = 300;

/**
 * localStorage 직렬화 — **양식 셀 키(sheet key)** 단위.
 * entity 매핑이 없는 셀(taxIssue/route/transfer/acquire 등)도 모두 보존하기 위해
 * form 의 raw 값(string)을 그대로 저장한다. commit 시점에는 SHEET_TO_ENTITY 매핑된
 * 셀만 entity 변환되어 페이로드에 들어간다.
 */
type StoredOverrides = Record<string, string>;
interface StoredPayload {
  overrides: StoredOverrides;
  savedAt: string;
}

function readStored(consultationId: string): StoredOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + consultationId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPayload;
    return parsed.overrides ?? null;
  } catch {
    return null;
  }
}

function writeStored(consultationId: string, overrides: StoredOverrides) {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredPayload = {
      overrides,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      STORAGE_KEY_PREFIX + consultationId,
      JSON.stringify(payload),
    );
  } catch {
    /* quota / privacy mode 무시 */
  }
}

function clearStored(consultationId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + consultationId);
  } catch {
    /* ignore */
  }
}

export function useSettlementSheet(
  trade: MembershipTrade | null,
): UseSettlementSheetReturn {
  const { settlement: store } = useAppStores();
  const { fetchOne, createDraft, create, update, remove, markDocumentGenerated } =
    useSettlements(store);

  const form = useForm<SheetOverrides>({ defaultValues: {} });

  const [isReady, setIsReady] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [documentGeneratedAt, setDocumentGeneratedAt] = useState<string | null>(
    null,
  );

  const baselineRef = useRef<SettlementEntity | null>(null);
  const isDraftRef = useRef<boolean>(false);
  const consultationIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * 사용자 입력으로 변경된 **양식 셀 키(sheet key)** 추적.
   * SHEET_TO_ENTITY 매핑이 없는 셀도 모두 적립되어 localStorage 에 저장된다.
   * commit 시점에 매핑된 셀만 entity 변환되어 페이로드에 포함.
   */
  const dirtySheetRef = useRef<Set<string>>(new Set());
  /** 직전에 본 form 값 — useWatch 가 새 객체를 반환할 때 키별로 비교하여 dirty 추출. */
  const prevValuesRef = useRef<SheetOverrides>({});

  /** 진행 중 debounce 즉시 발사 — dirty sheet 키만 localStorage 에 머지 저장. */
  const flushStoredImmediate = useCallback(() => {
    const id = consultationIdRef.current;
    if (!id) return;
    const dirtyKeys = Array.from(dirtySheetRef.current);
    if (dirtyKeys.length === 0) return;
    const values = form.getValues();
    const overrides: StoredOverrides = {};
    for (const sheetKey of dirtyKeys) {
      const v = values[sheetKey];
      overrides[sheetKey] = typeof v === "string" ? v : "";
    }
    if (Object.keys(overrides).length === 0) return;
    const prev = readStored(id) ?? {};
    writeStored(id, { ...prev, ...overrides });
  }, [form]);

  // 마운트 / trade.id 변경: GET → 없으면 POST /draft → localStorage 머지 → form.reset
  useEffect(() => {
    let cancelled = false;
    if (!trade) {
      baselineRef.current = null;
      isDraftRef.current = false;
      consultationIdRef.current = null;
      dirtySheetRef.current.clear();
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      form.reset({});
      prevValuesRef.current = {};
      setIsReady(false);
      setIsDraft(false);
      setMissingFields([]);
      setDocumentGeneratedAt(null);
      return;
    }
    consultationIdRef.current = trade.id;
    dirtySheetRef.current.clear();
    setIsReady(false);

    void (async () => {
      const fetched = await fetchOne(trade.id);
      if (cancelled) return;

      let baseline: SettlementEntity | null = null;
      let draftMode = false;
      let mfields: string[] = [];

      if (fetched) {
        baseline = fetched;
        draftMode = false;
      } else {
        const draft = await createDraft(trade.id);
        if (cancelled) return;
        if (draft) {
          baseline = draft.entity;
          draftMode = true;
          mfields = draft.missingFields;
        }
      }

      if (!baseline) {
        setIsReady(true);
        return;
      }

      // baseline entity → 양식 셀 keyspace 의 defaults 로 변환
      const baselineDefaults = entityToOverrides(baseline);
      // localStorage 의 사용자 미commit 변경분(양식 셀 키 단위) 을 위에 머지
      const stored = readStored(trade.id) ?? {};
      const merged: SheetOverrides = { ...baselineDefaults, ...stored };

      baselineRef.current = baseline;
      isDraftRef.current = draftMode;
      form.reset(merged);
      prevValuesRef.current = merged;
      setIsDraft(draftMode);
      setMissingFields(mfields);
      setDocumentGeneratedAt(baseline.documentGeneratedAt ?? null);
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // trade.id 만 dep — trade 객체 identity 가 부모 리렌더마다 바뀌어도 effect 불필요 재실행 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade?.id]);

  // RHF v7 의 form.watch subscription 은 일부 변경(Controller field.onChange / setValue 등)
  // 에서 callback 이 호출되지 않거나 stale state 를 보는 케이스가 있어,
  // useWatch 로 reactive 값을 받고 useEffect 에서 직접 비교해 dirty 를 적립한다.
  const watchedValues = useWatch({ control: form.control }) as
    | SheetOverrides
    | undefined;

  useEffect(() => {
    if (!isReady) return;
    const id = consultationIdRef.current;
    if (!id) return;
    const current = (watchedValues ?? {}) as SheetOverrides;
    const prev = prevValuesRef.current;

    let anyChanged = false;
    const allKeys = new Set([
      ...Object.keys(current),
      ...Object.keys(prev),
    ]);
    for (const sheetKey of allKeys) {
      if (current[sheetKey] !== prev[sheetKey]) {
        // 매핑 여부와 무관하게 모든 셀을 추적 — localStorage 보존이 목적.
        dirtySheetRef.current.add(sheetKey);
        anyChanged = true;
      }
    }
    prevValuesRef.current = current;
    if (!anyChanged) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushStoredImmediate();
    }, STORAGE_DEBOUNCE_MS);
  }, [watchedValues, isReady, flushStoredImmediate]);

  const commit = useCallback(async (): Promise<
    | { ok: true }
    | { ok: false; unmappedErrors: string[] }
  > => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const id = consultationIdRef.current;
    const baseline = baselineRef.current;
    if (!id || !baseline) {
      return { ok: false, unmappedErrors: ["입출금표 baseline 이 준비되지 않았습니다."] };
    }

    const values = form.getValues();
    const dirtyKeys = Array.from(dirtySheetRef.current);

    let result: { entity: SettlementEntity } | { errors: string[] } | null = null;

    if (isDraftRef.current) {
      // 첫 persist — baseline 위에 form 변경분 모두 머지된 entire entity 를 POST.
      const fullEntity = { ...baseline } as Record<string, unknown>;
      for (const sheetKey of Object.keys(values)) {
        const mapping = SHEET_TO_ENTITY[sheetKey];
        if (!mapping) continue;
        const sheetValue = values[sheetKey];
        fullEntity[mapping.field as string] = mapping.fromCell(sheetValue ?? "");
      }
      result = await create(fullEntity as unknown as SettlementEntity);
    } else {
      // 기존 entity — dirty 셀 중 매핑된 것만 PUT.
      const patch: Record<string, unknown> = { consultationId: id };
      for (const sheetKey of dirtyKeys) {
        const mapping = SHEET_TO_ENTITY[sheetKey];
        if (!mapping) continue;
        const sheetValue = values[sheetKey];
        patch[mapping.field as string] = mapping.fromCell(sheetValue ?? "");
      }
      result = await update(id, patch as Partial<SettlementEntity>);
    }

    if (!result) {
      return { ok: false, unmappedErrors: ["저장에 실패했습니다."] };
    }
    if ("errors" in result) {
      const unmapped: string[] = [];
      form.clearErrors();
      for (const msg of result.errors) {
        const koreanMsg = translateValidationMessage(msg);
        const field = parseValidationField(msg);
        const sheetKey = field
          ? ENTITY_TO_SHEET[field as keyof Entity]
          : undefined;
        if (sheetKey) {
          form.setError(sheetKey, { type: "server", message: koreanMsg });
        } else {
          unmapped.push(koreanMsg);
        }
      }
      return { ok: false, unmappedErrors: unmapped };
    }

    // 성공
    const next = result.entity;
    baselineRef.current = next;
    isDraftRef.current = false;
    dirtySheetRef.current.clear();
    prevValuesRef.current = form.getValues();
    setIsDraft(false);
    setDocumentGeneratedAt(next.documentGeneratedAt ?? null);
    form.clearErrors();
    form.reset(form.getValues(), { keepValues: true, keepDirty: false });
    clearStored(id);
    return { ok: true };
  }, [create, update, form]);

  const markGenerated = useCallback(async (): Promise<
    | { ok: true }
    | { ok: false; unmappedErrors: string[] }
  > => {
    const id = consultationIdRef.current;
    if (!id) {
      return {
        ok: false,
        unmappedErrors: ["입출금표가 준비되지 않았습니다."],
      };
    }
    const result = await markDocumentGenerated(id);
    if (!result) {
      return {
        ok: false,
        unmappedErrors: ["문서 생성 완료 표시에 실패했습니다."],
      };
    }
    if ("entity" in result) {
      setDocumentGeneratedAt(result.entity.documentGeneratedAt ?? null);
      return { ok: true };
    }
    // 실패 — missingFields(우선) 또는 일반 검증 메시지
    form.clearErrors();
    const unmapped: string[] = [];
    const missingFromDetails = (
      result.errorDetails as { missingFields?: string[] } | null | undefined
    )?.missingFields;
    if (Array.isArray(missingFromDetails) && missingFromDetails.length > 0) {
      const headline =
        result.errors[0] ?? "입출금표 문서 생성에 필요한 값이 누락되었습니다.";
      unmapped.push(headline);
      for (const field of missingFromDetails) {
        const sheetKey = ENTITY_TO_SHEET[field as keyof Entity];
        if (sheetKey) {
          form.setError(sheetKey, {
            type: "server",
            message: "필수 입력입니다",
          });
        } else {
          const label = ENTITY_FIELD_LABEL[field] ?? field;
          unmapped.push(`${label}: 필수 입력입니다`);
        }
      }
    } else {
      for (const msg of result.errors) {
        const koreanMsg = translateValidationMessage(msg);
        const field = parseValidationField(msg);
        const sheetKey = field
          ? ENTITY_TO_SHEET[field as keyof Entity]
          : undefined;
        if (sheetKey) {
          form.setError(sheetKey, { type: "server", message: koreanMsg });
        } else {
          unmapped.push(koreanMsg);
        }
      }
    }
    return { ok: false, unmappedErrors: unmapped };
  }, [markDocumentGenerated, form]);

  const reset = useCallback(async () => {
    const id = consultationIdRef.current;
    if (!id) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    dirtySheetRef.current.clear();
    clearStored(id);
    setIsReady(false);
    if (!isDraftRef.current) {
      await remove(id);
    }
    const draft = await createDraft(id);
    if (draft) {
      const defaults = entityToOverrides(draft.entity);
      baselineRef.current = draft.entity;
      isDraftRef.current = true;
      form.reset(defaults);
      prevValuesRef.current = defaults;
      form.clearErrors();
      setIsDraft(true);
      setMissingFields(draft.missingFields);
      setDocumentGeneratedAt(null);
    }
    setIsReady(true);
  }, [remove, createDraft, form]);

  return {
    form,
    isReady,
    isDraft,
    documentGeneratedAt,
    missingFields,
    commit,
    markGenerated,
    reset,
  };
}
