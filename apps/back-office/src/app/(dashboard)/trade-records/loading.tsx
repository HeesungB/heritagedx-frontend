export default function MembershipTradesLoading() {
  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col bg-[#FAFAF9]">
      <div className="flex items-center justify-between border-b border-neutral-100 bg-surface px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-[10px] bg-neutral-100" />
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
            <div className="h-6 w-32 animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-neutral-100" />
      </div>

      <div className="grid flex-1 gap-5 px-5 py-5 lg:grid-cols-[minmax(360px,580px)_1fr] lg:px-8">
        <div className="space-y-3">
          <div className="h-40 animate-pulse rounded-lg border border-neutral-100 bg-surface" />
          <div className="h-10 animate-pulse rounded-lg border border-neutral-100 bg-surface" />
          <div className="space-y-2 rounded-lg border border-neutral-100 bg-surface p-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-neutral-50" />
            ))}
          </div>
        </div>
        <div className="h-[680px] animate-pulse rounded-lg border border-neutral-100 bg-surface" />
      </div>
    </div>
  );
}
