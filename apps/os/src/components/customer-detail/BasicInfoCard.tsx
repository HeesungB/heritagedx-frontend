"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Check, Pencil, X } from "lucide-react";
import {
  type CustomerEntity,
  type CustomerUpdateInput,
} from "@heritage-dx/store";
import { cd, getCustomerGradeColor, tagStyle } from "./styles";

const AGE_BRACKET_OPTIONS = [
  "20대",
  "30대",
  "40대",
  "50대",
  "60대",
  "70대 이상",
] as const;

// 거래 의사 칩 — 백엔드 customerGrade enum 과 매핑 (강함 → 약함 순서).
const INTENT_CHIPS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "ACTIVE_DEAL", label: "거래 중인 고객" },
  { value: "HIGH_INTENT", label: "거래 의사가 높은 고객" },
  { value: "INTERESTED", label: "관심 고객" },
  { value: "PROSPECT", label: "잠재 고객" },
];

interface BasicInfoCardProps {
  customer: CustomerEntity;
  onPatch: (patch: CustomerUpdateInput) => Promise<boolean>;
}

interface DraftState {
  name: string;
  contact: string;
  email: string;
  occupation: string;
  ageBracket: string;
  residenceArea: string;
  customerGrade: string;
}

const inputStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--text)",
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid var(--line)",
  background: "#fff",
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
  height: 32,
  boxSizing: "border-box",
};

function buildDraftFromCustomer(customer: CustomerEntity): DraftState {
  return {
    name: customer.name ?? "",
    contact: customer.contact ?? "",
    email: customer.email ?? "",
    occupation: customer.occupation ?? "",
    ageBracket: customer.ageBracket ?? "",
    residenceArea: customer.residenceArea ?? customer.address ?? "",
    customerGrade: customer.customerGrade ?? "",
  };
}

