import type { ReactNode } from "react";

interface PageHeadingV2Props {
  kicker: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  actions?: ReactNode;
}

export default function PageHeadingV2({
  kicker,
  title,
  subtitle,
  icon,
  actions,
}: PageHeadingV2Props) {
  return (
    <div className="flex items-start justify-between gap-6 mb-7">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-neutral-50 grid place-items-center text-neutral-900 flex-shrink-0">
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
            {kicker}
          </span>
          <h1 className="text-[24px] font-bold tracking-[-0.025em] text-neutral-900 leading-tight m-0">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[12.5px] text-neutral-500 mt-0.5 tracking-[-0.005em] max-w-[540px]">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
