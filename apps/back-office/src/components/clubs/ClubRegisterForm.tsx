"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
import { clubBaseSchema, type ClubFormValues } from "@heritage-dx/store/schemas";
import ClubRegisterFormCard from "./ClubRegisterFormCard";
import ClubRegisterActionBar from "./ClubRegisterActionBar";

interface ClubRegisterFormProps {
  onSubmit: (data: ClubFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ClubRegisterForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: ClubRegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClubFormValues>({
    resolver: zodResolver(clubBaseSchema),
    defaultValues: { code: "", name: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ClubRegisterFormCard number="01" title="기본 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-[18px]">
          <Field
            label="골프장 코드"
            required
            hint="중복 불가"
            error={errors.code?.message}
          >
            <Input placeholder="G_XXX" {...register("code")} />
          </Field>
          <Field label="골프장명" required error={errors.name?.message}>
            <Input placeholder="88 CC" {...register("name")} />
          </Field>
          <Field label="회사명">
            <Input placeholder="88 관광개발" {...register("companyName")} />
          </Field>
          <Field label="지역">
            <Input placeholder="경기 용인시" {...register("region")} />
          </Field>
          <Field label="주소" wide>
            <Input placeholder="경기도 용인시..." {...register("address")} />
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

      <ClubRegisterFormCard number="02" title="코스 정보">
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

      <ClubRegisterActionBar onCancel={onCancel} isLoading={isLoading} />
    </form>
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
        {required && (
          <span className="text-[#DC2626] font-bold">*</span>
        )}
        {hint && (
          <span className="text-[10.5px] text-neutral-400 font-normal ml-1">
            {hint}
          </span>
        )}
      </label>
      {children}
      {error && (
        <span className="text-[11px] text-[#DC2626]">{error}</span>
      )}
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
