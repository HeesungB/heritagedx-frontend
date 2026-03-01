"use client";

import { useState, useEffect } from "react";
import { TaxRateSettings, TaxBracket } from "@/types/tax";
import { DEFAULT_TAX_SETTINGS } from "@/constants/taxDefaults";
import { Button } from "@heritage-dx/ui";

interface TaxSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TaxRateSettings;
  onSave: (settings: TaxRateSettings) => void;
}

type SettingsTab = "acquisitionTax" | "capitalGainsTax" | "corporateTax" | "stampDuty";

export default function TaxSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: TaxSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("capitalGainsTax");
  const [localSettings, setLocalSettings] = useState<TaxRateSettings>(settings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_TAX_SETTINGS);
  };

  const updateAcquisitionTax = (updates: Partial<TaxRateSettings["acquisitionTax"]>) => {
    setLocalSettings((prev) => ({
      ...prev,
      acquisitionTax: { ...prev.acquisitionTax, ...updates },
    }));
  };

  const updateCapitalGainsTax = (updates: Partial<TaxRateSettings["capitalGainsTax"]>) => {
    setLocalSettings((prev) => ({
      ...prev,
      capitalGainsTax: { ...prev.capitalGainsTax, ...updates },
    }));
  };

  const updateCorporateTax = (updates: Partial<TaxRateSettings["corporateTax"]>) => {
    setLocalSettings((prev) => ({
      ...prev,
      corporateTax: { ...prev.corporateTax, ...updates },
    }));
  };

  const updateLocalIncomeTax = (updates: Partial<TaxRateSettings["localIncomeTax"]>) => {
    setLocalSettings((prev) => ({
      ...prev,
      localIncomeTax: { ...prev.localIncomeTax, ...updates },
    }));
  };

  const updateBracket = (
    taxType: "capitalGainsTax" | "corporateTax",
    bracketId: string,
    field: keyof TaxBracket,
    value: number
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [taxType]: {
        ...prev[taxType],
        brackets: prev[taxType].brackets.map((b) =>
          b.id === bracketId ? { ...b, [field]: value } : b
        ),
      },
    }));
  };

  const addBracket = (taxType: "capitalGainsTax" | "corporateTax") => {
    const newBracket: TaxBracket = {
      id: `${taxType}_${Date.now()}`,
      max: 100000,
      rate: 0.2,
      deduction: 0,
    };
    setLocalSettings((prev) => ({
      ...prev,
      [taxType]: {
        ...prev[taxType],
        brackets: [...prev[taxType].brackets, newBracket],
      },
    }));
  };

  const removeBracket = (taxType: "capitalGainsTax" | "corporateTax", bracketId: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [taxType]: {
        ...prev[taxType],
        brackets: prev[taxType].brackets.filter((b) => b.id !== bracketId),
      },
    }));
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "capitalGainsTax", label: "양도소득세" },
    { id: "corporateTax", label: "법인세" },
    { id: "acquisitionTax", label: "취득세" },
    { id: "stampDuty", label: "기타" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">세율 설정</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 px-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 양도소득세 탭 */}
          {activeTab === "capitalGainsTax" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">양도소득세 적용</h3>
                  <p className="text-sm text-gray-500">개인 매도 시 적용됩니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.capitalGainsTax.enabled}
                    onChange={(e) => updateCapitalGainsTax({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>

              {localSettings.capitalGainsTax.enabled && (
                <>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!localSettings.capitalGainsTax.useBrackets}
                        onChange={() => updateCapitalGainsTax({ useBrackets: false })}
                        className="w-4 h-4 text-gray-900"
                      />
                      <span className="text-sm">단일 세율</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={localSettings.capitalGainsTax.useBrackets}
                        onChange={() => updateCapitalGainsTax({ useBrackets: true })}
                        className="w-4 h-4 text-gray-900"
                      />
                      <span className="text-sm">구간별 세율</span>
                    </label>
                  </div>

                  {!localSettings.capitalGainsTax.useBrackets ? (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">세율:</label>
                      <input
                        type="number"
                        value={(localSettings.capitalGainsTax.defaultRate * 100).toFixed(0)}
                        onChange={(e) =>
                          updateCapitalGainsTax({ defaultRate: parseFloat(e.target.value) / 100 })
                        }
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        step="1"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  ) : (
                    <BracketEditor
                      brackets={localSettings.capitalGainsTax.brackets}
                      onUpdateBracket={(id, field, value) => updateBracket("capitalGainsTax", id, field, value)}
                      onAddBracket={() => addBracket("capitalGainsTax")}
                      onRemoveBracket={(id) => removeBracket("capitalGainsTax", id)}
                    />
                  )}
                </>
              )}

              <hr />

              {/* 기본공제 */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">기본공제:</label>
                <input
                  type="number"
                  value={localSettings.basicDeduction}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      basicDeduction: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-sm text-gray-600">만원</span>
              </div>

              <hr />

              {/* 지방소득세 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">지방소득세 적용</h3>
                  <p className="text-sm text-gray-500">산출세액의 일정 비율로 부과됩니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.localIncomeTax.enabled}
                    onChange={(e) => updateLocalIncomeTax({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>

              {localSettings.localIncomeTax.enabled && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">세율:</label>
                  <input
                    type="number"
                    value={(localSettings.localIncomeTax.rate * 100).toFixed(0)}
                    onChange={(e) =>
                      updateLocalIncomeTax({ rate: parseFloat(e.target.value) / 100 })
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    step="1"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              )}
            </div>
          )}

          {/* 법인세 탭 */}
          {activeTab === "corporateTax" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">법인세 적용</h3>
                  <p className="text-sm text-gray-500">법인 매도 시 적용됩니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.corporateTax.enabled}
                    onChange={(e) => updateCorporateTax({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>

              {localSettings.corporateTax.enabled && (
                <>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!localSettings.corporateTax.useBrackets}
                        onChange={() => updateCorporateTax({ useBrackets: false })}
                        className="w-4 h-4 text-gray-900"
                      />
                      <span className="text-sm">단일 세율</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={localSettings.corporateTax.useBrackets}
                        onChange={() => updateCorporateTax({ useBrackets: true })}
                        className="w-4 h-4 text-gray-900"
                      />
                      <span className="text-sm">구간별 세율</span>
                    </label>
                  </div>

                  {!localSettings.corporateTax.useBrackets ? (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">세율:</label>
                      <input
                        type="number"
                        value={(localSettings.corporateTax.defaultRate * 100).toFixed(0)}
                        onChange={(e) =>
                          updateCorporateTax({ defaultRate: parseFloat(e.target.value) / 100 })
                        }
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        step="1"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  ) : (
                    <BracketEditor
                      brackets={localSettings.corporateTax.brackets}
                      onUpdateBracket={(id, field, value) => updateBracket("corporateTax", id, field, value)}
                      onAddBracket={() => addBracket("corporateTax")}
                      onRemoveBracket={(id) => removeBracket("corporateTax", id)}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* 취득세 탭 */}
          {activeTab === "acquisitionTax" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">취득세 적용</h3>
                  <p className="text-sm text-gray-500">매수 시 적용됩니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.acquisitionTax.enabled}
                    onChange={(e) => updateAcquisitionTax({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>

              {localSettings.acquisitionTax.enabled && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">세율:</label>
                  <input
                    type="number"
                    value={(localSettings.acquisitionTax.rate * 100).toFixed(1)}
                    onChange={(e) =>
                      updateAcquisitionTax({ rate: parseFloat(e.target.value) / 100 })
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              )}
            </div>
          )}

          {/* 기타 탭 (인지세) */}
          {activeTab === "stampDuty" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">인지세 적용</h3>
                  <p className="text-sm text-gray-500">매수 시 계약서 작성 기준으로 적용됩니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.stampDuty.enabled}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        stampDuty: { ...prev.stampDuty, enabled: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>

              {localSettings.stampDuty.enabled && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    현재 설정: 거래금액 1억원 이상 ~ 10억원 미만 구간에서 15만원 부과
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-between items-center p-5 border-t border-gray-200 bg-gray-50">
          <Button variant="ghost" onClick={handleReset}>
            기본값으로 초기화
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 구간 편집 컴포넌트
interface BracketEditorProps {
  brackets: TaxBracket[];
  onUpdateBracket: (id: string, field: keyof TaxBracket, value: number) => void;
  onAddBracket: () => void;
  onRemoveBracket: (id: string) => void;
}

function BracketEditor({
  brackets,
  onUpdateBracket,
  onAddBracket,
  onRemoveBracket,
}: BracketEditorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-2">
        <div className="col-span-4">상한 금액 (만원)</div>
        <div className="col-span-3">세율 (%)</div>
        <div className="col-span-4">누진공제 (만원)</div>
        <div className="col-span-1"></div>
      </div>
      {brackets.map((bracket, index) => (
        <div key={bracket.id} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-4">
            {bracket.max === Infinity ? (
              <span className="px-3 py-2 text-sm text-gray-500">초과분</span>
            ) : (
              <input
                type="number"
                value={bracket.max}
                onChange={(e) =>
                  onUpdateBracket(bracket.id, "max", parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            )}
          </div>
          <div className="col-span-3">
            <input
              type="number"
              value={(bracket.rate * 100).toFixed(0)}
              onChange={(e) =>
                onUpdateBracket(bracket.id, "rate", parseFloat(e.target.value) / 100)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              step="1"
            />
          </div>
          <div className="col-span-4">
            <input
              type="number"
              value={bracket.deduction}
              onChange={(e) =>
                onUpdateBracket(bracket.id, "deduction", parseInt(e.target.value) || 0)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-1">
            {index > 0 && bracket.max !== Infinity && (
              <button
                onClick={() => onRemoveBracket(bracket.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        onClick={onAddBracket}
        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        + 구간 추가
      </button>
    </div>
  );
}