export function BasicInfoCard({ customer, onPatch }: BasicInfoCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [drafts, setDrafts] = useState<DraftState>(() =>
    buildDraftFromCustomer(customer),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드가 아닐 때 외부에서 customer 가 갱신되면 draft 도 동기화.
  useEffect(() => {
    if (editMode) return;
    setDrafts(buildDraftFromCustomer(customer));
  }, [customer, editMode]);

  const startEdit = () => {
    setDrafts(buildDraftFromCustomer(customer));
    setError(null);
    setEditMode(true);
  };

  const cancel = () => {
    setError(null);
    setEditMode(false);
  };

  const save = async () => {
    const trimmedName = drafts.name.trim();
    const trimmedContact = drafts.contact.trim();
    const trimmedEmail = drafts.email.trim();
    const trimmedOccupation = drafts.occupation.trim();
    const trimmedResidence = drafts.residenceArea.trim();

    if (!trimmedName) {
      setError("고객명을 입력하세요");
      return;
    }
    if (!trimmedContact) {
      setError("연락처를 입력하세요");
      return;
    }

    const patch: CustomerUpdateInput = {};
    if (trimmedName !== (customer.name ?? "")) patch.name = trimmedName;
    if (trimmedContact !== (customer.contact ?? ""))
      patch.contact = trimmedContact;
    if (trimmedEmail !== (customer.email ?? ""))
      patch.email = trimmedEmail || null;
    if (trimmedOccupation !== (customer.occupation ?? ""))
      patch.occupation = trimmedOccupation || null;
    if (drafts.ageBracket !== (customer.ageBracket ?? ""))
      patch.ageBracket = drafts.ageBracket || null;
    if (
      trimmedResidence !==
      ((customer.residenceArea ?? customer.address ?? "") as string)
    )
      patch.residenceArea = trimmedResidence || null;
    if (drafts.customerGrade !== (customer.customerGrade ?? ""))
      patch.customerGrade = drafts.customerGrade || null;

    if (Object.keys(patch).length === 0) {
      setEditMode(false);
      return;
    }

    setSaving(true);
    setError(null);
    const ok = await onPatch(patch);
    setSaving(false);
    if (ok) {
      setEditMode(false);
    } else {
      setError("저장에 실패했습니다");
    }
  };

  const setDraftField = <K extends keyof DraftState>(
    key: K,
    value: DraftState[K],
  ) => {
    setDrafts((d) => ({ ...d, [key]: value }));
  };

  return (
    <div style={cd.card} data-edit-mode={editMode ? "on" : "off"}>
      <div style={cd.cardHead}>
        <div style={cd.cardTitle}>기본 정보</div>
        {editMode ? (
          <div style={{ display: "inline-flex", gap: 6 }}>
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              style={cd.smallBtn}
            >
              <X size={11} strokeWidth={1.5} />
              취소
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              style={{
                ...cd.smallBtn,
                color: "#fff",
                background: "#0a0a0a",
                borderColor: "#0a0a0a",
                opacity: saving ? 0.6 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              <Check size={11} strokeWidth={2} />
              저장
            </button>
          </div>
        ) : (
          <button type="button" onClick={startEdit} style={cd.smallBtn}>
            <Pencil size={11} strokeWidth={1.5} />
            편집
          </button>
        )}
      </div>
      {error && (
        <div
          style={{
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: 11.5,
            padding: "6px 10px",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}
      <div style={cd.infoTableWrap}>
        <table style={cd.infoTable}>
          <tbody>
            <Row
              label="고객명"
              value={
                editMode ? (
                  <input
                    type="text"
                    value={drafts.name}
                    onChange={(e) => setDraftField("name", e.target.value)}
                    disabled={saving}
                    style={inputStyle}
                  />
                ) : (
                  <DisplayText value={customer.name} />
                )
              }
            />
            <Row
              label="연락처"
              value={
                editMode ? (
                  <input
                    type="text"
                    value={drafts.contact}
                    onChange={(e) => setDraftField("contact", e.target.value)}
                    disabled={saving}
                    style={inputStyle}
                  />
                ) : (
                  <DisplayText value={customer.contact} />
                )
              }
            />
            <Row
              label="이메일"
              value={
                editMode ? (
                  <input
                    type="email"
                    value={drafts.email}
                    onChange={(e) => setDraftField("email", e.target.value)}
                    disabled={saving}
                    style={inputStyle}
                  />
                ) : (
                  <DisplayText value={customer.email} />
                )
              }
            />
            <Row
              label="직장 / 직업"
              value={
                editMode ? (
                  <input
                    type="text"
                    value={drafts.occupation}
                    onChange={(e) =>
                      setDraftField("occupation", e.target.value)
                    }
                    disabled={saving}
                    style={inputStyle}
                  />
                ) : (
                  <DisplayText value={customer.occupation} />
                )
              }
            />
            <Row
              label="연령대"
              value={
                editMode ? (
                  <select
                    value={drafts.ageBracket}
                    onChange={(e) =>
                      setDraftField("ageBracket", e.target.value)
                    }
                    disabled={saving}
                    style={inputStyle}
                  >
                    <option value="">선택 안 함</option>
                    {AGE_BRACKET_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <DisplayText value={customer.ageBracket} />
                )
              }
            />
            <Row
              label="거주지"
              value={
                editMode ? (
                  <input
                    type="text"
                    value={drafts.residenceArea}
                    onChange={(e) =>
                      setDraftField("residenceArea", e.target.value)
                    }
                    disabled={saving}
                    style={inputStyle}
                  />
                ) : (
                  <DisplayText
                    value={customer.residenceArea ?? customer.address}
                  />
                )
              }
            />
            <Row
              label="거래 의사"
              last
              value={
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {INTENT_CHIPS.map((chip) => {
                    const activeValue = editMode
                      ? drafts.customerGrade
                      : customer.customerGrade ?? "";
                    const isActive = activeValue === chip.value;
                    const palette = isActive
                      ? tagStyle(getCustomerGradeColor(chip.value))
                      : tagStyle("slate");
                    return (
                      <button
                        key={chip.value}
                        type="button"
                        disabled={!editMode || saving}
                        onClick={() =>
                          setDraftField(
                            "customerGrade",
                            isActive ? "" : chip.value,
                          )
                        }
                        style={{
                          ...palette.wrap,
                          border: "none",
                          cursor:
                            !editMode || saving ? "default" : "pointer",
                          opacity: !editMode && !isActive ? 0.55 : 1,
                        }}
                      >
                        {isActive && <span style={palette.dot} />}
                        {chip.label}
                      </button>
                    );
                  })}
                  {editMode && drafts.customerGrade && (
                    <button
                      type="button"
                      onClick={() => setDraftField("customerGrade", "")}
                      disabled={saving}
                      style={{
                        ...cd.smallBtn,
                        padding: "3px 8px",
                        fontSize: 11,
                      }}
                    >
                      선택 해제
                    </button>
                  )}
                </div>
              }
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <tr>
      <th
        style={{
          ...cd.thLabel,
          borderBottom: last ? "none" : "1px solid var(--line)",
        }}
      >
        {label}
      </th>
      <td
        style={{
          ...cd.td,
          borderBottom: last ? "none" : "1px solid var(--line)",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

function DisplayText({ value }: { value: string | null | undefined }) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return (
      <span style={{ color: "var(--text-3)", fontSize: 13 }}>—</span>
    );
  }
  return (
    <span style={{ color: "var(--text)", fontWeight: 500 }}>{trimmed}</span>
  );
}
