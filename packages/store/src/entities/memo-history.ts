// 상담일지 메모 히스토리.
//
// 백엔드 Consultation.notes 는 단일 문자열 컬럼이라, 누적 엔트리를 표현하기 위해
// 클라이언트가 다음 형식으로 인코딩한다.
//
//   __MEMO_V1__{"entries":[{"id":"...","author":"...","authorId":null,"content":"...","createdAt":"..."}]}
//
// 마커가 없거나 파싱이 실패하면 legacy 단일 텍스트로 간주하여 첫 엔트리로 흡수한다.

export interface MemoHistoryEntry {
  id: string;
  author: string;
  authorId: string | null;
  content: string;
  createdAt: string;
}

export const MEMO_MARKER = "__MEMO_V1__";

export interface LegacyFallback {
  author: string;
  createdAt: string;
  remarks?: string | null;
}

interface EncodedShape {
  entries: MemoHistoryEntry[];
}

function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `memo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isEntry(value: unknown): value is MemoHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.author === "string" &&
    (v.authorId === null || typeof v.authorId === "string") &&
    typeof v.content === "string" &&
    typeof v.createdAt === "string"
  );
}

function tryParseEncoded(raw: string): MemoHistoryEntry[] | null {
  if (!raw.startsWith(MEMO_MARKER)) return null;
  const json = raw.slice(MEMO_MARKER.length);
  try {
    const parsed = JSON.parse(json) as EncodedShape;
    if (!parsed || !Array.isArray(parsed.entries)) return null;
    const entries = parsed.entries.filter(isEntry);
    return entries;
  } catch {
    return null;
  }
}

export function decodeMemoHistory(
  notes: string | null,
  fallback: LegacyFallback,
): MemoHistoryEntry[] {
  const entries = notes ? tryParseEncoded(notes) : null;
  if (entries) return entries;

  // legacy 흡수: notes 본문 + (있다면) remarks 를 각각 별도 엔트리로 변환
  const legacy: MemoHistoryEntry[] = [];
  const noteText = (notes ?? "").trim();
  if (noteText.length > 0) {
    legacy.push({
      id: `legacy-notes-${fallback.createdAt}`,
      author: fallback.author,
      authorId: null,
      content: noteText,
      createdAt: fallback.createdAt,
    });
  }
  const remarkText = (fallback.remarks ?? "").trim();
  if (remarkText.length > 0) {
    legacy.push({
      id: `legacy-remarks-${fallback.createdAt}`,
      author: fallback.author,
      authorId: null,
      content: remarkText,
      createdAt: fallback.createdAt,
    });
  }
  return legacy;
}

export function encodeMemoHistory(entries: MemoHistoryEntry[]): string | null {
  if (entries.length === 0) return null;
  return `${MEMO_MARKER}${JSON.stringify({ entries })}`;
}

export interface AppendInput {
  author: string;
  authorId: string | null;
  content: string;
  createdAt?: string;
}

export function appendMemoEntry(
  current: string | null,
  input: AppendInput,
  fallback: LegacyFallback,
): { entries: MemoHistoryEntry[]; encoded: string } {
  const previous = decodeMemoHistory(current, fallback);
  const next: MemoHistoryEntry = {
    id: generateId(),
    author: input.author,
    authorId: input.authorId,
    content: input.content,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  const entries = [...previous, next];
  const encoded = encodeMemoHistory(entries);
  return { entries, encoded: encoded ?? "" };
}

export function getLatestMemoEntry(entries: MemoHistoryEntry[]): MemoHistoryEntry | null {
  if (entries.length === 0) return null;
  return entries.reduce((latest, current) =>
    current.createdAt > latest.createdAt ? current : latest,
  );
}
