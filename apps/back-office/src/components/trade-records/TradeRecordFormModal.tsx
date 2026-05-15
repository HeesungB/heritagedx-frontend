"use client";

import {
  useEffect,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Loader2, X } from "lucide-react";
import { Button, ClubSearchSelect, Input, Textarea } from "@heritage-dx/ui";
import type { TradeRecordClubOption } from "./types";

export interface TradeRecordFormState {
  tradeType: "매도" | "매수";
  membershipName: string;
  customerName: string;
  contact: string;
  tradingPartner: string;
  manager: string;
  amount: string;
  tradeAmount: string;
  commission: string;
  marketProfit: string;
  expense: string;
  depositAmount: string;
  contractDate: string;
  balanceDate: string;
  actualTransactionDate: string;
  balanceCompleted: boolean;
  taxTransfer: boolean;
  taxAcquisition: boolean;
  invoiceSales: string;
  invoicePurchase: string;
  description: string;
  remarks: string;
}

export interface TradeRecordFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  form: TradeRecordFormState;
  setForm: Dispatch<SetStateAction<TradeRecordFormState>>;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
  isSaving: boolean;
  clubs: TradeRecordClubOption[];
  formClubCode: string;
  setFormClubCode: (code: string) => void;
  formMemberships: { id: string; name: string }[];
  topClubCodesForm: string[];
  isClubFavorite: (code: string) => boolean;
  toggleClubFavorite: (
    code: string,
    item: { name: string; region?: string; holes?: string },
  ) => void;
  trackClubSelection: (item: { code: string; name: string }) => void;
}

const inputClassName =
  "h-10 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary";

const numberFields: Array<{
  key: keyof Pick<
    TradeRecordFormState,
    | "amount"
    | "tradeAmount"
    | "commission"
    | "marketProfit"
    | "expense"
    | "depositAmount"
  >;
  label: string;
}> = [
  { key: "amount", label: "매매가 (원)" },
  { key: "tradeAmount", label: "거래금 (원)" },
  { key: "commission", label: "수수료 (원)" },
  { key: "marketProfit", label: "시세차익 (원)" },
  { key: "expense", label: "비용 (원)" },
  { key: "depositAmount", label: "계약금 (원)" },
];

const scheduleFields: Array<{
  key: keyof Pick<
    TradeRecordFormState,
    "contractDate" | "balanceDate" | "actualTransactionDate"
  >;
  label: string;
}> = [
  { key: "contractDate", label: "계약일" },
  { key: "balanceDate", label: "잔금일" },
  { key: "actualTransactionDate", label: "실거래일" },
];

const checkFields: Array<{
  key: keyof Pick<
    TradeRecordFormState,
    "balanceCompleted" | "taxTransfer" | "taxAcquisition"
  >;
  label: string;
}> = [
  { key: "balanceCompleted", label: "잔금 완료" },
  { key: "taxTransfer", label: "양도세" },
  { key: "taxAcquisition", label: "취득세" },
];

