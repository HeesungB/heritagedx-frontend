"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useClaimRepository } from "@heritage-dx/api";
import { Button } from "@heritage-dx/ui";
import { trackEvent } from "@/lib/gtag";

const CATEGORIES = [
  "골프장 정보 오류",
  "회원권 정보 오류",
  "시세 정보 문의",
  "서류 관련 문의",
  "거래 서비스 불만",
  "기능 개선 제안",
  "기타",
] as const;

export default function ClaimsPageClient() {
  const claimRepo = useClaimRepository();
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [manualCategoryInput, setManualCategoryInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCategorySelect = (value: string) => {
    if (value === "기타") {
      setManualCategoryInput(true);
      setCategory("");
    } else {
      setCategory(value);
    }
  };

  const handleSwitchToList = () => {
    setManualCategoryInput(false);
    setCategory("");
  };

  const handleSubmit = async () => {
    if (!category.trim()) {
      setErrorMessage("카테고리를 선택하거나 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await claimRepo.create({
        category: category.trim(),
        content: content.trim(),
      });
      if (response.success) {
        setSuccessMessage("건의사항이 성공적으로 접수되었습니다.");
        setCategory("");
        setContent("");
        setManualCategoryInput(false);
        trackEvent("claim_submit", { category: category.trim() });
      } else {
        setErrorMessage("건의사항 접수에 실패했습니다. 다시 시도해주세요.");
      }
    } catch {
      setErrorMessage("건의사항 접수 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header clubName={null} />
      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">건의사항</h2>
          <p className="text-sm text-gray-500 mt-1">
            서비스 이용 중 불편사항이나 개선 제안을 보내주세요.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
          {/* 카테고리 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              카테고리 <span className="text-red-500">*</span>
            </label>
            {manualCategoryInput ? (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="카테고리를 직접 입력해주세요"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSwitchToList}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                >
                  목록선택
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="">카테고리를 선택해주세요</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 내용 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="건의사항 내용을 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          {/* 에러/성공 메시지 */}
          {errorMessage && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {/* 제출 버튼 */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            isLoading={submitting}
            className="w-full"
          >
            {submitting ? "접수 중..." : "건의사항 접수"}
          </Button>
        </div>
      </main>
    </div>
  );
}
