"use client";

import { useState, useCallback, useEffect } from "react";
import { type TaxRateSettings, type TaxBracket, DEFAULT_TAX_SETTINGS } from "@heritage-dx/store";

const STORAGE_KEY = "membership-calculator-tax-settings";

// Infinity를 문자열로 변환하여 JSON 저장 가능하게
function serializeSettings(settings: TaxRateSettings): string {
  return JSON.stringify(settings, (key, value) => {
    if (value === Infinity) return "Infinity";
    return value;
  });
}

// 문자열 "Infinity"를 실제 Infinity로 복원
function deserializeSettings(json: string): TaxRateSettings {
  return JSON.parse(json, (key, value) => {
    if (value === "Infinity") return Infinity;
    return value;
  });
}

export function useTaxSettings() {
  const [settings, setSettings] = useState<TaxRateSettings>(DEFAULT_TAX_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 클라이언트에서만 localStorage 읽기
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = deserializeSettings(saved);
          setSettings(parsed);
        }
      } catch (error) {
        console.error("Failed to load tax settings:", error);
      }
      setIsLoaded(true);
    }
  }, []);

  // 설정 업데이트
  const updateSettings = useCallback((newSettings: TaxRateSettings) => {
    setSettings(newSettings);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, serializeSettings(newSettings));
      } catch (error) {
        console.error("Failed to save tax settings:", error);
      }
    }
  }, []);

  // 설정 초기화
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_TAX_SETTINGS);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // 특정 세금 활성화/비활성화
  const toggleTax = useCallback(
    (
      taxType: "acquisitionTax" | "stampDuty" | "capitalGainsTax" | "corporateTax" | "localIncomeTax",
      enabled: boolean
    ) => {
      setSettings((prev) => {
        const updated: TaxRateSettings = { ...prev };
        switch (taxType) {
          case "acquisitionTax":
            updated.acquisitionTax = { ...prev.acquisitionTax, enabled };
            break;
          case "stampDuty":
            updated.stampDuty = { ...prev.stampDuty, enabled };
            break;
          case "capitalGainsTax":
            updated.capitalGainsTax = { ...prev.capitalGainsTax, enabled };
            break;
          case "corporateTax":
            updated.corporateTax = { ...prev.corporateTax, enabled };
            break;
          case "localIncomeTax":
            updated.localIncomeTax = { ...prev.localIncomeTax, enabled };
            break;
        }
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, serializeSettings(updated));
        }
        return updated;
      });
    },
    []
  );

  // 세율 업데이트
  const updateRate = useCallback(
    (
      taxType: "acquisitionTax" | "localIncomeTax" | "capitalGainsTax" | "corporateTax",
      rate: number
    ) => {
      setSettings((prev) => {
        const updated: TaxRateSettings = { ...prev };
        switch (taxType) {
          case "capitalGainsTax":
            updated.capitalGainsTax = { ...prev.capitalGainsTax, defaultRate: rate };
            break;
          case "corporateTax":
            updated.corporateTax = { ...prev.corporateTax, defaultRate: rate };
            break;
          case "acquisitionTax":
            updated.acquisitionTax = { ...prev.acquisitionTax, rate };
            break;
          case "localIncomeTax":
            updated.localIncomeTax = { ...prev.localIncomeTax, rate };
            break;
        }
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, serializeSettings(updated));
        }
        return updated;
      });
    },
    []
  );

  // 구간별 세율 사용 여부 토글
  const toggleUseBrackets = useCallback(
    (taxType: "capitalGainsTax" | "corporateTax", useBrackets: boolean) => {
      setSettings((prev) => {
        const updated: TaxRateSettings = { ...prev };
        if (taxType === "capitalGainsTax") {
          updated.capitalGainsTax = { ...prev.capitalGainsTax, useBrackets };
        } else {
          updated.corporateTax = { ...prev.corporateTax, useBrackets };
        }
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, serializeSettings(updated));
        }
        return updated;
      });
    },
    []
  );

  // 세금 구간 업데이트
  const updateBrackets = useCallback(
    (taxType: "capitalGainsTax" | "corporateTax", brackets: TaxBracket[]) => {
      setSettings((prev) => {
        const updated: TaxRateSettings = { ...prev };
        if (taxType === "capitalGainsTax") {
          updated.capitalGainsTax = { ...prev.capitalGainsTax, brackets };
        } else {
          updated.corporateTax = { ...prev.corporateTax, brackets };
        }
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, serializeSettings(updated));
        }
        return updated;
      });
    },
    []
  );

  return {
    settings,
    isLoaded,
    updateSettings,
    resetSettings,
    toggleTax,
    updateRate,
    toggleUseBrackets,
    updateBrackets,
  };
}
