"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, AlertCircle, Check, Plus } from "lucide-react";
import {
  mapOwnedMembershipEntityToInput,
  useCustomers,
} from "@heritage-dx/store";
import {
  formatPhoneNumber,
  isValidKoreanMobile,
  isValidEmail,
} from "@heritage-dx/utils";
import { useAppStores } from "@/stores";
import {
  MembershipRow,
  emptyDraftMembership,
  type DraftMembership,
} from "./MembershipRow";

const AGE_BRACKETS = [
  "20대",
  "30대",
  "40대",
  "50대",
  "60대",
  "70대 이상",
] as const;

const MEMO_MAX = 500;

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function CustomerCreateModal({ onClose, onSuccess }: Props) {
  const { customer: customerStore } = useAppStores();
  const { create } = useCustomers(customerStore);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [addr, setAddr] = useState("");
  const [addrDetail, setAddrDetail] = useState("");
  const [ageBracket, setAgeBracket] = useState("");
  const [occupation, setOccupation] = useState("");
  const [residenceArea, setResidenceArea] = useState("");
  const [memberships, setMemberships] = useState<DraftMembership[]>([]);
  const [memo, setMemo] = useState("");

  const [submitTried, setSubmitTried] = useState(false);
  const [touched, setTouched] = useState({ name: false, contact: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);

  // ESC 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 검증 상태
  const phoneFormatOk = isValidKoreanMobile(contact);
  const phoneShow = (() => {
    if (!contact) return null;
    if (!phoneFormatOk)
      return {
        kind: "invalid" as const,
        msg: "올바른 형식이 아닙니다. 예) 010-0000-0000",
      };
    return { kind: "valid" as const, msg: "형식이 올바른 연락처입니다." };
  })();
  const emailShow = (() => {
    if (!email) return null;
    if (!isValidEmail(email))
      return {
        kind: "invalid" as const,
        msg: "올바른 이메일 형식이 아닙니다.",
      };
    return null;
  })();

  const showNameError = (submitTried || touched.name) && !name.trim();
  const showContactError =
    (submitTried || touched.contact) && (!contact || !phoneFormatOk);

  // 보유 회원권 행별 중복 검출 (앞쪽 행 우선)
  const duplicateRowIds = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const m of memberships) {
      if (!m.clubId || !m.membershipId) continue;
      const key = `${m.clubId}::${m.membershipId}`;
      if (seen.has(key)) dupes.add(m.rowId);
      else seen.add(key);
    }
    return dupes;
  }, [memberships]);

  const updateMembership = (rowId: string, patch: Partial<DraftMembership>) => {
    setMemberships((rows) =>
      rows.map((m) => (m.rowId === rowId ? { ...m, ...patch } : m)),
    );
  };
  const removeMembership = (rowId: string) => {
    setMemberships((rows) => rows.filter((m) => m.rowId !== rowId));
  };
  const addMembership = () => {
    setMemberships((rows) => [...rows, emptyDraftMembership(rows.length + 1)]);
  };

  const validate = () => {
    if (!name.trim()) return false;
    if (!contact || !phoneFormatOk) return false;
    if (email && !isValidEmail(email)) return false;
    for (const m of memberships) {
      if (!m.clubId || !m.membershipId) return false;
    }
    if (duplicateRowIds.size > 0) return false;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitTried(true);
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    const composedAddress = [addr.trim(), addrDetail.trim()]
      .filter(Boolean)
      .join(" ");

    const result = await create({
      name: name.trim(),
      contact: contact.trim(),
      email: email.trim() || null,
      address: composedAddress || null,
      memo: memo.trim() || undefined,
      ageBracket: ageBracket || null,
      occupation: occupation.trim() || null,
      residenceArea: residenceArea.trim() || null,
      // clubName / membershipName 은 응답 전용 join 필드 — mapOwnedMembershipEntityToInput 으로 제외
      ownedMemberships:
        memberships.length > 0
          ? memberships.map((m, i) =>
              mapOwnedMembershipEntityToInput({
                clubId: m.clubId,
                membershipId: m.membershipId,
                status: m.status,
                quantity: m.quantity,
                note: m.note.trim() ? m.note.trim() : null,
                displayOrder: m.displayOrder || i + 1,
                clubName: m.clubName,
                membershipName: m.membershipName,
              }),
            )
          : undefined,
    });
    setSubmitting(false);

    if (result.success) {
      onSuccess();
      return;
    }
    setServerError(
      result.conflict
        ? "이미 등록된 연락처입니다."
        : (result.errorMessage ?? "고객 등록에 실패했습니다."),
    );
  };

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const inputBase =
    "h-10 w-full rounded-md border bg-white px-3 text-[13.5px] text-[#101828] outline-none transition-colors placeholder:text-[#99a1af] focus:border-[#3f3f46] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]";
  const inputDefault = "border-[#e5e7eb]";
  const inputInvalid = "border-red-500 bg-red-50";
  const inputValid = "border-[#16a371] bg-[#e8f6ee]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[0.5px]"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        className="flex max-h-[calc(100vh-48px)] w-[760px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18),0_4px_14px_rgba(0,0,0,0.06)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-create-title"
      >
        {/* HEAD */}
        <div className="relative px-6 pt-5">
          <div
            id="customer-create-title"
            className="text-[18px] font-bold tracking-[-0.01em] text-[#101828]"
          >
            신규 고객 등록
          </div>
          <div className="mt-1 text-[13px] text-[#6a7282]">
            기본 정보 입력 후 등록하면 고객 목록에 추가됩니다.
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-[18px] top-[18px] flex h-[30px] w-[30px] items-center justify-center rounded-md text-[#6a7282] hover:bg-[#f1f1f2]"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* BODY */}
        <div
          ref={bodyRef}
          className="mt-4 flex-1 overflow-y-auto bg-[#f6f6f4] px-6 py-3.5"
        >
          {/* SECTION 1 */}
          <Section
            num={1}
            title="기본 정보"
            sub="· 고객 식별을 위한 필수 정보"
            meta={
              <>
                <span className="text-red-600">*</span> 필수
              </>
            }
          >
            <Field label="고객명" required>
              <div className="relative">
                <input
                  className={`${inputBase} ${showNameError ? inputInvalid : inputDefault}`}
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                />
                {showNameError && (
                  <Affix>
                    <AlertCircle className="h-4 w-4 text-red-500" strokeWidth={1.8} />
                  </Affix>
                )}
              </div>
              {showNameError && (
                <Helper kind="error">고객명을 입력해 주세요.</Helper>
              )}
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="연락처" required>
                <div className="relative">
                  <input
                    className={`${inputBase} ${
                      showContactError
                        ? inputInvalid
                        : phoneShow?.kind === "valid"
                          ? inputValid
                          : phoneShow?.kind === "invalid"
                            ? inputInvalid
                            : inputDefault
                    }`}
                    placeholder="010-1234-5678"
                    value={contact}
                    onChange={(e) => setContact(formatPhoneNumber(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, contact: true }))}
                    inputMode="tel"
                  />
                  {phoneShow?.kind === "valid" && (
                    <Affix>
                      <Check
                        className="h-4 w-4 text-[#16a371]"
                        strokeWidth={2.2}
                      />
                    </Affix>
                  )}
                  {(phoneShow?.kind === "invalid" || showContactError) && (
                    <Affix>
                      <AlertCircle
                        className="h-4 w-4 text-red-500"
                        strokeWidth={1.8}
                      />
                    </Affix>
                  )}
                </div>
                {phoneShow?.kind === "valid" && (
                  <Helper kind="ok">{phoneShow.msg}</Helper>
                )}
                {phoneShow?.kind === "invalid" && (
                  <Helper kind="error">{phoneShow.msg}</Helper>
                )}
                {!phoneShow && !showContactError && (
                  <Helper>형식 입력 시 자동으로 하이픈이 추가됩니다.</Helper>
                )}
                {showContactError && !phoneShow && (
                  <Helper kind="error">연락처를 입력해 주세요.</Helper>
                )}
              </Field>

              <Field label="이메일" optional>
                <div className="relative">
                  <input
                    className={`${inputBase} ${
                      emailShow?.kind === "invalid" ? inputInvalid : inputDefault
                    }`}
                    placeholder="hong@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {emailShow?.kind === "invalid" && (
                    <Affix>
                      <AlertCircle
                        className="h-4 w-4 text-red-500"
                        strokeWidth={1.8}
                      />
                    </Affix>
                  )}
                </div>
                {emailShow?.kind === "invalid" && (
                  <Helper kind="error">{emailShow.msg}</Helper>
                )}
              </Field>
            </div>
          </Section>

          {/* SECTION 2 */}
          <Section
            num={2}
            title="추가 정보"
            sub="· 응대 시 참고할 인적 정보"
          >
            <Field label="주소" optional>
              <input
                className={`${inputBase} ${inputDefault}`}
                placeholder="도로명·지번으로 검색 (예: 테헤란로)"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
              />
            </Field>
            {addr && (
              <Field>
                <input
                  className={`${inputBase} ${inputDefault}`}
                  placeholder="상세 주소 (동/호수 등)"
                  value={addrDetail}
                  onChange={(e) => setAddrDetail(e.target.value)}
                />
              </Field>
            )}

            <Field label="연령대" optional>
              <div className="flex flex-wrap gap-2">
                {AGE_BRACKETS.map((opt) => {
                  const active = ageBracket === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAgeBracket(active ? "" : opt)}
                      className={`h-[38px] rounded-full border px-[18px] text-[13px] transition-colors ${
                        active
                          ? "border-[#101828] bg-[#101828] text-white"
                          : "border-[#e5e7eb] bg-white text-[#3f3f46] hover:border-[#99a1af]"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="직업" optional>
                <input
                  className={`${inputBase} ${inputDefault}`}
                  placeholder="회사원, 자영업 등"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                />
              </Field>
              <Field label="거주 지역" optional>
                <input
                  className={`${inputBase} ${inputDefault}`}
                  placeholder="서울 강남구, 경기 성남 등"
                  value={residenceArea}
                  onChange={(e) => setResidenceArea(e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* SECTION 3 */}
          <Section
            num={3}
            title="보유 회원권"
            sub="· 골프장 + 회원권 종류 (여러 개 추가 가능)"
            meta={`${memberships.length}건`}
          >
            {memberships.map((m, i) => (
              <MembershipRow
                key={m.rowId}
                index={i}
                value={m}
                onChange={(patch) => updateMembership(m.rowId, patch)}
                onRemove={() => removeMembership(m.rowId)}
                canRemove={memberships.length > 0}
                showError={submitTried}
                duplicate={duplicateRowIds.has(m.rowId)}
              />
            ))}

            <button
              type="button"
              onClick={addMembership}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#d4d4d8] bg-white text-[13px] font-medium text-[#3f3f46] transition-colors hover:border-[#6a7282] hover:bg-[#f7f7f8]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              회원권 추가
            </button>
          </Section>

          {/* SECTION 4 */}
          <Section
            num={4}
            title="메모"
            sub="· 응대 시 참고할 자유 기록"
          >
            <div className="relative">
              <textarea
                className={`${inputBase} h-auto min-h-[120px] resize-y py-2.5 leading-[1.5] ${inputDefault}`}
                placeholder="선호 시간, 관심 회원권, 특이 사항 등을 자유롭게 작성하세요."
                value={memo}
                onChange={(e) => setMemo(e.target.value.slice(0, MEMO_MAX))}
              />
              <span className="absolute bottom-2.5 right-3 text-[12px] text-[#99a1af]">
                {memo.length} / {MEMO_MAX}
              </span>
            </div>
          </Section>

          {serverError && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
              {serverError}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 rounded-md px-4 text-[13.5px] font-medium text-[#3f3f46] hover:bg-[#f1f1f2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="h-9 rounded-md bg-[#101828] px-[18px] text-[13.5px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#99a1af]"
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  num,
  title,
  sub,
  meta,
  children,
}: {
  num: number;
  title: string;
  sub?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#fafaf7] px-[18px] py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#101828] text-[11.5px] font-semibold text-white">
            {num}
          </span>
          <span className="text-[14.5px] font-bold text-[#101828]">
            {title}
          </span>
          {sub && <span className="text-[12.5px] text-[#6a7282]">{sub}</span>}
        </div>
        {meta && (
          <div className="text-[12.5px] text-[#6a7282]">{meta}</div>
        )}
      </div>
      <div className="space-y-3 px-[18px] py-[18px]">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center gap-1 text-[12.5px] font-medium text-[#3f3f46]">
          {label}
          {required && <span className="text-red-600">*</span>}
          {optional && (
            <span className="text-[12px] font-normal text-[#99a1af]">선택</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function Affix({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
      {children}
    </span>
  );
}

function Helper({
  kind,
  children,
}: {
  kind?: "error" | "ok";
  children: React.ReactNode;
}) {
  const cls =
    kind === "error"
      ? "text-red-600"
      : kind === "ok"
        ? "text-[#16a371]"
        : "text-[#6a7282]";
  return <div className={`mt-1.5 text-[12px] ${cls}`}>{children}</div>;
}
