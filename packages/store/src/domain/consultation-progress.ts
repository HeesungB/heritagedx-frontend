import type { ProgressStatus } from "@heritage-dx/types";
import { PROGRESS_STATUS } from "@heritage-dx/types";

// progressStatus 기반 상담 단계 판별 헬퍼.
// 2026-05 백엔드 신규 명세: DEPOSIT_REVIEW / DOCUMENT_AND_BALANCE_IN_PROGRESS /
// BALANCE_REVIEW / TAX_IN_PROGRESS / TAX_REVIEW / TRADE_COMPLETED 로 재편.
// 구 값(PENDING_DEPOSIT / DOCUMENT_AND_BALANCE / TAX_FILING / COMPLETED)은
// 호환용으로 병행 처리한다.

interface HasProgressStatus {
  progressStatus: ProgressStatus;
}

/** 상담↔거래 흐름이 완료 단계에 도달했는지. */
export function isConsultationCompleted(c: HasProgressStatus): boolean {
  return (
    c.progressStatus === PROGRESS_STATUS.TRADE_COMPLETED ||
    c.progressStatus === PROGRESS_STATUS.COMPLETED
  );
}

/** 거래내역 전환 후의 후속 단계(서류/잔금 이후) 묶음. */
export function isInTradeStage(c: HasProgressStatus): boolean {
  return (
    c.progressStatus === PROGRESS_STATUS.DOCUMENT_AND_BALANCE_IN_PROGRESS ||
    c.progressStatus === PROGRESS_STATUS.BALANCE_REVIEW ||
    c.progressStatus === PROGRESS_STATUS.TAX_IN_PROGRESS ||
    c.progressStatus === PROGRESS_STATUS.TAX_REVIEW ||
    c.progressStatus === PROGRESS_STATUS.TRADE_COMPLETED ||
    // backwards compat
    c.progressStatus === PROGRESS_STATUS.DOCUMENT_AND_BALANCE ||
    c.progressStatus === PROGRESS_STATUS.TAX_FILING ||
    c.progressStatus === PROGRESS_STATUS.COMPLETED
  );
}

/** 에디터가 REQUEST_APPROVAL 을 보낼 수 있는 단계. */
export function canRequestApproval(c: HasProgressStatus): boolean {
  return (
    c.progressStatus === PROGRESS_STATUS.IN_CONSULTATION ||
    c.progressStatus === PROGRESS_STATUS.DOCUMENT_AND_BALANCE_IN_PROGRESS ||
    c.progressStatus === PROGRESS_STATUS.TAX_IN_PROGRESS
  );
}

/** 승인 요청 후 관리자 검토 대기 중인 단계. */
export function isUnderReview(c: HasProgressStatus): boolean {
  return (
    c.progressStatus === PROGRESS_STATUS.DEPOSIT_REVIEW ||
    c.progressStatus === PROGRESS_STATUS.BALANCE_REVIEW ||
    c.progressStatus === PROGRESS_STATUS.TAX_REVIEW ||
    // backwards compat
    c.progressStatus === PROGRESS_STATUS.PENDING_DEPOSIT
  );
}
