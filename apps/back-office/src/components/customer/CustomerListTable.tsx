"use client";

import type { CustomerEntity } from "@heritage-dx/store";

interface CustomerListTableProps {
  rows: CustomerEntity[];
  startIndex: number;
  onRowClick: (customer: CustomerEntity) => void;
  emptyText: string;
}

const GRID_TEMPLATE =
  "grid-cols-[64px_144px_144px_204px_240px_116px_minmax(0,1fr)_120px]";

function formatRegistrationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function isAsciiName(name: string): boolean {
  return /^[\x00-\x7F]+$/.test(name);
}

export default function CustomerListTable({
  rows,
  startIndex,
  onRowClick,
  emptyText,
}: CustomerListTableProps) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-sm text-neutral-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1200px]" role="table" aria-label="고객 목록">
        <div
          className={`grid ${GRID_TEMPLATE} items-center bg-surface border-b border-neutral-100`}
          role="row"
        >
          <div className="px-3.5 py-4 text-[11.5px] font-medium text-neutral-400 tracking-[-0.005em]">
            No.
          </div>
          <div className="px-3.5 py-4 text-[11.5px] font-medium text-neutral-400 tracking-[-0.005em]">
            고객명
          </div>
          <div className="px-3.5 py-4 text-[11.5px] font-medium text-neutral-400 tracking-[-0.005em]">
            연락처
          </div>
          <div className="px-3.5 py-4 text-[11.5px] font-medium text-neutral-400 tracking-[-0.005em]">
            이메일
          </div>
          <div className="px-3.5 py-4 text-[11.5px] font-medium text-neutral-400 tracking-[-0.005em]">
            주소
          </div>
          <div className="px-3.5 py-4 text-[11.5px] font-medium text-neutral-400 tracking-[-0.005em]">
            등록일
          </div>
          <div className="px-3.5 py-4 text-[11.5px] font-medium text-neutral-400 tracking-[-0.005em]">
            메모
          </div>
          <div className="px-3.5 py-4 text-[11.5px] font-medium text-neutral-400 tracking-[-0.005em]">
            담당자
          </div>
        </div>

        <div role="rowgroup">
          {rows.map((customer, idx) => {
            const number = startIndex + idx;
            const memoText = customer.memo?.trim() || "-";
            const isMonoMemo = customer.memo?.startsWith("__MEMO_V1_") ?? false;
            const nameAscii = isAsciiName(customer.name);
            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => onRowClick(customer)}
                className={`group relative grid ${GRID_TEMPLATE} items-center border-t border-neutral-50 transition-colors hover:bg-[#FAFAF9] cursor-pointer text-left w-full`}
                role="row"
              >
                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-neutral-900 transition-colors" />
                <div className="px-3.5 py-5 min-w-0 overflow-hidden">
                  <span className="block font-mono text-[12px] text-neutral-400 tracking-[0.02em] tabular-nums">
                    {String(number).padStart(2, "0")}
                  </span>
                </div>
                <div className="px-3.5 py-5 min-w-0 overflow-hidden">
                  <span
                    className={`block min-w-0 max-w-full whitespace-nowrap overflow-hidden text-ellipsis text-[14px] font-bold text-neutral-900 ${
                      nameAscii ? "tracking-[-0.015em]" : "tracking-[-0.025em]"
                    }`}
                  >
                    {customer.name}
                  </span>
                </div>
                <div className="px-3.5 py-5 min-w-0 overflow-hidden">
                  <span className="block min-w-0 max-w-full whitespace-nowrap overflow-hidden text-ellipsis font-mono text-[12.5px] font-medium text-neutral-900">
                    {customer.contact || "-"}
                  </span>
                </div>
                <div className="px-3.5 py-5 min-w-0 overflow-hidden">
                  <span className="block min-w-0 max-w-full whitespace-nowrap overflow-hidden text-ellipsis font-mono text-[12px] text-neutral-600">
                    {customer.email || "-"}
                  </span>
                </div>
                <div className="px-3.5 py-5 min-w-0 overflow-hidden">
                  <span className="block min-w-0 max-w-full whitespace-nowrap overflow-hidden text-ellipsis text-[12.5px] text-neutral-600">
                    {customer.address || "-"}
                  </span>
                </div>
                <div className="px-3.5 py-5 min-w-0 overflow-hidden">
                  <span className="block min-w-0 max-w-full whitespace-nowrap overflow-hidden text-ellipsis font-mono text-[11.5px] text-neutral-500">
                    {formatRegistrationDate(customer.createdAt)}
                  </span>
                </div>
                <div className="px-3.5 py-5 min-w-0 overflow-hidden">
                  <span
                    className={`block min-w-0 max-w-full whitespace-nowrap overflow-hidden text-ellipsis ${
                      isMonoMemo
                        ? "font-mono text-[11.5px] text-neutral-500"
                        : "text-[12.5px] text-neutral-600"
                    }`}
                  >
                    {memoText}
                  </span>
                </div>
                <div className="px-3.5 py-5 min-w-0 overflow-hidden">
                  <span className="block min-w-0 max-w-full whitespace-nowrap overflow-hidden text-ellipsis text-[12.5px] font-medium text-neutral-900 tracking-[-0.01em]">
                    {customer.createdByName || "-"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
