"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { Check, Pencil, X } from "lucide-react";

type FieldType = "text" | "email" | "select" | "textarea";

export interface InlineFieldOption {
  value: string;
  label: string;
}

interface InlineFieldProps {
  value: string | null;
  placeholder?: string;
  type?: FieldType;
  options?: InlineFieldOption[];
  emptyText?: string;
  onSave: (next: string) => Promise<boolean>;
}

const baseInputStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--text)",
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid var(--line)",
  background: "#fff",
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
};

const iconBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  borderRadius: 6,
  border: "1px solid var(--line)",
  background: "#fff",
  color: "var(--text-2)",
  cursor: "pointer",
  flexShrink: 0,
};

export function InlineField({
  value,
  placeholder,
  type = "text",
  options,
  emptyText = "—",
  onSave,
}: InlineFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value ?? "");
      setError(null);
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if ("select" in inputRef.current && type !== "select") {
        try {
          (inputRef.current as HTMLInputElement | HTMLTextAreaElement).select();
        } catch {
          // ignore
        }
      }
    }
  }, [editing, type]);

  const startEdit = () => {
    setDraft(value ?? "");
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const commit = async () => {
    const next = draft.trim();
    const current = (value ?? "").trim();
    if (next === current) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onSave(next);
    setSaving(false);
    if (ok) {
      setEditing(false);
    } else {
      setError("저장에 실패했습니다");
    }
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    if (type === "textarea") {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void commit();
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    }
  };

  if (!editing) {
    const display = (value ?? "").trim();
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={startEdit}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          minHeight: 22,
          maxWidth: "100%",
        }}
      >
        <span
          style={{
            color: display ? "var(--text)" : "var(--text-3)",
            fontWeight: display ? 500 : 400,
            wordBreak: "break-word",
          }}
        >
          {display || placeholder || emptyText}
        </span>
        <span
          style={{
            opacity: hover ? 1 : 0,
            transition: "opacity 0.12s ease",
            color: "var(--text-3)",
            display: "inline-flex",
          }}
        >
          <Pencil size={12} strokeWidth={1.5} />
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        {type === "textarea" ? (
          <textarea
            ref={(el) => {
              inputRef.current = el;
            }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            disabled={saving}
            placeholder={placeholder}
            rows={3}
            style={{ ...baseInputStyle, resize: "vertical", minHeight: 60 }}
          />
        ) : type === "select" ? (
          <select
            ref={(el) => {
              inputRef.current = el;
            }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            disabled={saving}
            style={baseInputStyle}
          >
            <option value="">선택 안 함</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={(el) => {
              inputRef.current = el;
            }}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            disabled={saving}
            placeholder={placeholder}
            style={baseInputStyle}
          />
        )}
        <button
          type="button"
          onClick={() => void commit()}
          disabled={saving}
          aria-label="저장"
          style={{ ...iconBtn, color: "#166534", borderColor: "#bbf7d0", background: "#f0fdf4" }}
        >
          <Check size={13} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          aria-label="취소"
          style={iconBtn}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>
      {error && (
        <span style={{ fontSize: 11, color: "#dc2626" }}>{error}</span>
      )}
      {type === "textarea" && (
        <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>
          저장: ⌘/Ctrl + Enter · 취소: Esc
        </span>
      )}
    </div>
  );
}
