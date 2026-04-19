export interface DocumentEntity {
  id: string;
  clubDocumentId: string | null;
  name: string;
  fileName: string | null;
  fileDescription: string | null;
  minCount: number;
  unit: string;
  isMandatory: boolean;
  notes: string;
  displayOrder: number;
  downloadUrl: string | null;
  downloadUrlExpiresAt: string | null;
}

export interface GlobalDocumentEntity {
  id: string;
  name: string;
  fileName: string | null;
  fileDescription: string | null;
  downloadUrl: string | null;
  downloadUrlExpiresAt: string | null;
}

export interface CustomerDocumentEntity {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MembershipDocumentEntity {
  id: string;
  membershipId: string;
  name: string;
  fileName: string;
  fileDescription: string;
  downloadUrl: string;
  downloadUrlExpiresAt: string;
}

// ─── 다운로드 URL 만료 서술자 ──────────────────────────────────────────────

type HasExpiresAt = { downloadUrlExpiresAt: string | null | undefined };

/**
 * 다운로드 URL 만료 여부.
 * - expiresAt 없음 → 만료 아님 (서명 URL 미발급 상태)
 * - expiresAt < 현재 → 만료
 */
export function isDocumentExpired(doc: HasExpiresAt): boolean {
  if (!doc.downloadUrlExpiresAt) return false;
  return Date.now() > new Date(doc.downloadUrlExpiresAt).getTime();
}

/** 다운로드 가능 = URL 존재 + 미만료 */
export function isDocumentDownloadable(
  doc: HasExpiresAt & { downloadUrl: string | null | undefined },
): boolean {
  return !!doc.downloadUrl && !isDocumentExpired(doc);
}
