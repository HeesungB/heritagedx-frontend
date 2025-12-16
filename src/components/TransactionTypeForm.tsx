"use client";

import { useState, useEffect, useMemo } from "react";
import { AvailableFilters, Scenario, ScenarioOptionsResponse, TransactionFormData } from "@/types";
import { fetchWithCache } from "@/utils/apiCache";

interface TransactionTypeFormProps {
  clubCode: string;
  clubName: string;
  onConfirm: (formData: TransactionFormData, scenario: Scenario) => void;
  onSaveDraft: (formData: TransactionFormData) => void;
}

export default function TransactionTypeForm({
  clubCode,
  clubName,
  onConfirm,
  onSaveDraft,
}: TransactionTypeFormProps) {
  const [filters, setFilters] = useState<AvailableFilters | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<TransactionFormData>({
    side: "",
    ownerType: "",
    hasProxy: null,
    isCertificateLost: null,
    selectedScenarioId: null,
  });

  useEffect(() => {
    async function fetchScenarioOptions() {
      try {
        setLoading(true);
        const data = await fetchWithCache<ScenarioOptionsResponse>(
          `https://api.heritage-dx.com/api/clubs/${clubCode}/scenario-options`
        );
        setFilters(data.data.availableFilters);
        setScenarios(data.data.scenarios);
      } catch (err) {
        console.error("시나리오 옵션 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    }

    if (clubCode) {
      fetchScenarioOptions();
    }
  }, [clubCode]);

  // 선택된 조건에 맞는 시나리오 필터링
  const matchedScenario = useMemo(() => {
    if (!formData.side || !formData.ownerType || formData.hasProxy === null) {
      return null;
    }

    return scenarios.find((scenario) => {
      const sideMatch = scenario.side === formData.side;
      const ownerMatch = scenario.ownerType === formData.ownerType;
      const proxyMatch = scenario.hasProxy === formData.hasProxy;
      const certMatch =
        formData.isCertificateLost === null ||
        scenario.isCertificateLost === formData.isCertificateLost;

      return sideMatch && ownerMatch && proxyMatch && certMatch;
    });
  }, [formData, scenarios]);

  // 매칭된 시나리오가 변경되면 formData 업데이트
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      selectedScenarioId: matchedScenario?.id || null,
    }));
  }, [matchedScenario]);

  const handleSideChange = (value: string) => {
    setFormData((prev) => ({ ...prev, side: value }));
  };

  const handleOwnerTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, ownerType: value }));
  };

  const handleProxyChange = (value: boolean) => {
    setFormData((prev) => ({ ...prev, hasProxy: value }));
  };

  const handleCertificateLostChange = (value: boolean) => {
    setFormData((prev) => ({ ...prev, isCertificateLost: value }));
  };

  const isFormValid = () => {
    return matchedScenario !== null;
  };

  if (loading) {
    return (
      <div className="border border-gray-300 rounded p-6">
        <div className="text-center py-8 text-gray-500">거래 유형 옵션 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded p-6">
      <h2 className="text-xl font-semibold mb-4">거래 유형 입력 (L3)</h2>

      <div className="flex justify-between items-center mb-4">
        <div className="inline-block px-4 py-2 bg-gray-100 border border-gray-300">
          사용자 입력 대상
        </div>
        <span className="text-gray-500 text-sm">L3 거래 유형 엔진 — 기술 파라미터 입력</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
        <p>
          입력된 거래 유형이 실제 양도 조건과 일치하는지에 대한 확인은 운영자의 책임으로 함.
          본 시스템은 입력 정보에 대한 기술적 처리를 수행할 뿐, 해당 내용의 사실관계 또는 법적 적합성에 대한 판단은 포함하지 아니함.
        </p>
      </div>

      {/* 시나리오 코드 표시 */}
      <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">시스템 생성 코드 (비구속)</p>
            <p className="text-sm text-gray-500">거래 유형 코드</p>
            <p className="text-lg font-semibold">
              {matchedScenario ? matchedScenario.scenarioCode : "미생성"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">거래 조건 요약</p>
            <p>{matchedScenario ? matchedScenario.name : "입력 사항 없음"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* 거래 방향 (양도자/양수자) */}
        <div>
          <label className="block font-semibold mb-2">
            거래 방향 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.side}
            onChange={(e) => handleSideChange(e.target.value)}
            className="w-full border border-gray-300 p-3 bg-white"
          >
            <option value="">— 거래 방향 선택 —</option>
            {filters?.sides?.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label} ({option.count}건)
              </option>
            ))}
          </select>
        </div>

        {/* 명의자 유형 */}
        <div>
          <label className="block font-semibold mb-2">
            명의자 유형 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.ownerType}
            onChange={(e) => handleOwnerTypeChange(e.target.value)}
            className="w-full border border-gray-300 p-3 bg-white"
          >
            <option value="">— 명의자 유형 선택 —</option>
            {filters?.ownerTypes?.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label} ({option.count}건)
              </option>
            ))}
          </select>
        </div>

        {/* 대리인 여부 */}
        <div>
          <label className="block font-semibold mb-2">
            대리인 여부 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-6 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hasProxy"
                checked={formData.hasProxy === true}
                onChange={() => handleProxyChange(true)}
                className="w-5 h-5"
              />
              해당 (대리인)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hasProxy"
                checked={formData.hasProxy === false}
                onChange={() => handleProxyChange(false)}
                className="w-5 h-5"
              />
              비해당 (본인)
            </label>
          </div>
        </div>

        {/* 회원증 분실 여부 */}
        <div>
          <label className="block font-semibold mb-2">회원증 분실 여부</label>
          <div className="flex gap-6 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isCertificateLost"
                checked={formData.isCertificateLost === true}
                onChange={() => handleCertificateLostChange(true)}
                className="w-5 h-5"
              />
              분실
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isCertificateLost"
                checked={formData.isCertificateLost === false}
                onChange={() => handleCertificateLostChange(false)}
                className="w-5 h-5"
              />
              보유
            </label>
          </div>
        </div>
      </div>

      {/* 매칭된 시나리오 정보 */}
      {matchedScenario && (
        <div className="bg-green-50 border border-green-200 p-4 mb-6">
          <p className="font-semibold text-green-800 mb-2">매칭된 시나리오</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">코드: </span>
              <span className="font-medium">{matchedScenario.scenarioCode}</span>
            </div>
            <div>
              <span className="text-gray-500">이름: </span>
              <span className="font-medium">{matchedScenario.name}</span>
            </div>
            <div>
              <span className="text-gray-500">거래 방향: </span>
              <span className="font-medium">
                {matchedScenario.side === "Seller" ? "양도자" : "양수자"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">명의자 유형: </span>
              <span className="font-medium">
                {matchedScenario.ownerType === "Personal" ? "개인" : "법인"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 시나리오 매칭 실패 알림 */}
      {!matchedScenario &&
        formData.side &&
        formData.ownerType &&
        formData.hasProxy !== null && (
          <div className="bg-red-50 border border-red-200 p-4 mb-6">
            <p className="font-semibold text-red-800 mb-2">시나리오 매칭 실패</p>
            <p className="text-red-700 text-sm">
              선택하신 조건에 해당하는 시나리오를 찾을 수 없습니다.
              다른 조건을 선택해 주세요.
            </p>
            <p className="text-red-600 text-xs mt-2">
              선택된 조건: {formData.side === "Seller" ? "양도자" : "양수자"} /
              {formData.ownerType === "Personal" ? " 개인" : " 법인"} /
              {formData.hasProxy ? " 대리인" : " 본인"}
              {formData.isCertificateLost !== null &&
                (formData.isCertificateLost ? " / 회원증 분실" : " / 회원증 보유")}
            </p>
          </div>
        )}

      {/* 운영자 법적 책임 범위 */}
      <div className="bg-gray-100 border border-gray-200 p-4 mb-6">
        <p className="font-semibold mb-2">운영자 법적 책임 범위</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>입력 거래 유형과 실제 거래 조건 일치 여부</li>
          <li>모든 선택 사항의 법령 적합성 여부</li>
          <li>미공개 특수 조건 부존재 확인</li>
        </ul>
      </div>

      <hr className="my-6" />

      {/* 하단 액션 */}
      <div className="flex justify-between items-center">
        <span className="text-gray-500">운영자 입력 정확성 확인 후 거래 유형 확정 진행</span>
        <div className="flex gap-4">
          <button
            onClick={() => onSaveDraft(formData)}
            className="px-6 py-3 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            임시 저장
          </button>
          <button
            onClick={() => matchedScenario && onConfirm(formData, matchedScenario)}
            disabled={!isFormValid()}
            className={`px-6 py-3 transition-colors ${
              isFormValid()
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            유형 확정 및 단계 3 진행
          </button>
        </div>
      </div>
    </div>
  );
}
