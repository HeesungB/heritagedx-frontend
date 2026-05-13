"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Check, Plus, Trash2 } from "lucide-react";
import type { MembershipEntity } from "@heritage-dx/store";
import {
  membershipSchema,
  type MembershipFormValues,
} from "@heritage-dx/store/schemas";

interface ClubMembershipFormV2Props {
  initialData?: MembershipEntity;
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const DEFAULT_FEE_TYPES = ["정회원", "준회원", "무기명회원", "비회원", "위임", "동반"];

interface GreenFeeRow {
  type: string;
  weekday: string;
  weekend: string;
}

function buildGreenFeeRows(initialData?: MembershipEntity): GreenFeeRow[] {
  const weekday = initialData?.weekdayGreenFee || {};
  const weekend = initialData?.weekendGreenFee || {};
  const allTypes = new Set([...Object.keys(weekday), ...Object.keys(weekend)]);

  if (allTypes.size === 0) {
    return ["정회원", "준회원", "비회원"].map((t) => ({
      type: t,
      weekday: "",
      weekend: "",
    }));
  }

  const order = DEFAULT_FEE_TYPES;
  const sorted = Array.from(allTypes).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return sorted.map((type) => ({
    type,
    weekday: weekday[type] !== undefined ? String(weekday[type]) : "",
    weekend: weekend[type] !== undefined ? String(weekend[type]) : "",
  }));
}

export default function ClubMembershipFormV2({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel,
}: ClubMembershipFormV2Props) {
  const [greenFeeRows, setGreenFeeRows] = useState<GreenFeeRow[]>(() =>
    buildGreenFeeRows(initialData),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipSchema),
    defaultValues: initialData
      ? {
          membershipType:
            initialData.membershipType === "개인" || initialData.membershipType === "법인"
              ? initialData.membershipType
              : (undefined as unknown as "개인" | "법인"),
          membershipName: initialData.membershipName || "",
          reservationNotes: initialData.reservationNotes || "",
          memberDaySchedule: initialData.memberDaySchedule || "",
          recentMarketPrice: initialData.recentMarketPrice || "",
          recentPriceUpdateDate: initialData.recentPriceUpdateDate || "",
          dealerPriceRange: initialData.dealerPriceRange || "",
          estimatedSalePrice: initialData.estimatedSalePrice || "",
          estimatedPriceDate: initialData.estimatedPriceDate || "",
          initialSalePrice: initialData.initialSalePrice || "",
          initialSaleYear: initialData.initialSaleYear || "",
          initialSaleMethod: initialData.initialSaleMethod || "",
          registeredPersonCount: initialData.registeredPersonCount ?? undefined,
          memberBenefits: initialData.memberBenefits || "",
          specialNotes: initialData.specialNotes || "",
          transferManagerName: initialData.transferManagerName || "",
          transferManagerPhone: initialData.transferManagerPhone || "",
          buyerDocuments: initialData.buyerDocuments || "",
          sellerDocuments: initialData.sellerDocuments || "",
          isActive: initialData.isActive ?? true,
          displayOrder: initialData.displayOrder ?? 0,
        }
      : {
          membershipType: undefined as unknown as "개인" | "법인",
          isActive: true,
          displayOrder: 0,
        },
  });

  const updateRow = (idx: number, field: keyof GreenFeeRow, value: string) => {
    setGreenFeeRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };
  const addRow = () =>
    setGreenFeeRows((prev) => [...prev, { type: "", weekday: "", weekend: "" }]);
  const removeRow = (idx: number) =>
    setGreenFeeRows((prev) => prev.filter((_, i) => i !== idx));

  // PUT 시 폼이 관리하는 필드 + 그린피 + 관계/메타. 나머지는 initialData 에서 보존.
  const EXCLUDE_FROM_PUT = new Set([
    ...Object.keys(membershipSchema.shape),
    "weekdayGreenFee",
    "weekendGreenFee",
    "id",
    "clubId",
    "createdAt",
    "updatedAt",
    "documents",
    "scenarios",
    "club",
  ]);

  const handleFormSubmit = (data: MembershipFormValues) => {
    const cleaned: Record<string, unknown> = {};

    if (initialData) {
      for (const [key, value] of Object.entries(initialData)) {
        if (EXCLUDE_FROM_PUT.has(key)) continue;
        if (value === null || value === undefined) continue;
        if (Array.isArray(value)) continue;
        cleaned[key] = value;
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (value === "" || value === null || value === undefined) continue;
      if (key === "registeredPersonCount" || key === "displayOrder") {
        const num = Number(value);
        if (!isNaN(num)) {
          cleaned[key] = num;
          continue;
        }
      }
      cleaned[key] = value;
    }

    const weekdayGreenFee: Record<string, number> = {};
    const weekendGreenFee: Record<string, number> = {};
    for (const row of greenFeeRows) {
      if (!row.type.trim()) continue;
      if (row.weekday && !isNaN(Number(row.weekday))) {
        weekdayGreenFee[row.type.trim()] = Number(row.weekday);
      }
      if (row.weekend && !isNaN(Number(row.weekend))) {
        weekendGreenFee[row.type.trim()] = Number(row.weekend);
      }
    }
    if (Object.keys(weekdayGreenFee).length > 0)
      cleaned.weekdayGreenFee = weekdayGreenFee;
    if (Object.keys(weekendGreenFee).length > 0)
      cleaned.weekendGreenFee = weekendGreenFee;

    return onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Section title="기본 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="회원권 종류" required wide error={errors.membershipType?.message}>
            <Select {...register("membershipType")}>
              <option value="">선택하세요</option>
              <option value="개인">개인</option>
              <option value="법인">법인</option>
            </Select>
          </Field>
          <Field label="회원권명" wide>
            <Input
              placeholder="예: VIP-무기명-분48000"
              {...register("membershipName")}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="그린피 정보"
        action={
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 h-[26px] px-2.5 text-[11.5px] font-semibold text-neutral-600 bg-surface border border-neutral-200 rounded-md cursor-pointer transition-colors hover:text-neutral-900 hover:border-neutral-900"
          >
            <Plus className="w-2.5 h-2.5" strokeWidth={2.2} />
            <span>유형 추가</span>
          </button>
        }
      >
        <div>
          <div className="grid grid-cols-[130px_1fr_1fr_36px] gap-2.5 pb-2 text-[11.5px] font-semibold text-[#888887]">
            <span>구분</span>
            <span>주중</span>
            <span>주말</span>
            <span />
          </div>
          <div className="flex flex-col gap-1">
            {greenFeeRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[130px_1fr_1fr_36px] gap-2.5 items-center py-1"
              >
                <input
                  type="text"
                  value={row.type}
                  onChange={(e) => updateRow(idx, "type", e.target.value)}
                  placeholder="구분 입력"
                  list="club-mem-fee-types"
                  className="w-full h-9 px-3 text-[12.5px] font-medium text-neutral-800 bg-[#FAFAF9] border border-neutral-200 rounded-[7px] outline-none transition-all placeholder:text-neutral-300 placeholder:font-normal hover:border-[#DCDCD8] hover:bg-surface focus:border-neutral-900 focus:bg-surface focus:ring-[3px] focus:ring-neutral-900/[0.06]"
                />
                <InputWithSuffix
                  suffix="원"
                  type="number"
                  value={row.weekday}
                  onChange={(e) => updateRow(idx, "weekday", e.target.value)}
                  placeholder="0"
                  height={36}
                />
                <InputWithSuffix
                  suffix="원"
                  type="number"
                  value={row.weekend}
                  onChange={(e) => updateRow(idx, "weekend", e.target.value)}
                  placeholder="0"
                  height={36}
                />
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  aria-label="삭제"
                  className="w-[30px] h-[30px] justify-self-center grid place-items-center rounded-md text-[#B6B6B4] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.7} />
                </button>
              </div>
            ))}
          </div>
          <datalist id="club-mem-fee-types">
            {DEFAULT_FEE_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </Section>

      <Section title="시세 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="최근 시세">
            <Input placeholder="1억 2천만원" {...register("recentMarketPrice")} />
          </Field>
          <Field label="시세 업데이트 일자">
            <div className="relative">
              <Input
                type="date"
                className="pr-10"
                {...register("recentPriceUpdateDate")}
              />
              <Calendar
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none"
                strokeWidth={1.7}
              />
            </div>
          </Field>
          <Field label="추정 시세">
            <Input placeholder="1억 5천만원" {...register("estimatedSalePrice")} />
          </Field>
          <Field label="추정 시세 기준일">
            <Input
              placeholder="예: 2025년 03월"
              {...register("estimatedPriceDate")}
            />
          </Field>
          <Field label="매도가 범위" wide>
            <Input placeholder="8,500~9,200" {...register("dealerPriceRange")} />
          </Field>
        </div>
      </Section>

      <Section title="분양/입회 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="분양가">
            <Input placeholder="1억원" {...register("initialSalePrice")} />
          </Field>
          <Field label="기명인 수">
            <InputWithSuffix
              suffix="명"
              type="number"
              placeholder="0"
              {...register("registeredPersonCount")}
            />
          </Field>
          <Field label="분양 연도">
            <Input placeholder="예: 2020" {...register("initialSaleYear")} />
          </Field>
          <Field label="분양 방식">
            <Input
              placeholder="공개분양, 회원모집"
              {...register("initialSaleMethod")}
            />
          </Field>
        </div>
      </Section>

      <Section title="예약 안내">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="예약 안내" wide>
            <Textarea
              rows={3}
              placeholder="예약 시 참고사항"
              {...register("reservationNotes")}
            />
          </Field>
          <Field label="회원의 날" wide>
            <Input
              placeholder="매월 2, 4주 일요일, 3대 국경일"
              {...register("memberDaySchedule")}
            />
          </Field>
        </div>
      </Section>

      <Section title="회원 혜택">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="회원 혜택" wide>
            <Textarea
              rows={3}
              placeholder="회원 혜택 내용을 입력하세요"
              {...register("memberBenefits")}
            />
          </Field>
          <Field label="특이사항" wide>
            <Textarea
              rows={3}
              placeholder="특이사항을 입력하세요"
              {...register("specialNotes")}
            />
          </Field>
        </div>
      </Section>

      <Section title="명의개서 담당자">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="담당자">
            <Input placeholder="홍길동" {...register("transferManagerName")} />
          </Field>
          <Field label="연락처">
            <Input
              placeholder="010-1234-5678"
              {...register("transferManagerPhone")}
            />
          </Field>
          <Field label="매수 서류" wide>
            <Textarea
              rows={2}
              placeholder="매수 시 필요한 서류"
              {...register("buyerDocuments")}
            />
          </Field>
          <Field label="매도 서류" wide>
            <Textarea
              rows={2}
              placeholder="매도 시 필요한 서류"
              {...register("sellerDocuments")}
            />
          </Field>
        </div>
      </Section>

      <Section title="표시 설정">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-[18px] items-start">
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-[18px] h-[18px] rounded-[5px] border-[1.5px] border-neutral-200 text-primary focus:ring-primary focus:ring-2"
                {...register("isActive")}
              />
              <span className="text-[13px] font-semibold text-neutral-900">활성화</span>
            </label>
            <span className="text-[11.5px] text-[#888887] pl-[26px]">
              비활성화하면 목록에서 숨김 처리됩니다
            </span>
          </div>
          <Field label="표시 순서">
            <Input
              type="number"
              placeholder="0"
              {...register("displayOrder")}
            />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end gap-2 mt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 h-[38px] px-[18px] text-[13px] font-semibold rounded-lg cursor-pointer transition-colors bg-surface text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 hover:border-[#C4C4C2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 h-[38px] px-[18px] text-[13px] font-semibold rounded-lg cursor-pointer transition-colors bg-primary text-white border border-primary hover:bg-[#1F1F1F] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2} />
          <span>
            {isLoading
              ? "저장 중..."
              : (submitLabel ?? (initialData ? "수정" : "등록"))}
          </span>
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-surface border border-neutral-200 rounded-[10px] px-5 pt-[18px] pb-5 mt-3.5 first:mt-0">
      <div className="flex items-center justify-between mb-3.5 gap-2.5">
        <h4 className="text-[13.5px] font-bold tracking-[-0.02em] text-neutral-900 m-0">
          {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}

function Field({ label, required, error, wide, children }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${wide ? "md:col-span-2" : ""}`}>
      <label className="text-[12px] font-semibold text-neutral-800 inline-flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-[#DC2626] font-bold">*</span>}
      </label>
      {children}
      {error && <span className="text-[11px] text-[#DC2626]">{error}</span>}
    </div>
  );
}

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full h-10 px-3 text-[13px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none transition-all placeholder:text-neutral-300 hover:border-[#C4C4C2] focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/[0.06] ${className}`}
      />
    );
  },
);

