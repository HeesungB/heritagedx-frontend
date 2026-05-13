interface ClubsPageHeadingProps {
  totalCount?: number;
}

export default function ClubsPageHeading({ totalCount }: ClubsPageHeadingProps) {
  return (
    <div className="flex items-start justify-between gap-6 mb-[18px]">
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-1.5 text-[11.5px] text-neutral-400 mb-0.5">
          <span className="text-neutral-600">골프장</span>
          <span className="text-[#C4C4C2]">/</span>
          <span>골프장 정보 검색</span>
        </div>
        <h1 className="text-[22px] font-bold tracking-[-0.03em] leading-[1.2] text-neutral-900 m-0">
          골프장 정보 검색
        </h1>
        <div className="text-[12.5px] text-neutral-500 leading-[1.5]">
          전국 제휴 및 등록 골프장의 상세 정보를 빠르고 정확하게 확인해보세요.
          {typeof totalCount === "number" && (
            <span className="ml-2 font-mono text-neutral-400">· 총 {totalCount}곳</span>
          )}
        </div>
      </div>
    </div>
  );
}
