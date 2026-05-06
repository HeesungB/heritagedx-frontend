"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  appendCustomerMemoEntry,
  type CustomerEntity,
  type CustomerMemoEntry,
  type CustomerUpdateInput,
} from "@heritage-dx/store";
import { cd } from "./styles";

interface NotesCardProps {
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

// __MEMO_V1__ 마커 디코딩 결과를 시안의 (제목/타임스탬프/본문/tail) 항목으로 정규화.
// content 의 첫 줄을 제목으로 사용하되, entry.title 이 있으면 그대로 사용.
function normalizeEntries(entries: CustomerMemoEntry[] | null): ParsedEntry[] {
  if (!entries || entries.length === 0) return [];
  // 시간 내림차순 (최신 위)
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
    // 본문 상단의 빈 줄 제거
    while (bodyLines.length > 0 && bodyLines[0].trim() === "") bodyLines.shift();
    // 마지막 빈 줄 제거 후 tail (마지막 줄) 분리: 빈 줄을 사이에 두고 본문/tail 가 분리된 경우만
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

// memoEntries 가 없을 때 plain text customer.memo 를 1개 항목처럼 fallback 표시.
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

export function NotesCard({ customer, onPatch }: NotesCardProps) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = customer.memoEntries
    ? normalizeEntries(customer.memoEntries)
    : fallbackParsedFromPlainText(customer.memo);

  const handleAppend = async () => {
    const next = draft.trim();
    if (!next) return;
    setSaving(true);
    setError(null);
    // 입력의 첫 줄을 제목으로 자동 추출 — 한 줄만 있으면 제목 없이 본문만.
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
    // raw memo 를 알 수 없으므로 (mapper 가 평면화함) — `customer.memoEntries` 가 있으면
    // 그걸 그대로 재인코딩한 후 새 entry 를 append. 없으면 plain text 흡수.
    const rawForAppend = customer.memoEntries
      ? appendCustomerMemoEntry(
          // memoEntries 를 raw 마커 형태로 재구성
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

  return (
    <div style={cd.card}>
      <div style={cd.cardHead}>
        <div style={cd.cardTitle}>메모</div>
      </div>

      <div
        style={{
          border: "1px solid var(--line-soft)",
          borderRadius: 10,
          background: "#fafafa",
          padding: 14,
          marginBottom: 14,
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="일반 통화 내용을 기록하세요. 예: 가족 이벤트, 여행, 취미 등. 고정 필드(직장/연령대/회원권 등)는 상단에서 관리합니다."
          rows={4}
          disabled={saving}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12.5,
            color: "var(--text)",
            fontFamily: "inherit",
            resize: "vertical",
            minHeight: 80,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <span style={{ fontSize: 11, color: error ? "#dc2626" : "var(--text-3)" }}>
            {error ?? "첫 줄은 제목, 나머지는 본문으로 기록됩니다"}
          </span>
          <button
            type="button"
            onClick={() => void handleAppend()}
            disabled={saving || !draft.trim()}
            style={{
              ...cd.primaryBtn,
              padding: "6px 12px",
              fontSize: 11.5,
              opacity: saving || !draft.trim() ? 0.6 : 1,
              cursor: saving || !draft.trim() ? "not-allowed" : "pointer",
            }}
          >
            <Check size={12} strokeWidth={2} />
            기록 저장
          </button>
        </div>
      </div>

      {parsed.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {parsed.map((entry, i) => (
            <div
              key={entry.key}
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--line-soft)",
                paddingTop: i === 0 ? 0 : 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  {entry.title}
                </span>
                {entry.meta && (
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{entry.meta}</span>
                )}
              </div>
              {entry.body && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-2)",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {entry.body}
                </div>
              )}
              {entry.tail && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    marginTop: 6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {entry.tail}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={cd.emptyBox}>아직 기록된 메모가 없습니다.</div>
      )}
    </div>
  );
}