const Select = forwardRef<HTMLSelectElement, InputHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...props }, ref) {
    return (
      <select
        ref={ref}
        {...props}
        className={`appearance-none w-full h-10 pl-3 pr-10 text-[13px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none transition-all cursor-pointer bg-no-repeat bg-[right_14px_center] hover:border-[#C4C4C2] focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/[0.06] ${className}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>\")",
        }}
      >
        {children}
      </select>
    );
  },
);

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={`w-full px-3 py-2.5 text-[13px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none leading-[1.55] transition-all placeholder:text-neutral-300 hover:border-[#C4C4C2] focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/[0.06] resize-y font-[inherit] min-h-[96px] ${className}`}
    />
  );
});

interface InputWithSuffixProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "height"> {
  suffix: string;
  height?: number;
}

const InputWithSuffix = forwardRef<HTMLInputElement, InputWithSuffixProps>(
  function InputWithSuffix({ suffix, className = "", height, ...props }, ref) {
    const heightClass = height === 36 ? "h-9" : "h-10";
    return (
      <div className="relative">
        <input
          ref={ref}
          {...props}
          className={`w-full ${heightClass} pl-3 pr-11 text-[13px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none transition-all tabular-nums placeholder:text-neutral-300 hover:border-[#C4C4C2] focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/[0.06] ${className}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#888887] pointer-events-none">
          {suffix}
        </span>
      </div>
    );
  },
);
