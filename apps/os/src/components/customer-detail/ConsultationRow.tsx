"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { ChevronDown, Edit3 } from "lucide-react";
import {
  APPROVAL_STATUS,
  type ApprovalStatus,
  type ConsultationEntity,
  type ConsultationNoteEntry,
} from "@heritage-dx/store";
import { StatusBadge } from "@/components/approval/StatusBadge";
import { tradeSideStyle } from "./styles";

const APPROVED_LOCK_STATUSES: ReadonlyArray<string> = [
  APPROVAL_STATUS.DEPOSIT_APPROVED,
  APPROVAL_STATUS.FIRST_APPROVED,
  "TAX_FILING",
  "COMPLETED",
];

function isMemoLocked(status: ApprovalStatus | string): boolean {
  return APPROVED_LOCK_STATUSES.includes(status);
}

interface Props {
  item: ConsultationEntity;
  isLast: boolean;
  defaultOpen: boolean;
  onAddNote: (content: string) => Promise<void>;
}

function truncate(text: string, n = 15): string {
  return text.length > n ? `${text.slice(0, n)}…` : text;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function dateLabel(item: ConsultationEntity): string {
  if (item.registrationDate) return item.registrationDate;
  return item.createdAt.slice(0, 10);
}

function planLabel(item: ConsultationEntity): string {
  return item.membershipType?.trim() || "-";
}

// 메모를 최신순(createdAt 내림차순)으로 정렬해 latest 가 [0] 에 오도록 한다.
function sortNotesDesc(notes: ConsultationNoteEntry[]): ConsultationNoteEntry[] {
  return [...notes].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function ConsultationRow({ item, isLast, defaultOpen, onAddNote }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const memos = sortNotesDesc(item.notes);
  const latest = memos[0];
  const memoLocked = isMemoLocked(item.approvalStatus);

  const submit = async () => {
    if (memoLocked) return;
    const content = draft.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      await onAddNote(content);
      setDraft("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "메모 추가에 실패했습니다.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  const rowStyle: CSSProperties = {
    borderBottom: isLast ? "none" : "1px solid var(--line-soft)",
    background: "#fff",
  };

  return (
    <div style={rowStyle}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "auto minmax(0,1fr) auto auto auto",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          fontSize: 12.5,
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-3)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.15s ease",
            flexShrink: 0,
          }}
        >
          <ChevronDown size={14} strokeWidth={1.7} />
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            color: "var(--text)",
          }}
        >
          <span style={{ fontWeight: 600, flexShrink: 0 }}>{item.clubName}</span>
          <span style={{ color: "var(--text-3)", flexShrink: 0 }}>·</span>
          <span style={{ color: "var(--text-2)", flexShrink: 0 }}>
            {planLabel(item)}
          </span>
          {latest && (
            <>
              <span style={{ color: "var(--text-3)", flexShrink: 0 }}>·</span>
              <span
                style={{
                  color: "var(--text-3)",
                  fontSize: 11.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {truncate(latest.content, 15)}
              </span>
            </>
          )}
        </span>
        <StatusBadge
          status={item.approvalStatus}
          className="text-[10.5px] py-px"
        />
        <span style={tradeSideStyle(item.tradeType)}>{item.tradeType}</span>
        <span
          style={{
            color: "var(--text-3)",
            fontVariantNumeric: "tabular-nums",
            fontSize: 11.5,
          }}
        >
          {dateLabel(item)}
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: "12px 14px 14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "#f8f9fa",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          {memoLocked ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px dashed var(--line)",
                background: "#fff",
                fontSize: 11.5,
                color: "var(--text-3)",
                textAlign: "center",
              }}
            >
              승인 완료된 상담에는 메모를 추가할 수 없습니다.
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  background: "#fff",
                  minWidth: 0,
                }}
              >
                <Edit3
                  size={13}
                  strokeWidth={1.5}
                  style={{ color: "var(--text-3)", flexShrink: 0 }}
                />
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={`${item.clubName} · ${planLabel(item)} 메모를 추가… (Enter)`}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 12,
                    color: "var(--text)",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !draft.trim()}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    submitting || !draft.trim() ? "#94a3b8" : "#10b981",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor:
                    submitting || !draft.trim() ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {submitting ? "추가 중…" : "추가"}
              </button>
            </div>
          )}

          {memos.length > 0 && (
            <div style={{ paddingLeft: 14 }}>
              <div style={{ position: "relative", paddingLeft: 18 }}>
                {memos.map((m, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div
                      key={m.id}
                      style={{
                        position: "relative",
                        paddingTop: idx === 0 ? 0 : 12,
                        paddingBottom: idx === memos.length - 1 ? 0 : 12,
                        borderTop:
                          idx === 0 ? "none" : "1px dashed #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: -18,
                          top: idx === 0 ? 4 : 16,
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: isLatest ? "#1a1a1a" : "#fff",
                          border: isLatest
                            ? "none"
                            : "1.5px solid #9ca3af",
                          boxSizing: "border-box",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11.5,
                            color: "var(--text-3)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatTime(m.createdAt)}
                        </span>
                        {isLatest && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: "0.02em",
                              color: "#fff",
                              background: "#1a1a1a",
                              padding: "1px 6px",
                              borderRadius: 4,
                            }}
                          >
                            최신
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "var(--text-2)",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
