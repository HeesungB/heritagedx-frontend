import type { ReactNode } from "react";

interface CustomerCardShellProps {
  title: ReactNode;
  titleMeta?: ReactNode;
  pill?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export default function CustomerCardShell({
  title,
  titleMeta,
  pill,
  action,
  children,
}: CustomerCardShellProps) {
  return (
    <section className="bg-surface border border-neutral-100 rounded-[14px] px-[22px] py-[18px] mb-4">
      <div className="flex items-center justify-between mb-3.5 gap-3">
        <div className="text-[14px] font-semibold text-neutral-900 tracking-[-0.01em] inline-flex items-baseline gap-2">
          {title}
          {pill && (
            <span className="text-[11px] font-semibold px-[7px] py-0.5 rounded bg-neutral-50 text-neutral-600 border border-neutral-200 font-mono">
              {pill}
            </span>
          )}
          {titleMeta && (
            <span className="text-[11px] font-normal text-neutral-400 tracking-normal">
              {titleMeta}
            </span>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
