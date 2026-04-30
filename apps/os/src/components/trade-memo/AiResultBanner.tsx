"use client";

import { X } from "lucide-react";
import type {
  ConsultationAiCandidate,
  ConsultationAiMatchInfo,
  ConsultationAiMissingField,
} from "@heritage-dx/store";

const FIELD_LABEL: Record<ConsultationAiMissingField, string> = {
  club: "골프장",
  membership: "회원권",
  customerName: "고객명",
  contact: "연락처",
  tradeType: "거래유형",
};

export interface AiDraftMeta {
  warnings: string[];
  missingRequiredFields: ConsultationAiMissingField[];
  clubMatch: ConsultationAiMatchInfo;
  membershipMatch: ConsultationAiMatchInfo;
}

interface AiResultBannerProps {
  meta: AiDraftMeta;
  currentClubId: string;
  currentClubName: string;
  onDismiss: () => void;
  onPickClub: (candidate: ConsultationAiCandidate) => void;
  onPickMembership: (candidate: ConsultationAiCandidate) => void;
}

export default function AiResultBanner({
  meta,
  currentClubId,
  currentClubName,
  onDismiss,
  onPickClub,
  onPickMembership,
}: AiResultBannerProps) {
  const showClubDiff =
    meta.clubMatch.id !== null && meta.clubMatch.id !== currentClubId;
  const showMissing = meta.missingRequiredFields.length > 0;
  const showWarnings = meta.warnings.length > 0;
  const showClubCandidates =
    meta.clubMatch.ambiguous && meta.clubMatch.candidates.length > 0;
  const showMembershipCandidates =
    meta.membershipMatch.ambiguous &&
    meta.membershipMatch.candidates.length > 0;

  if (
    !showClubDiff &&
    !showMissing &&
    !showWarnings &&
    !showClubCandidates &&
    !showMembershipCandidates
  ) {
    return null;
  }

  return (
    <div className="relative mb-3 space-y-2">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-1 top-1 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title="배너 닫기"
        aria-label="배너 닫기"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {showClubDiff && (
        <div className="rounded border border-blue-200 bg-blue-50 px-2.5 py-2 pr-7 text-[12px] text-blue-900">
          <span className="font-semibold">{meta.clubMatch.name}</span> 클럽으로
          등록됩니다. 현재 보고 있는{" "}
          <span className="font-semibold">{currentClubName}</span> 과 다릅니다.
        </div>
      )}

      {showMissing && (
        <div className="rounded border border-red-200 bg-red-50 px-2.5 py-2 pr-7 text-[12px] text-red-900">
          <p className="font-semibold">아래 항목을 직접 입력해주세요.</p>
          <ul className="mt-1 list-disc pl-4">
            {meta.missingRequiredFields.map((f) => (
              <li key={f}>{FIELD_LABEL[f]}</li>
            ))}
          </ul>
        </div>
      )}

      {showWarnings && (
        <div className="rounded border border-yellow-200 bg-yellow-50 px-2.5 py-2 pr-7 text-[12px] text-yellow-900">
          <ul className="list-disc pl-4">
            {meta.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {showClubCandidates && (
        <div className="rounded border border-amber-200 bg-amber-50 px-2.5 py-2 pr-7 text-[12px] text-amber-900">
          <p className="mb-1 font-semibold">골프장 후보 — 클릭해서 선택</p>
          <div className="flex flex-wrap gap-1">
            {meta.clubMatch.candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onPickClub(c)}
                className="rounded border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {showMembershipCandidates && (
        <div className="rounded border border-amber-200 bg-amber-50 px-2.5 py-2 pr-7 text-[12px] text-amber-900">
          <p className="mb-1 font-semibold">회원권 후보 — 클릭해서 선택</p>
          <div className="flex flex-wrap gap-1">
            {meta.membershipMatch.candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onPickMembership(c)}
                className="rounded border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
              >
                {c.name}
                {c.membershipType ? ` · ${c.membershipType}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
