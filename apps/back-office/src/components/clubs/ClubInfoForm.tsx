"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { forwardRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Plus } from "lucide-react";
import {
  clubDetailSchema,
  type ClubDetailFormValues,
} from "@heritage-dx/store/schemas";
import type { ClubContactEntity } from "@heritage-dx/store";

import ClubRegisterFormCard from "./ClubRegisterFormCard";

export const CLUB_INFO_FORM_ID = "club-info-form";

export interface ClubInfoDefaultValues {
  name?: string;
  companyName?: string;
  region?: string;
  address?: string;
  openingDate?: string;
  holes?: string;
  totalLength?: string;
  memberCount?: number | string;
  membershipInfo?: string;
  introduction?: string;
  facilities?: string;
  registrationFee?: string;
  stampDuty?: string;
  agencyFee?: string;
  otherCosts?: string;
  website?: string;
  caddyFee?: number;
  cartFee?: number;
}

interface ClubInfoFormProps {
  defaults: ClubInfoDefaultValues | null;
  contacts?: ClubContactEntity[];
  onSubmit: (data: ClubDetailFormValues) => Promise<void> | void;
  onAddContact?: () => void;
  formId?: string;
}

export default function ClubInfoForm({
  defaults,
  contacts,
  onSubmit,
  onAddContact,
  formId = CLUB_INFO_FORM_ID,
}: ClubInfoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClubDetailFormValues>({
    resolver: zodResolver(clubDetailSchema),
    defaultValues: toFormValues(defaults),
  });

  useEffect(() => {
    reset(toFormValues(defaults));
  }, [defaults, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <ClubRegisterFormCard number="01" title="기본 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="골프장명" required error={errors.name?.message}>
            <Input placeholder="88 CC" {...register("name")} />
          </Field>
          <Field label="회사명">
            <Input placeholder="88 관광개발(주)" {...register("companyName")} />
          </Field>
          <Field label="지역">
            <Input placeholder="경기 용인시" {...register("region")} />
          </Field>
          <Field label="주소" wide>
            <Input placeholder="경기도 용인시 ..." {...register("address")} />
          </Field>
          <Field label="홈페이지" wide>
            <Input
              type="url"
              placeholder="https://www.example.com"
              {...register("website")}
            />
          </Field>
        </div>
      </ClubRegisterFormCard>

      <ClubRegisterFormCard number="02" title="골프장 소개">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="소개" wide>
            <Textarea
              rows={3}
              placeholder="골프장 소개글을 입력하세요"
              {...register("introduction")}
            />
          </Field>
          <Field label="부대시설" wide>
            <Input
              placeholder="클럽하우스, 레스토랑, 프로샵 등"
              {...register("facilities")}
            />
          </Field>
          <Field label="회원구성" wide>
            <Textarea
              rows={2}
              placeholder="회원 구성 정보를 입력하세요"
              {...register("membershipInfo")}
            />
          </Field>
        </div>
      </ClubRegisterFormCard>

      <ClubRegisterFormCard number="03" title="코스 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="개장일">
            <div className="relative">
              <Input
                type="date"
                className="pr-10"
                {...register("openingDate")}
              />
              <Calendar
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none"
                strokeWidth={1.7}
              />
            </div>
          </Field>
          <Field label="코스규모">
            <Input placeholder="36홀" {...register("holes")} />
          </Field>
          <Field label="코스거리">
            <Input
              placeholder="6,484m (동코스), 6,427m (서코스)"
              {...register("totalLength")}
            />
          </Field>
          <Field label="회원수">
            <Input placeholder="1,979명" {...register("memberCount")} />
          </Field>
        </div>
      </ClubRegisterFormCard>

      <ContactsCard contacts={contacts} onAdd={onAddContact} />

      <ClubRegisterFormCard number="05" title="비용 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="캐디피">
            <InputWithSuffix
              suffix="원"
              type="number"
              placeholder="0"
              {...register("caddyFee")}
            />
          </Field>
          <Field label="카트비">
            <InputWithSuffix
              suffix="원"
              type="number"
              placeholder="0"
              {...register("cartFee")}
            />
          </Field>
        </div>
      </ClubRegisterFormCard>

      <ClubRegisterFormCard number="06" title="명의개서 비용">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field label="명의개서료" wide>
            <Input
              placeholder="명의개서료를 입력하세요"
              {...register("registrationFee")}
            />
          </Field>
          <Field label="인지대">
            <Input placeholder="0" {...register("stampDuty")} />
          </Field>
          <Field label="대행수수료">
            <Input placeholder="0" {...register("agencyFee")} />
          </Field>
          <Field label="기타비용" wide>
            <Input placeholder="0" {...register("otherCosts")} />
          </Field>
        </div>
      </ClubRegisterFormCard>
    </form>
  );
}

function toFormValues(d: ClubInfoDefaultValues | null): ClubDetailFormValues {
  if (!d) {
    return {
      name: "",
      companyName: "",
      region: "",
      address: "",
      openingDate: "",
      holes: "",
      totalLength: "",
      memberCount: "",
      membershipInfo: "",
      introduction: "",
      facilities: "",
      registrationFee: "",
      stampDuty: "",
      agencyFee: "",
      otherCosts: "",
      website: "",
      caddyFee: undefined,
      cartFee: undefined,
    };
  }
  return {
    name: d.name ?? "",
    companyName: d.companyName ?? "",
    region: d.region ?? "",
    address: d.address ?? "",
    openingDate: d.openingDate ?? "",
    holes: d.holes ?? "",
    totalLength: d.totalLength ?? "",
    memberCount:
      typeof d.memberCount === "number" ? String(d.memberCount) : d.memberCount ?? "",
    membershipInfo: d.membershipInfo ?? "",
    introduction: d.introduction ?? "",
    facilities: d.facilities ?? "",
    registrationFee: d.registrationFee ?? "",
    stampDuty: d.stampDuty ?? "",
    agencyFee: d.agencyFee ?? "",
    otherCosts: d.otherCosts ?? "",
    website: d.website ?? "",
    caddyFee: d.caddyFee,
    cartFee: d.cartFee,
  };
}

function ContactsCard({
  contacts,
  onAdd,
}: {
  contacts?: ClubContactEntity[];
  onAdd?: () => void;
}) {
  const hasContacts = contacts && contacts.length > 0;
  return (
    <section className="bg-surface border border-neutral-200 rounded-card overflow-hidden mb-4">
      <header className="px-[22px] py-4 border-b border-neutral-100 bg-[#FBFBFA] flex items-center gap-2.5">
        <span className="font-mono text-[10.5px] font-medium text-neutral-400 tracking-[0.04em]">
          04
        </span>
        <h3 className="text-[14px] font-bold tracking-[-0.02em] text-neutral-900 m-0">
          연락처
        </h3>
      </header>
      {hasContacts ? (
        <div className="px-[22px] pt-[22px] pb-6 space-y-2.5">
          {contacts!.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-neutral-200 bg-[#FBFBFA]"
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-[12.5px] min-w-0">
                {contact.contactPerson && (
                  <div className="truncate">
                    <span className="text-neutral-500">담당자: </span>
                    <span className="text-neutral-800 font-medium">
                      {contact.contactPerson}
                    </span>
                  </div>
                )}
                {contact.phoneNumber && (
                  <div className="truncate">
                    <span className="text-neutral-500">전화: </span>
                    <span className="text-neutral-800 font-medium">
                      {contact.phoneNumber}
                    </span>
                  </div>
                )}
              </div>
              {contact.isPrimary && (
                <span className="inline-flex items-center h-[20px] px-2 text-[10px] font-semibold text-white bg-primary rounded-[4px]">
                  대표
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-9 px-[22px] flex flex-col items-center gap-3 text-center">
          <span className="text-[13px] text-[#888887]">
            등록된 연락처가 없습니다.
          </span>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-semibold text-neutral-900 bg-surface border border-neutral-200 rounded-[7px] cursor-pointer transition-colors hover:border-neutral-900 hover:bg-neutral-50"
            >
              <Plus className="w-3 h-3" strokeWidth={2} />
              <span>연락처 추가</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}

function Field({ label, required, hint, error, wide, children }: FieldProps) {
  return (
    <div
      className={`flex flex-col gap-1.5 min-w-0 ${wide ? "md:col-span-2" : ""}`}
    >
      <label className="text-[12px] font-semibold text-neutral-800 inline-flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-[#DC2626] font-bold">*</span>}
        {hint && (
          <span className="text-[10.5px] text-neutral-400 font-normal ml-1">
            {hint}
          </span>
        )}
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

const InputWithSuffix = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { suffix: string }
>(function InputWithSuffix({ suffix, className = "", ...props }, ref) {
  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        className={`w-full h-10 pl-3 pr-11 text-[13px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none transition-all tabular-nums placeholder:text-neutral-300 hover:border-[#C4C4C2] focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/[0.06] ${className}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#888887] pointer-events-none">
        {suffix}
      </span>
    </div>
  );
});
