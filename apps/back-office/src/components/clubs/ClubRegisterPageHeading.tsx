import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ClubRegisterPageHeading() {
  return (
    <div className="flex flex-col gap-2.5 mb-[18px]">
      <Link
        href="/clubs"
        className="inline-flex items-center gap-1 self-start h-7 -ml-1.5 px-1.5 text-[12px] font-medium text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-50 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
        <span>골프장 목록</span>
      </Link>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[22px] font-bold tracking-[-0.03em] leading-[1.2] text-neutral-900 m-0">
          골프장 등록
        </h1>
        <div className="text-[12.5px] text-neutral-500 leading-[1.5]">
          새로운 골프장을 등록합니다.{" "}
          <span className="text-[#DC2626] font-semibold">*</span> 표시는 필수 입력 항목입니다.
        </div>
      </div>
    </div>
  );
}
