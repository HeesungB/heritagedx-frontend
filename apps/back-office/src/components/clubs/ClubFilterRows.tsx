"use client";

import { INITIALS, REGION_GROUPS } from "@heritage-dx/utils";

interface ClubFilterRowsProps {
  activeRegion: string | null;
  availableRegions: Set<string>;
  onRegionClick: (region: string | null) => void;
  activeInitial: string | null;
  availableInitials: Set<string>;
  onInitialClick: (initial: string) => void;
}

export default function ClubFilterRows({
  activeRegion,
  availableRegions,
  onRegionClick,
  activeInitial,
  availableInitials,
  onInitialClick,
}: ClubFilterRowsProps) {
  return (
    <div className="px-[18px] pt-3 pb-3.5 flex flex-col gap-2.5 border-b border-neutral-100">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[10.5px] font-bold text-[#888887] tracking-[0.1em] uppercase min-w-[42px]">
          지역
        </span>
        <div className="flex flex-wrap gap-1 items-center">
          <RegionPill
            label="전체"
            active={activeRegion === null}
            available
            onClick={() => onRegionClick(null)}
          />
          {REGION_GROUPS.map((group) => (
            <RegionPill
              key={group}
              label={group}
              active={activeRegion === group}
              available={availableRegions.has(group)}
              onClick={() => onRegionClick(group)}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[10.5px] font-bold text-[#888887] tracking-[0.1em] uppercase min-w-[42px]">
          가나다
        </span>
        <div className="flex flex-wrap gap-1 items-center">
          {INITIALS.map((initial, idx) => {
            const isNumeric = initial === "0-9";
            const available = availableInitials.has(initial);
            const active = activeInitial === initial;
            return (
              <span key={initial} className="inline-flex items-center gap-1">
                {isNumeric && idx > 0 && (
                  <span className="w-px h-3.5 bg-neutral-200 mx-1" aria-hidden />
                )}
                <InitialChip
                  label={initial}
                  active={active}
                  available={available}
                  numeric={isNumeric}
                  onClick={() => available && onInitialClick(initial)}
                />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface RegionPillProps {
  label: string;
  active: boolean;
  available: boolean;
  onClick: () => void;
}

function RegionPill({ label, active, available, onClick }: RegionPillProps) {
  const base =
    "h-7 px-3.5 text-[12px] font-medium rounded-full border cursor-pointer transition-colors";
  if (active) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} bg-primary text-white border-primary font-semibold`}
      >
        {label}
      </button>
    );
  }
  if (!available) {
    return (
      <button
        type="button"
        disabled
        className={`${base} bg-transparent text-neutral-300 border-neutral-100 cursor-not-allowed`}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} bg-transparent text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 hover:border-[#DCDCD8]`}
    >
      {label}
    </button>
  );
}

interface InitialChipProps {
  label: string;
  active: boolean;
  available: boolean;
  numeric: boolean;
  onClick: () => void;
}

function InitialChip({ label, active, available, numeric, onClick }: InitialChipProps) {
  const base =
    "min-w-[28px] h-7 px-2 text-[12px] font-medium rounded-md border cursor-pointer inline-flex items-center justify-center transition-colors";
  const mono = numeric ? "font-mono text-[10.5px] px-2.5" : "";
  if (active) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${mono} bg-primary text-white border-primary font-semibold`}
      >
        {label}
      </button>
    );
  }
  if (!available) {
    return (
      <button
        type="button"
        disabled
        className={`${base} ${mono} bg-transparent text-neutral-300 border-neutral-100 cursor-not-allowed`}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${mono} bg-transparent text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 hover:border-[#DCDCD8]`}
    >
      {label}
    </button>
  );
}
