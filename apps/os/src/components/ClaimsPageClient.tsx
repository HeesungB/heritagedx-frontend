"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useClaimRepository } from "@heritage-dx/api";
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

const FIELD_BASE =
  "w-full rounded-[12px] border-2 border-[#e5e7eb] bg-[#f9fafb] text-[14px] tracking-[-0.02em] text-[#101828] placeholder:text-[#101828]/50 focus:border-black focus:outline-none";

export default function ClaimsPageClient() {
  const claimRepo = useClaimRepository();
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [manualCategoryInput, setManualCategoryInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (manualCategoryInput) {
      manualInputRef.current?.focus();
    }
  }, [manualCategoryInput]);

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
    // 다음 paint 에서 select 펼치기 — chevron 한 번 클릭으로 리스트 노출
    requestAnimationFrame(() => {
      const select = selectRef.current;
      if (!select) return;
      select.focus();
      if (typeof select.showPicker === "function") {
        try {
          select.showPicker();
        } catch {
          // showPicker 미지원/거부 — 포커스만 유지
        }
      }
    });
  };

  const handleSubmit = async () => {
    if (!category.trim()) {
      setErrorMessage("건의 종류를 선택하거나 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("건의 내용을 입력해주세요.");
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
    <div className="mx-auto w-full max-w-[1500px] px-4 py-12 lg:px-8">
      {/* 타이틀 */}
      <div className="flex items-end justify-between border-b-2 border-black pb-4">
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#101828]">
          건의 사항
        </h1>
        <p className="text-[14px] font-bold tracking-[-0.016em] text-[#fb2c36]">
          * 필수입력 사항입니다.
        </p>
      </div>

      {/* 카드 */}
      <div className="mt-5 rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]">
        <div className="space-y-5">
          {/* 건의 종류 */}
          <div className="space-y-2">
            <label
              htmlFor="claim-category"
              className="block text-[14px] font-bold leading-5 tracking-[-0.018em] text-[#101828]"
            >
              건의 종류 <span className="text-[#fb2c36]">*</span>
            </label>

            {manualCategoryInput ? (
              <div className="relative">
                <input
                  id="claim-category"
                  ref={manualInputRef}
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="건의 종류를 직접 입력해주세요"
                  className={`${FIELD_BASE} h-11 px-3.5 pr-9`}
                />
                <button
                  type="button"
                  onClick={handleSwitchToList}
                  aria-label="목록에서 선택"
                  className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#101828]/50 hover:text-black"
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  id="claim-category"
                  ref={selectRef}
                  value={category}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className={`${FIELD_BASE} h-11 appearance-none px-3.5 pr-9 ${category ? "" : "text-[#101828]/50"}`}
                >
                  <option value="">건의 종류를 선택해 주세요</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="text-[#101828]">
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#101828]/50"
                  strokeWidth={2}
                />
              </div>
            )}
          </div>

          {/* 건의 내용 */}
          <div className="space-y-2">
            <label
              htmlFor="claim-content"
              className="block text-[14px] font-bold leading-5 tracking-[-0.018em] text-[#101828]"
            >
              건의 내용 <span className="text-[#fb2c36]">*</span>
            </label>
            <textarea
              id="claim-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="건의사항 내용을 상세히 입력해주세요."
              className={`${FIELD_BASE} h-[200px] resize-none px-3.5 py-2.5 leading-5`}
            />
          </div>

          {/* 메시지 */}
          {errorMessage && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-2 text-[13px] text-red-700">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[13px] text-emerald-700">
              {successMessage}
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="h-11 w-full rounded-[10px] border border-[#e5e7eb] bg-white text-[14px] font-bold tracking-[-0.018em] text-black shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "전송 중..." : "건의사항 전송하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