const formatPrice = (value: string) => {
  if (!value) return "";
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return "";
  if (num >= 100000000) {
    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  }
  if (num >= 10000) return `${(num / 10000).toLocaleString()}만원`;
  return `${num.toLocaleString()}원`;
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

export function TradeRecordFormModal({
  open,
  mode,
  form,
  setForm,
  onClose,
  onSubmit,
  isSaving,
  clubs,
  formClubCode,
  setFormClubCode,
  formMemberships,
  topClubCodesForm,
  isClubFavorite,
  toggleClubFavorite,
  trackClubSelection,
}: TradeRecordFormModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const title = mode === "edit" ? "거래 내역 수정" : "거래 내역 등록";
  const submitText = mode === "edit" ? "수정" : "등록";

  const updateForm = <K extends keyof TradeRecordFormState>(
    key: K,
    value: TradeRecordFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-record-form-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[calc(100vh-48px)] w-full max-w-[760px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2
              id="trade-record-form-title"
              className="text-base font-semibold text-gray-950"
            >
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              거래 정보와 세금 처리 상태를 입력합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <Section title="기본 정보">
            <Field label="거래유형" required>
              <div className="grid grid-cols-2 gap-2">
                {(["매수", "매도"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateForm("tradeType", type)}
                    className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                      form.tradeType === type
                        ? type === "매수"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-red-600 bg-red-600 text-white"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="골프장" required>
                <ClubSearchSelect
                  clubs={clubs}
                  selectedClubCode={formClubCode}
                  onChange={(code) => {
                    setFormClubCode(code);
                    setForm((prev) => ({ ...prev, membershipName: "" }));
                  }}
                  topClubCodes={topClubCodesForm}
                  isFavorite={isClubFavorite}
                  onToggleFavorite={(code, item) =>
                    toggleClubFavorite(code, {
                      name: item.name,
                      region: item.region,
                      holes: item.holes,
                    })
                  }
                  onClubSelect={(item) =>
                    trackClubSelection({ code: item.code, name: item.name })
                  }
                  placeholder="골프장 선택"
                  usePortal
                />
              </Field>

              <Field label="회원권명" required>
                {formMemberships.length > 0 ? (
                  <select
                    value={form.membershipName}
                    onChange={(event) =>
                      updateForm("membershipName", event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">회원권 선택</option>
                    {formMemberships.map((membership) => (
                      <option key={membership.id} value={membership.name}>
                        {membership.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={form.membershipName}
                    onChange={(event) =>
                      updateForm("membershipName", event.target.value)
                    }
                    placeholder={
                      formClubCode
                        ? "회원권 로딩 중..."
                        : "골프장을 먼저 선택해주세요"
                    }
                    disabled={!formClubCode}
                    className={inputClassName}
                  />
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="고객명" required>
                <Input
                  value={form.customerName}
                  onChange={(event) =>
                    updateForm("customerName", event.target.value)
                  }
                  placeholder="홍길동"
                  className={inputClassName}
                />
              </Field>
              <Field label="연락처">
                <Input
                  value={form.contact}
                  onChange={(event) => updateForm("contact", event.target.value)}
                  placeholder="010-1234-5678"
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="거래상대">
                <Input
                  value={form.tradingPartner}
                  onChange={(event) =>
                    updateForm("tradingPartner", event.target.value)
                  }
                  placeholder="거래상대 이름"
                  className={inputClassName}
                />
              </Field>
              <Field label="담당자">
                <Input
                  value={form.manager}
                  onChange={(event) => updateForm("manager", event.target.value)}
                  placeholder="담당자 이름"
                  className={inputClassName}
                />
              </Field>
            </div>
          </Section>

          <Section title="금액 정보">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {numberFields.map((field) => (
                <MoneyField
                  key={field.key}
                  label={field.label}
                  value={form[field.key]}
                  onChange={(value) => updateForm(field.key, onlyDigits(value))}
                />
              ))}
            </div>
          </Section>

          <Section title="일정">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {scheduleFields.map((field) => (
                <Field key={field.key} label={field.label}>
                  <Input
                    type="date"
                    value={form[field.key]}
                    onChange={(event) => updateForm(field.key, event.target.value)}
                    className={inputClassName}
                  />
                </Field>
              ))}
            </div>
          </Section>

          <Section title="세금 / 상태">
            <div className="flex flex-wrap gap-4">
              {checkFields.map((field) => (
                <label
                  key={field.key}
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={form[field.key]}
                    onChange={(event) =>
                      updateForm(field.key, event.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {field.label}
                </label>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MoneyField
                label="세금계산서 매출"
                value={form.invoiceSales}
                onChange={(value) => updateForm("invoiceSales", onlyDigits(value))}
              />
              <MoneyField
                label="세금계산서 매입"
                value={form.invoicePurchase}
                onChange={(value) =>
                  updateForm("invoicePurchase", onlyDigits(value))
                }
              />
            </div>
          </Section>

          <Section title="메모">
            <Textarea
              label="설명"
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              minRows={2}
              placeholder="거래 설명"
            />
            <Field label="특이사항">
              <Input
                value={form.remarks}
                onChange={(event) => updateForm("remarks", event.target.value)}
                placeholder="특이사항"
                className={inputClassName}
              />
            </Field>
          </Section>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const formatted = formatPrice(value);

  return (
    <Field label={label}>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className={`${inputClassName} tabular-nums`}
      />
      {formatted && <p className="mt-1 text-xs text-gray-500">{formatted}</p>}
    </Field>
  );
}

export default TradeRecordFormModal;
