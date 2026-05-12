"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  appendCustomerMemoEntry,
  type CustomerEntity,
  type CustomerMemoEntry,
  type CustomerUpdateInput,
} from "@heritage-dx/store";
import CustomerCardShell from "./CustomerCardShell";

interface CustomerNotesCardProps {
  customer: CustomerEntity;
  onPatch: (patch: CustomerUpdateInput) => Promise<boolean>;
}

interface ParsedEntry {
  key: string;
  title: string;
  meta: string;
  body: string;
  tail?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeEntries(entries: CustomerMemoEntry[] | null): ParsedEntry[] {
  if (!entries || entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  return sorted.map((e, i) => {
    const lines = (e.content ?? "").split(/\r?\n/);
    const explicitTitle = e.title?.trim();
    let title = explicitTitle ?? "";
    let bodyLines = lines.slice();
    if (!explicitTitle) {
      const first = lines[0]?.trim() ?? "";
      if (first && lines.length > 1) {
        title = first;
        bodyLines = lines.slice(1);
      }
    }
    while (bodyLines.length > 0 && bodyLines[0]?.trim() === "") bodyLines.shift();
    const blankIdx = bodyLines.lastIndexOf("");
    let body = bodyLines.join("\n").trim();
    let tail: string | undefined;
    if (blankIdx > 0 && blankIdx < bodyLines.length - 1) {
      body = bodyLines.slice(0, blankIdx).join("\n").trim();
      tail = bodyLines.slice(blankIdx + 1).join("\n").trim() || undefined;
    }
    if (!title) title = "메모";
    return {
      key: e.id ?? `${e.createdAt}-${i}`,
      title,
      meta: e.createdAt ? formatStamp(e.createdAt) : "",
      body,
      tail,
    };
  });
}

function fallbackParsedFromPlainText(memo: string | null): ParsedEntry[] {
  const trimmed = (memo ?? "").trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/);
  const first = lines[0]?.trim() ?? "메모";
  const rest = lines.slice(1).join("\n").trim();
  return [
    {
      key: "plain",
      title: first || "메모",
      meta: "",
      body: rest || (lines.length === 1 ? "" : trimmed),
    },
  ];
}

export default function CustomerNotesCard({
  customer,
  onPatch,
}: CustomerNotesCardProps) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = customer.memoEntries
    ? normalizeEntries(customer.memoEntries)
    : fallbackParsedFromPlainText(customer.memo);

  const handleAppend = async () => {
    const next = draft.trim();
    if (!next || saving) return;
    setSaving(true);
    setError(null);
    const lines = next.split(/\r?\n/);
    const firstLine = lines[0]?.trim() ?? "";
    const rest = lines.slice(1).join("\n").trim();
    const entry: CustomerMemoEntry = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`,
      title: rest ? firstLine : undefined,
      content: rest ? rest : firstLine,
      createdAt: new Date().toISOString(),
    };
    const rawForAppend = customer.memoEntries
      ? appendCustomerMemoEntry(
          `__MEMO_V1__${JSON.stringify({ entries: customer.memoEntries })}`,
          entry,
        )
      : appendCustomerMemoEntry(customer.memo, entry);
    const ok = await onPatch({ memo: rawForAppend });
    setSaving(false);
    if (ok) {
      setDraft("");
    } else {
      setError("저장에 실패했습니다");
    }
  };

  const canSave = !saving && draft.trim().length > 0;

  return (
    <CustomerCardShell title="메모">
      <div className="border border-neutral-200 rounded-[10px] bg-[#FAFAF9] p-3.5 mb-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="일반 통화 내용을 기록하세요. 예: 가족 이벤트, 여행, 취미 등. 고정 필드(직장/연령대/회원권 등)는 상단에서 관리합니다."
          rows={4}
          disabled={saving}
          className="w-full min-h-[80px] border-none outline-none bg-transparent resize-y text-[12.5px] text-neutral-900 leading-[1.55] tracking-[-0.005em] placeholder:text-neutral-400 font-sans"
        />
        <div className="flex items-center justify-between mt-2.5 gap-3">
          <span
            className={`text-[11px] ${
              error ? "text-[#DC2626]" : "text-neutral-400"
            }`}
          >
            {error ?? "첫 줄은 제목, 나머지는 본문으로 기록됩니다"}
          </span>
          <button
            type="button"
            onClick={() => void handleAppend()}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md bg-neutral-900 text-white border-none text-[11.5px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
            ) : (
              <Check className="w-3 h-3" strokeWidth={2.2} />
            )}
            기록 저장
          </button>
        </div>
      </div>

      {parsed.length > 0 ? (
        <div className="flex flex-col">
          {parsed.map((entry, i) => (
            <div
              key={entry.key}
              className={
                i === 0
                  ? "pt-0"
                  : "pt-3.5 mt-3.5 border-t border-dashed border-neutral-200"
              }
            >
              <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-neutral-900 tracking-[-0.01em]">
                  {entry.title}
                </span>
                {entry.meta && (
                  <span className="text-[11px] text-neutral-400 font-mono tracking-[0]">
                    {entry.meta}
                  </span>
                )}
              </div>
              {entry.body && (
                <div className="text-[12.5px] text-neutral-600 leading-[1.65] tracking-[-0.005em] whitespace-pre-wrap">
                  {entry.body}
                </div>
              )}
              {entry.tail && (
                <div className="text-[11px] text-neutral-400 mt-1.5 whitespace-pre-wrap">
                  {entry.tail}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[12.5px] text-neutral-400">
          아직 기록된 메모가 없습니다.
        </div>
      )}
    </CustomerCardShell>
  );
}
