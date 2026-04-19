export type PeriodPreset =
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "3months"
  | "6months"
  | "thisYear"
  | "lastYear"
  | "1year"
  | "custom";

export type DateField = "contractDate" | "createdAt";

export interface KpiFilters {
  preset: PeriodPreset;
  dateField: DateField;
  employeeId: string; // "" = 전체
  customStart?: string; // YYYY-MM-DD (preset === "custom"일 때)
  customEnd?: string;
}

export interface PresetGroupItem {
  key: PeriodPreset;
  label: string;
  group: "short" | "mid" | "long";
}

export const PRESET_GROUPS: PresetGroupItem[] = [
  { key: "thisWeek", label: "이번 주", group: "short" },
  { key: "lastWeek", label: "지난 주", group: "short" },
  { key: "thisMonth", label: "이번 달", group: "short" },
  { key: "lastMonth", label: "지난 달", group: "short" },
  { key: "3months", label: "3개월", group: "mid" },
  { key: "6months", label: "6개월", group: "mid" },
  { key: "1year", label: "1년", group: "mid" },
  { key: "thisYear", label: "올해", group: "long" },
  { key: "lastYear", label: "작년", group: "long" },
];

export interface DateRange {
  startDate: string;
  endDate: string;
  months: number;
}

export interface TimeBucket {
  startDate: string;
  endDate: string;
  label: string;
}

export function getDateRange(
  preset: PeriodPreset,
  customStart?: string,
  customEnd?: string,
): DateRange {
  if (preset === "custom" && customStart && customEnd) {
    const s = new Date(customStart);
    const e = new Date(customEnd);
    const months = Math.max(
      1,
      (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1,
    );
    return { startDate: customStart, endDate: customEnd, months };
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const d = now.getDay(); // 0=Sun

  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
  const firstOfMonth = (year: number, month: number) =>
    new Date(year, month, 1);
  const lastOfMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0);

  switch (preset) {
    case "thisWeek": {
      const mon = new Date(now);
      mon.setDate(now.getDate() - ((d + 6) % 7)); // 이번 주 월요일
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { startDate: fmt(mon), endDate: fmt(sun), months: 1 };
    }
    case "lastWeek": {
      const mon = new Date(now);
      mon.setDate(now.getDate() - ((d + 6) % 7) - 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { startDate: fmt(mon), endDate: fmt(sun), months: 1 };
    }
    case "thisMonth":
      return {
        startDate: fmt(firstOfMonth(y, m)),
        endDate: fmt(lastOfMonth(y, m)),
        months: 1,
      };
    case "lastMonth":
      return {
        startDate: fmt(firstOfMonth(y, m - 1)),
        endDate: fmt(lastOfMonth(y, m - 1)),
        months: 1,
      };
    case "3months":
      return {
        startDate: fmt(firstOfMonth(y, m - 2)),
        endDate: fmt(lastOfMonth(y, m)),
        months: 3,
      };
    case "6months":
      return {
        startDate: fmt(firstOfMonth(y, m - 5)),
        endDate: fmt(lastOfMonth(y, m)),
        months: 6,
      };
    case "1year":
      return {
        startDate: fmt(firstOfMonth(y, m - 11)),
        endDate: fmt(lastOfMonth(y, m)),
        months: 12,
      };
    case "thisYear":
      return {
        startDate: fmt(firstOfMonth(y, 0)),
        endDate: fmt(lastOfMonth(y, m)),
        months: m + 1,
      };
    case "lastYear":
      return {
        startDate: fmt(firstOfMonth(y - 1, 0)),
        endDate: fmt(lastOfMonth(y - 1, 11)),
        months: 12,
      };
    case "custom":
      // fallback — customStart/customEnd 없는 경우
      return {
        startDate: fmt(firstOfMonth(y, m)),
        endDate: fmt(lastOfMonth(y, m)),
        months: 1,
      };
  }
}

export function getMonthBuckets(startDate: string, endDate: string): TimeBucket[] {
  const buckets: TimeBucket[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const cy = cursor.getFullYear();
    const cm = cursor.getMonth();
    const first = new Date(cy, cm, 1);
    const last = new Date(cy, cm + 1, 0);
    buckets.push({
      startDate: first.toISOString().slice(0, 10),
      endDate: last.toISOString().slice(0, 10),
      label: `${cy}-${String(cm + 1).padStart(2, "0")}`,
    });
    cursor = new Date(cy, cm + 1, 1);
  }
  return buckets;
}

export function getDailyBuckets(startDate: string, endDate: string): TimeBucket[] {
  const buckets: TimeBucket[] = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);

  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    buckets.push({
      startDate: iso,
      endDate: iso,
      label: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

const WEEK_ORDINALS = ["첫째주", "둘째주", "셋째주", "넷째주", "다섯째주"];

export function getWeeklyBuckets(startDate: string, endDate: string): TimeBucket[] {
  const buckets: TimeBucket[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);

  let cursor = new Date(start);
  const monthWeekCount: Record<string, number> = {};

  while (cursor <= end) {
    const day = cursor.getDay(); // 0=Sun
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const weekEnd = new Date(cursor);
    weekEnd.setDate(cursor.getDate() + daysUntilSunday);

    const clampedEnd = weekEnd > end ? end : weekEnd;

    // 해당 주의 월요일 → 수요일을 구해서 그 월에 귀속
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(cursor);
    monday.setDate(cursor.getDate() + mondayOffset);
    const wednesday = new Date(monday);
    wednesday.setDate(monday.getDate() + 2);

    const ownerMonth = wednesday.getMonth();
    const ownerYear = wednesday.getFullYear();
    const monthKey = `${ownerYear}-${ownerMonth}`;

    const weekIndex = monthWeekCount[monthKey] ?? 0;
    monthWeekCount[monthKey] = weekIndex + 1;

    const label = `${ownerMonth + 1}월 ${WEEK_ORDINALS[weekIndex] ?? `${weekIndex + 1}째주`}`;

    buckets.push({
      startDate: fmt(cursor),
      endDate: fmt(clampedEnd),
      label,
    });

    cursor = new Date(clampedEnd);
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

export function getTimeBuckets(
  preset: PeriodPreset,
  startDate: string,
  endDate: string,
): TimeBucket[] {
  switch (preset) {
    case "thisWeek":
    case "lastWeek":
      return getDailyBuckets(startDate, endDate);
    case "thisMonth":
    case "lastMonth":
      return getWeeklyBuckets(startDate, endDate);
    case "3months":
    case "6months":
    case "1year":
    case "thisYear":
    case "lastYear":
      return getMonthBuckets(startDate, endDate);
    case "custom": {
      const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 14) return getDailyBuckets(startDate, endDate);
      if (diffDays <= 62) return getWeeklyBuckets(startDate, endDate);
      return getMonthBuckets(startDate, endDate);
    }
  }
}

/**
 * 거래 API dateField → 상담 API dateField 매핑
 * 현재 뷰 3곳에 흩어진 `dateField === "contractDate" ? "registrationDate" : "createdAt"` 규칙
 */
export function toConsultationDateField(
  field: DateField,
): "registrationDate" | "createdAt" {
  return field === "contractDate" ? "registrationDate" : "createdAt";
}
