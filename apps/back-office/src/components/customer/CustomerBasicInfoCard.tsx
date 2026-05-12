"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import type {
  CustomerEntity,
  CustomerUpdateInput,
} from "@heritage-dx/store";
import { getCustomerGradeLabel } from "@heritage-dx/store";
import CustomerCardShell from "./CustomerCardShell";

interface CustomerBasicInfoCardProps {
  customer: CustomerEntity;
  onPatch: (patch: CustomerUpdateInput) => Promise<boolean>;
}

const AGE_BRACKET_OPTIONS = [
  "20대",
  "30대",
  "40대",
  "50대",
  "60대",
  "70대 이상",
] as const;

// 거래 의사 칩 — 백엔드 customerGrade enum 매핑 (강함 → 약함).
const INTENT_CHIPS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "ACTIVE_DEAL", label: "거래 중인 고객" },
  { value: "HIGH_INTENT", label: "거래 의사가 높은 고객" },
  { value: "INTERESTED", label: "관심 고객" },
  { value: "PROSPECT", label: "잠재 고객" },
];

function activeChipClass(gradeKey: string): string {
  if (gradeKey === "ACTIVE_DEAL") return "bg-[#FEF3C7] text-[#92400E]";
  return "bg-[#DCFCE7] text-[#166534]";
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

const inputCls =
  "h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-900 outline-none transition-colors focus:border-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-500";

export default function CustomerBasicInfoCard({
  customer,
  onPatch,
}: CustomerBasicInfoCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [drafts, setDrafts] = useState<DraftState>(() =>
    buildDraftFromCustomer(customer),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드가 아닐 때 외부에서 customer 가 갱신되면 draft 동기화.
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
    <CustomerCardShell
      title="기본 정보"
      action={
        editMode ? (
          <div className="inline-flex gap-1.5">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-[26px] px-[9px] rounded-md bg-surface border border-neutral-200 text-neutral-600 text-[11.5px] font-medium cursor-pointer transition-colors hover:text-neutral-900 hover:border-[#D4D4D2] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-[11px] h-[11px]" strokeWidth={1.5} />
              취소
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-[26px] px-[9px] rounded-md bg-neutral-900 border border-neutral-900 text-white text-[11.5px] font-medium cursor-pointer transition-colors hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Check className="w-[11px] h-[11px]" strokeWidth={2} />
              저장
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 h-[26px] px-[9px] rounded-md bg-surface border border-neutral-200 text-neutral-600 text-[11.5px] font-medium cursor-pointer transition-colors hover:text-neutral-900 hover:border-[#D4D4D2]"
          >
            <Pencil className="w-[11px] h-[11px]" strokeWidth={1.7} />
            편집
          </button>
        )
      }
    >
      {error && (
        <div className="mb-2.5 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1.5 text-[11.5px] text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="border border-neutral-100 rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <Row label="고객명">
              {editMode ? (
                <input
                  type="text"
                  value={drafts.name}
                  onChange={(e) => setDraftField("name", e.target.value)}
                  disabled={saving}
                  className={inputCls}
                />
              ) : (
                <DisplayText value={customer.name} bold />
              )}
            </Row>
            <Row label="연락처">
              {editMode ? (
                <input
                  type="text"
                  value={drafts.contact}
                  onChange={(e) => setDraftField("contact", e.target.value)}
                  disabled={saving}
                  className={inputCls}
                />
              ) : (
                <span className="font-mono font-medium text-neutral-900">
                  {customer.contact || "—"}
                </span>
              )}
            </Row>
            <Row label="이메일">
              {editMode ? (
                <input
                  type="email"
                  value={drafts.email}
                  onChange={(e) => setDraftField("email", e.target.value)}
                  disabled={saving}
                  className={inputCls}
                />
              ) : (
                <span className="font-mono text-[12.5px] text-neutral-900">
                  {customer.email || "—"}
                </span>
              )}
            </Row>
            <Row label="직장 / 직업">
              {editMode ? (
                <input
                  type="text"
                  value={drafts.occupation}
                  onChange={(e) => setDraftField("occupation", e.target.value)}
                  disabled={saving}
                  className={inputCls}
                />
              ) : (
                <DisplayText value={customer.occupation} />
              )}
            </Row>
            <Row label="연령대">
              {editMode ? (
                <select
                  value={drafts.ageBracket}
                  onChange={(e) => setDraftField("ageBracket", e.target.value)}
                  disabled={saving}
                  className={inputCls}
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
              )}
            </Row>
            <Row label="거주지">
              {editMode ? (
                <input
                  type="text"
                  value={drafts.residenceArea}
                  onChange={(e) =>
                    setDraftField("residenceArea", e.target.value)
                  }
                  disabled={saving}
                  className={inputCls}
                />
              ) : (
                <DisplayText
                  value={customer.residenceArea ?? customer.address}
                />
              )}
            </Row>
            <Row label="거래 의사" last>
              <div className="inline-flex items-center gap-1.5 flex-wrap">
                {INTENT_CHIPS.map((chip) => {
                  const activeValue = editMode
                    ? drafts.customerGrade
                    : customer.customerGrade ?? "";
                  const isActive = activeValue === chip.value;
                  const cls = isActive
                    ? activeChipClass(chip.value)
                    : "bg-[#F1F3F5] text-[#475569]";
                  const clickable = editMode && !saving;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      disabled={!clickable}
                      onClick={() =>
                        setDraftField(
                          "customerGrade",
                          isActive ? "" : chip.value,
                        )
                      }
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-[9px] py-1 rounded-full leading-[1.4] whitespace-nowrap border-none ${cls} ${
                        clickable ? "cursor-pointer" : "cursor-default"
                      } ${!editMode && !isActive ? "opacity-55" : "opacity-100"}`}
                    >
                      {isActive && (
                        <span className="w-[5px] h-[5px] rounded-full bg-current inline-block" />
                      )}
                      {getCustomerGradeLabel(chip.value) ?? chip.label}
                    </button>
                  );
                })}
                {editMode && drafts.customerGrade && (
                  <button
                    type="button"
                    onClick={() => setDraftField("customerGrade", "")}
                    disabled={saving}
                    className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-surface border border-neutral-200 text-neutral-600 text-[11px] font-medium cursor-pointer transition-colors hover:text-neutral-900 hover:border-[#D4D4D2] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    선택 해제
                  </button>
                )}
              </div>
            </Row>
          </tbody>
        </table>
      </div>
    </CustomerCardShell>
  );
}

function Row({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const borderCls = last ? "" : "border-b border-neutral-100";
  return (
    <tr>
      <th
        className={`w-[140px] px-4 py-3 text-left text-[12px] font-medium text-neutral-500 bg-[#FAFAF9] border-r border-neutral-100 align-middle tracking-[-0.005em] ${borderCls}`}
      >
        {label}
      </th>
      <td
        className={`px-4 py-3 text-[13px] text-neutral-900 align-middle tracking-[-0.005em] ${borderCls}`}
      >
        {children}
      </td>
    </tr>
  );
}

function DisplayText({
  value,
  bold,
}: {
  value: string | null | undefined;
  bold?: boolean;
}) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return <span className="text-neutral-400 text-[13px]">—</span>;
  }
  return (
    <span className={`text-neutral-900 ${bold ? "font-bold" : "font-medium"}`}>
      {trimmed}
    </span>
  );
}
