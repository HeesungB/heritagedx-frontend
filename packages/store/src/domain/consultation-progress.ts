import type { ProgressStatus } from "@heritage-dx/types";
import { PROGRESS_STATUS } from "@heritage-dx/types";

// progressStatus 기반 상담 단계 판별 헬퍼.
// 백엔드 응답에서 `isDone` 필드가 제거된 뒤(스웨거 v1.0.0+57563d32) "완료" 판별은
// progressStatus === "COMPLETED" 로 통일된다. 뷰는 이 헬퍼를 통해 단일 진입점으로 비교한다.

interface HasProgressStatus {
  progressStatus: ProgressStatus;
}

/** 상담↔거래 흐름이 COMPLETED 단계에 도달했는지. (구 isDone 의 의미적 대체) */
export function isConsultationCompleted(c: HasProgressStatus): boolean {
  return c.progressStatus === PROGRESS_STATUS.COMPLETED;
}

/** TAX_FILING 또는 COMPLETED 단계 — 거래내역 전환 후의 후속 단계 묶음. */
export function isInTradeStage(c: HasProgressStatus): boolean {
  return (
    c.progressStatus === PROGRESS_STATUS.TAX_FILING ||
    c.progressStatus === PROGRESS_STATUS.COMPLETED ||
    c.progressStatus === PROGRESS_STATUS.DOCUMENT_AND_BALANCE
  );
}
