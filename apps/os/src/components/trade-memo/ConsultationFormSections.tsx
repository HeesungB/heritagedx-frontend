"use client";

import { useMemo, type ReactNode } from "react";
import type { ClubDetail, MembershipTradeForm } from "@/types";
import CustomerAutocomplete from "@/components/CustomerAutocomplete";

interface ConsultationFormSectionsProps {
  clubDetail: ClubDetail;
  form: MembershipTradeForm;
  setForm: (updater: (prev: MembershipTradeForm) => MembershipTradeForm) => void;
  manualMembershipInput: boolean;
  setManualMembershipInput: (v: boolean) => void;
  manualClubInput: boolean;
  setManualClubInput: (v: boolean) => void;
  editingTrade?: boolean;
  /** true 면 모든 Row 를 단일 컬럼으로 스택. 좁은 사이드바 패널용. */
  compact?: boolean;
}

const inputCls =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-[13px] text-gray-800 outline-none transition-colors focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500";

const numericInputCls = `${inputCls} text-right tabular-nums`;

export default function ConsultationFormSections({
  clubDetail,
  form,
  setForm,
  manualMembershipInput,
  setManualMembershipInput,
  manualClubInput,
  setManualClubInput,
  editingTrade,
  compact = false,
}: ConsultationFormSectionsProps) {
  // 동일 membershipName 이 여러 건 들어오는 경우(API 데이터 특성) key 충돌이 나지 않도록
  // name 기준 dedup 한 옵션 목록을 만든다. 첫 번째 매칭의 id 를 대표 id 로 사용.
  const membershipOptions = useMemo(() => {
    const seen = new Map<string, { id: string | null; name: string }>();
    for (const m of clubDetail.memberships ?? []) {
      const name = (m.membershipName || m.membershipType || "").trim();
      if (!name) continue;
      if (!seen.has(name)) seen.set(name, { id: m.id, name });
    }
    return Array.from(seen.values());
  }, [clubDetail.memberships]);
  const membershipTypes = membershipOptions.map((o) => o.name);

  return (
    <>
      {/* SECTION 1 — 거래 정보 */}
      <Section step="1" title="거래 정보">
        <Field>
          <Label required>거래유형</Label>
          <div className="flex h-9 gap-0 rounded-md border border-gray-300 bg-gray-50 p-[3px]">
            {(["매수", "매도"] as const).map((t) => {
              const active = form.tradeType === t;
              const activeStyle =
                t === "매수"
                  ? "bg-[#1E429F] text-white font-bold"
                  : "bg-[#B23232] text-white font-bold";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tradeType: t }))}
                  className={`flex-1 rounded text-[13px] transition-colors ${
                    active
                      ? activeStyle
                      : "bg-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>

        <Row cols={compact ? "1fr" : "1fr 200px"}>
          <Field>
            <Label required>골프장명</Label>
            <div className="flex gap-1.5">
              {!manualClubInput ? (
                <input
                  type="text"
                  value={form.clubName}
                  disabled
                  className={`${inputCls} flex-1`}
                />
              ) : (
                <input
                  type="text"
                  value={form.clubName}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      clubId: "",
                      clubName: e.target.value,
                    }))
                  }
                  placeholder="골프장명 직접 입력"
                  className={`${inputCls} flex-1`}
                  required
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (manualClubInput) {
                    setManualClubInput(false);
                    setForm((f) => ({
                      ...f,
                      clubId: clubDetail.id,
                      clubName: clubDetail.name,
                    }));
                  } else {
                    setManualClubInput(true);
                    setForm((f) => ({ ...f, clubId: "", clubName: "" }));
                  }
                }}
                className={`h-9 shrink-0 rounded-md border px-3 text-[12.5px] font-semibold transition-colors ${
                  manualClubInput
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                직접입력
              </button>
            </div>
          </Field>
          <Field>
            <Label required>회원권 종류</Label>
            {membershipTypes.length > 0 && !manualMembershipInput ? (
              <select
                value={form.membershipType}
                onChange={(e) => {
                  if (e.target.value === "__manual__") {
                    setManualMembershipInput(true);
                    setForm((f) => ({
                      ...f,
                      membershipId: null,
                      membershipType: "",
                    }));
                  } else {
                    const picked = clubDetail.memberships?.find(
                      (m) =>
                        (m.membershipName || m.membershipType) ===
                        e.target.value,
                    );
                    setForm((f) => ({
                      ...f,
                      membershipId: picked?.id ?? null,
                      membershipType: e.target.value,
                    }));
                  }
                }}
                className={inputCls}
                required
              >
                <option value="">선택</option>
                {membershipOptions.map((opt) => (
                  <option key={opt.id ?? opt.name} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
                <option value="__manual__">직접 입력</option>
              </select>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={form.membershipType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      membershipId: null,
                      membershipType: e.target.value,
                    }))
                  }
                  className={`${inputCls} flex-1`}
                  placeholder="예: 개인정회원"
                  required
                />
                {membershipTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualMembershipInput(false);
                      setForm((f) => ({
                        ...f,
                        membershipId: null,
                        membershipType: "",
                      }));
                    }}
                    className="h-9 shrink-0 rounded-md border border-gray-300 bg-white px-2 text-[11.5px] font-medium text-gray-600 hover:bg-gray-50"
                  >
                    목록선택
                  </button>
                )}
              </div>
            )}
          </Field>
        </Row>
      </Section>

      {/* SECTION 2 — 고객 정보 */}
      <Section step="2" title="고객 정보">
        <CustomerAutocomplete
          value={{
            customerId: form.customerId,
            name: form.customerName,
            contact: form.contact,
          }}
          onChange={(next) =>
            setForm((f) => ({
              ...f,
              customerId: next.customerId,
              customerName: next.name,
              contact: next.contact,
            }))
          }
        />
      </Section>

      {/* SECTION 3 — 금액 정보 */}
      <Section step="3" title="금액 정보">
        <Row cols={compact ? "1fr" : "1fr 1.4fr"}>
          <Field>
            <Label hint="만원">제시가</Label>
            <input
              type="text"
              inputMode="numeric"
              value={form.offerPrice ? form.offerPrice.toString() : ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  offerPrice: parseNumeric(e.target.value),
                }))
              }
              placeholder="0"
              className={numericInputCls}
            />
          </Field>
          <Field>
            <Label>제시가 비고</Label>
            <input
              type="text"
              value={form.offerPriceNote}
              onChange={(e) =>
                setForm((f) => ({ ...f, offerPriceNote: e.target.value }))
              }
              placeholder="비고 (예: 매도 의향가)"
              className={inputCls}
            />
          </Field>
        </Row>
        <Row cols={compact ? "1fr" : "1fr 1.4fr"}>
          <Field>
            <Label hint="만원">희망가</Label>
            <input
              type="text"
              inputMode="numeric"
              value={form.desiredPrice ? form.desiredPrice.toString() : ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  desiredPrice: parseNumeric(e.target.value),
                }))
              }
              placeholder="0"
              className={numericInputCls}
            />
          </Field>
          <Field>
            <Label>희망가 비고</Label>
            <input
              type="text"
              value={form.desiredPriceNote}
              onChange={(e) =>
                setForm((f) => ({ ...f, desiredPriceNote: e.target.value }))
              }
              placeholder="비고"
              className={inputCls}
            />
          </Field>
        </Row>
        <Row cols={compact ? "1fr" : "1fr 1.4fr"}>
          <Field>
            <Label hint="만원">계약금</Label>
            <input
              type="text"
              inputMode="numeric"
              value={form.depositAmount ? form.depositAmount.toString() : ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  depositAmount: parseNumeric(e.target.value),
                }))
              }
              placeholder="0"
              className={numericInputCls}
            />
          </Field>
          <Field>
            <Label>계좌번호</Label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountNumber: e.target.value }))
              }
              placeholder="110-123-456789"
              className={`${inputCls} font-mono`}
            />
          </Field>
        </Row>
      </Section>

      {/* SECTION 4 — 일정 */}
      <Section step="4" title="일정">
        <Row cols="1fr 1fr">
          <Field>
            <Label>등록일</Label>
            <input
              type="date"
              value={form.registrationDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, registrationDate: e.target.value }))
              }
              className={inputCls}
            />
          </Field>
          <Field>
            <Label>거래일</Label>
            <input
              type="date"
              value={form.tradeDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, tradeDate: e.target.value }))
              }
              className={inputCls}
            />
          </Field>
        </Row>
      </Section>

      {/* SECTION 5 — 메모 / 특이사항 */}
      <Section step="5" title="메모 / 특이사항" last>
        {!editingTrade && (
          <Field>
            <Label>메모</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="타회원권 교환 희망 / 매수 의향 등"
              className="block h-20 w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[13px] leading-[1.5] text-gray-800 outline-none focus:border-gray-900"
            />
          </Field>
        )}
        {editingTrade && (
          <p className="text-[11px] text-gray-400">
            메모는 상담일지 카드의 메모 히스토리에서 추가할 수 있습니다.
          </p>
        )}
        <Field>
          <Label>특이사항</Label>
          <textarea
            value={form.remarks}
            onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            placeholder="계약금 입금 완료 / 특별 요청사항 등"
            className="block h-20 w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[13px] leading-[1.5] text-gray-800 outline-none focus:border-gray-900"
          />
        </Field>
      </Section>
    </>
  );
}

// ─── helpers ────────────────────────────────────────────────────────

function parseNumeric(raw: string): number {
  const cleaned = raw.replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "-") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function Section({
  step,
  title,
  last,
  children,
}: {
  step: string;
  title: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={last ? "" : "mb-5 border-b border-gray-100 pb-5"}>
      <div className="mb-3.5 flex items-center gap-2">
        <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded bg-gray-900 font-mono text-[11px] font-bold text-white">
          {step}
        </span>
        <h4 className="text-[13px] font-bold tracking-[-0.2px] text-gray-900">
          {title}
        </h4>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

function Row({ cols, children }: { cols: string; children: ReactNode }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: cols }}>
      {children}
    </div>
  );
}

function Label({
  children,
  required,
  hint,
}: {
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-[11.5px] font-semibold text-gray-700">
      {children}
      {required && <span className="text-red-600">*</span>}
      {hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}
    </label>
  );
}
