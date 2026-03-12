"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SheetCustomItem {
  id: string;
  label: string;
  value: string;
}

export type SheetCustomItemsMap = {
  clubInfo: SheetCustomItem[];
  membershipInfo: SheetCustomItem[];
  costs: SheetCustomItem[];
  memo: SheetCustomItem[];
};

interface BenefitsData {
  overrides: Record<string, string>;
  hiddenItems: string[];
  customItems: SheetCustomItemsMap;
}

interface EstimateData {
  overrides: Record<string, string>;
}

const EMPTY_CUSTOM_ITEMS: SheetCustomItemsMap = {
  clubInfo: [],
  membershipInfo: [],
  costs: [],
  memo: [],
};

function getStorageKey(clubCode: string, sheetType: "benefits" | "estimate") {
  return `hdx:sheet:${clubCode}:${sheetType}`;
}

function loadBenefitsData(clubCode: string): BenefitsData {
  if (typeof window === "undefined") return { overrides: {}, hiddenItems: [], customItems: EMPTY_CUSTOM_ITEMS };
  try {
    const raw = localStorage.getItem(getStorageKey(clubCode, "benefits"));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        overrides: parsed.overrides || {},
        hiddenItems: parsed.hiddenItems || [],
        customItems: parsed.customItems || EMPTY_CUSTOM_ITEMS,
      };
    }
  } catch { /* ignore */ }
  return { overrides: {}, hiddenItems: [], customItems: EMPTY_CUSTOM_ITEMS };
}

function loadEstimateData(clubCode: string): EstimateData {
  if (typeof window === "undefined") return { overrides: {} };
  try {
    const raw = localStorage.getItem(getStorageKey(clubCode, "estimate"));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { overrides: parsed.overrides || {} };
    }
  } catch { /* ignore */ }
  return { overrides: {} };
}

interface UseSheetStorageReturn {
  overrides: Record<string, string>;
  setOverride: (key: string, value: string) => void;
  hiddenItems: Set<string>;
  setHiddenItems: (items: Set<string>) => void;
  customItems: SheetCustomItemsMap;
  setCustomItems: (items: SheetCustomItemsMap) => void;
}

export function useSheetStorage(
  clubCode: string | undefined,
  sheetType: "benefits" | "estimate",
): UseSheetStorageReturn {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [hiddenItems, setHiddenItemsRaw] = useState<Set<string>>(new Set());
  const [customItems, setCustomItemsRaw] = useState<SheetCustomItemsMap>(EMPTY_CUSTOM_ITEMS);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentClubCode = useRef<string | undefined>(undefined);

  // Refs to track current values for safe access inside setState updaters
  const overridesRef = useRef(overrides);
  const hiddenItemsRef = useRef(hiddenItems);
  const customItemsRef = useRef(customItems);

  useEffect(() => { overridesRef.current = overrides; }, [overrides]);
  useEffect(() => { hiddenItemsRef.current = hiddenItems; }, [hiddenItems]);
  useEffect(() => { customItemsRef.current = customItems; }, [customItems]);

  // Load data when clubCode changes
  useEffect(() => {
    if (!clubCode) {
      setOverrides({});
      setHiddenItemsRaw(new Set());
      setCustomItemsRaw(EMPTY_CUSTOM_ITEMS);
      currentClubCode.current = undefined;
      return;
    }

    currentClubCode.current = clubCode;

    if (sheetType === "benefits") {
      const data = loadBenefitsData(clubCode);
      setOverrides(data.overrides);
      setHiddenItemsRaw(new Set(data.hiddenItems));
      setCustomItemsRaw(data.customItems);
    } else {
      const data = loadEstimateData(clubCode);
      setOverrides(data.overrides);
    }
  }, [clubCode, sheetType]);

  // Debounced save
  const scheduleSave = useCallback(
    (newOverrides: Record<string, string>, newHidden?: Set<string>, newCustom?: SheetCustomItemsMap) => {
      if (!currentClubCode.current || typeof window === "undefined") return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      const code = currentClubCode.current;
      saveTimerRef.current = setTimeout(() => {
        const key = getStorageKey(code, sheetType);
        if (sheetType === "benefits") {
          const data: BenefitsData = {
            overrides: newOverrides,
            hiddenItems: [...(newHidden || new Set())],
            customItems: newCustom || EMPTY_CUSTOM_ITEMS,
          };
          localStorage.setItem(key, JSON.stringify(data));
        } else {
          const data: EstimateData = { overrides: newOverrides };
          localStorage.setItem(key, JSON.stringify(data));
        }
      }, 300);
    },
    [sheetType],
  );

  const setOverride = useCallback(
    (key: string, value: string) => {
      setOverrides((prev) => {
        const next = { ...prev, [key]: value };
        scheduleSave(next, hiddenItemsRef.current, customItemsRef.current);
        return next;
      });
    },
    [scheduleSave],
  );

  const setHiddenItems = useCallback(
    (items: Set<string>) => {
      setHiddenItemsRaw(items);
      scheduleSave(overridesRef.current, items, customItemsRef.current);
    },
    [scheduleSave],
  );

  const setCustomItems = useCallback(
    (items: SheetCustomItemsMap) => {
      setCustomItemsRaw(items);
      scheduleSave(overridesRef.current, hiddenItemsRef.current, items);
    },
    [scheduleSave],
  );

  return {
    overrides,
    setOverride,
    hiddenItems,
    setHiddenItems,
    customItems,
    setCustomItems,
  };
}

// --- Global templates (shared across all clubs) ---

const TEMPLATES_KEY = "hdx:sheet:templates";

export function loadCustomTemplates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) return JSON.parse(raw);
    // Migration from old key
    const old = localStorage.getItem("sheetCustomTemplates");
    if (old) {
      const parsed = JSON.parse(old);
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(parsed));
      localStorage.removeItem("sheetCustomTemplates");
      return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

export function saveCustomTemplates(templates: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// --- Migration: clean up old global keys ---

export function migrateOldStorageKeys() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("sheetHiddenItems");
    localStorage.removeItem("sheetCustomItems");
    // sheetCustomTemplates is migrated in loadCustomTemplates
  } catch { /* ignore */ }
}
