"use client";

import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import type { ConsultationAiResponse } from "@heritage-dx/store";
import { useConsultationRepository } from "@heritage-dx/api";
import { trackEvent } from "@/lib/gtag";

interface AiConsultationDraftPanelProps {
  onApplied: (result: ConsultationAiResponse) => void;
  contextClubName?: string;
}

const MAX_LENGTH = 2000;
const MAX_HEIGHT_PX = 288;

export default function AiConsultationDraftPanel({
  onApplied,
  contextClubName,
}: AiConsultationDraftPanelProps) {
  const repo = useConsultationRepository();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text]);

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const response = await repo.createDraftFromText({ text: trimmed });
      if (response.success && response.data) {
        trackEvent("trade_memo_ai_draft_submit", {
          length: trimmed.length,
          club: contextClubName ?? "",
        });
        onApplied(response.data);
        setText("");
      } else {
        setErrorMessage(response.error ?? "AI 추출에 실패했습니다.");
      }
    } catch (err) {
      console.error("AI draft 실패:", err);
      setErrorMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col gap-3 px-5 py-5"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 items-center gap-1 rounded-full bg-violet-50 px-2 text-[11px] font-bold uppercase tracking-wide text-violet-700">
          <Sparkles className="h-3 w-3" />
          beta
        </span>
        <h4 className="text-[14px] font-bold tracking-[-0.2px] text-gray-900">
          AI 자연어 입력
        </h4>
      </div>

      <p className="text-[12px] leading-relaxed text-gray-500">
        한 줄로 적어주세요. AI 가 골프장·회원권·거래유형·고객정보를 추출해 폼을
        채워줍니다.
      </p>

      <div className="rounded border border-gray-200 bg-gray-50 px-2.5 py-2 text-[11px] leading-relaxed text-gray-500">
        <p>· 개인/법인 미언급 시 <span className="font-medium text-gray-700">개인</span> 기본.</p>
        <p>· 매수/매도 미언급 시 <span className="font-medium text-gray-700">매수</span> 기본.</p>
        <p>· 최대 {MAX_LENGTH.toLocaleString()}자.</p>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder="예: 남서울 정회원 매수 홍길동 010-1234-5678 희망가 5억"
        maxLength={MAX_LENGTH}
        className="block min-h-[6rem] w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[13px] leading-[1.55] text-gray-800 outline-none focus:border-gray-900"
        style={{ maxHeight: `${MAX_HEIGHT_PX}px` }}
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] tabular-nums text-gray-500">
          {text.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
        </span>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gray-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              분석 중…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              AI 로 폼 채우기
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="rounded border border-red-200 bg-red-50 px-2.5 py-2 text-[12px] text-red-700">
          {errorMessage}
        </div>
      )}

      <p className="mt-auto text-[11px] leading-relaxed text-gray-400">
        Tip: <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-px text-[10px]">⌘/Ctrl</kbd> + <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-px text-[10px]">Enter</kbd> 로도 제출할 수 있습니다.
      </p>
    </form>
  );
}
