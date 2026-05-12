"use client";

import type { CustomerEntity } from "@heritage-dx/store";
import { getCustomerGradeLabel } from "@heritage-dx/store";

interface CustomerPersonCardProps {
  customer: CustomerEntity;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 시안의 등급 컬러 매핑. ACTIVE_DEAL=거래중(amber dot), 그 외 등급=green dot.
function gradeTagClass(gradeKey: string | null | undefined): string {
  if (gradeKey === "ACTIVE_DEAL") {
    return "bg-[#FEF3C7] text-[#92400E]";
  }
  return "bg-[#DCFCE7] text-[#166534]";
}

function GradeTag({ gradeKey, label }: { gradeKey: string | null; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-[9px] py-1 rounded-full leading-[1.4] whitespace-nowrap ${gradeTagClass(gradeKey)}`}
    >
      <span className="w-[5px] h-[5px] rounded-full bg-current inline-block" />
      {label}
    </span>
  );
}

export default function CustomerPersonCard({ customer }: CustomerPersonCardProps) {
  const gradeLabel = getCustomerGradeLabel(customer.customerGrade);

  return (
    <section className="bg-surface border border-neutral-100 rounded-[14px] p-[22px_24px] mb-[18px]">
      <div className="flex items-center justify-between gap-3.5 flex-wrap">
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-[22px] font-bold text-neutral-900 tracking-[-0.025em] leading-tight">
                {customer.name}
              </span>
            </div>
            {gradeLabel && (
              <div className="flex gap-1.5 flex-wrap">
                <GradeTag gradeKey={customer.customerGrade ?? null} label={gradeLabel} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-[18px] pt-4 border-t border-neutral-50 grid grid-cols-2 md:grid-cols-4 gap-[18px]">
        <MetaItem label="연락처" value={customer.contact || "-"} mono />
        <MetaItem label="이메일" value={customer.email || "-"} mono />
        <MetaItem label="등록일" value={formatDate(customer.createdAt)} mono />
        <MetaItem
          label="담당자"
          value={customer.createdByName || "-"}
        />
      </div>
    </section>
  );
}

function MetaItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10.5px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">
        {label}
      </span>
      <span
        className={`text-[13px] text-neutral-900 font-medium tracking-[-0.005em] whitespace-nowrap overflow-hidden text-ellipsis ${
          mono ? "font-mono text-[12.5px] tracking-normal" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
