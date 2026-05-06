// 백엔드 Consultation.notes 가 JSONB({entries:[...]}) 로 정규화되면서 클라이언트가
// __MEMO_V1__ 마커로 인코딩하던 v1 스키마는 더 이상 표준 경로가 아니다. 다만
// customer.memo 등 단일 텍스트 필드에 과거 인코딩이 흘러들어온 케이스가 있어
// (1) plain text 정규화 (`flattenMemoHistoryNotes`) 와
// (2) 항목별 분리 디코딩 (`decodeMemoEntries`) / append 인코딩 (`appendCustomerMemoEntry`) 을
// 함께 지원한다. 후자는 고객 상세 화면의 상담 메모 항목별 표시·누적용.

const MEMO_MARKER = "__MEMO_V1__";

interface LegacyEncodedEntry {
  id?: unknown;
  title?: unknown;
  content: unknown;
  createdAt: unknown;
}

interface LegacyEncodedShape {
  entries: LegacyEncodedEntry[];
}

export interface CustomerMemoEntry {
  id?: string;
  title?: string;
  content: string;
  createdAt: string; // ISO
}

function tryParseLegacyEncoded(raw: unknown): LegacyEncodedEntry[] | null {
  if (typeof raw !== "string") return null;
  if (!raw.startsWith(MEMO_MARKER)) return null;
  const json = raw.slice(MEMO_MARKER.length);
  try {
    const parsed = JSON.parse(json) as LegacyEncodedShape;
    if (!parsed || !Array.isArray(parsed.entries)) return null;
    return parsed.entries;
  } catch {
    return null;
  }
}

// __MEMO_V1__{...} 인코딩이 단일 텍스트 메모 필드(예: customer.memo)에 흘러들어왔을 때
// raw 마커+JSON 을 그대로 노출하지 않도록 entries 의 content 만 시간순으로 합쳐 plain text 로
// 변환한다. 마커가 없으면 입력을 그대로 통과시킨다.
export function flattenMemoHistoryNotes(notes: unknown): string | null {
  if (typeof notes !== "string") return null;
  if (notes === "") return null;
  if (!notes.startsWith(MEMO_MARKER)) return notes;
  const parsed = tryParseLegacyEncoded(notes);
  if (!parsed) return notes; // 마커는 있지만 JSON 파싱 실패 → 데이터 손실 방지로 원본 유지
  if (parsed.length === 0) return null;
  const sorted = [...parsed].sort((a, b) => {
    const ta = typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0;
    const tb = typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });
  return sorted
    .map((e) => (typeof e.content === "string" ? e.content : ""))
    .filter((c) => c.length > 0)
    .join("\n\n");
}

// raw memo 가 __MEMO_V1__ 마커 형태이면 entries 를 시간 오름차순으로 디코딩해 반환.
// 마커가 없거나 파싱 실패 시 null — 호출 측이 plain text 표시로 fallback 하도록.
export function decodeMemoEntries(raw: unknown): CustomerMemoEntry[] | null {
  const parsed = tryParseLegacyEncoded(raw);
  if (!parsed) return null;
  return parsed
    .map((e) => ({
      id: typeof e.id === "string" ? e.id : undefined,
      title: typeof e.title === "string" ? e.title : undefined,
      content: typeof e.content === "string" ? e.content : "",
      createdAt: typeof e.createdAt === "string" ? e.createdAt : "",
    }))
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
}

// 기존 raw 메모(plain text 또는 __MEMO_V1__ 마커) 에 새 entry 를 누적해 인코딩.
// - raw 가 plain text 였다면 첫 entry 로 흡수하고 새 entry 를 뒤에 추가
// - raw 가 마커였다면 entries 배열에 push
// 반환값을 그대로 customer.memo 에 저장하면 다음 fetch 시 mapper 가 entries 디코딩 가능.
export function appendCustomerMemoEntry(
  raw: unknown,
  entry: CustomerMemoEntry,
): string {
  const existing: CustomerMemoEntry[] = [];
  const decoded = decodeMemoEntries(raw);
  if (decoded) {
    existing.push(...decoded);
  } else if (typeof raw === "string" && raw.trim()) {
    // 기존 plain text 를 잃지 않도록 첫 entry 로 흡수 (createdAt 미상)
    existing.push({
      content: raw,
      createdAt: new Date(0).toISOString(),
    });
  }
  existing.push(entry);
  return MEMO_MARKER + JSON.stringify({ entries: existing });
}
