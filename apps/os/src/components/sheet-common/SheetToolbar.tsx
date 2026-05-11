"use client";

import styles from "./sheet.module.css";

interface SheetToolbarProps {
  title: string;
  showEditBadge?: boolean;
  onPrint: () => void;
  onJpeg: () => void;
  jpegLoading?: boolean;
}

export default function SheetToolbar({
  title,
  showEditBadge,
  onPrint,
  onJpeg,
  jpegLoading,
}: SheetToolbarProps) {
  return (
    <div className={`${styles.toolbar} print:hidden`}>
      <span className={styles.toolbarLabel}>{title}</span>
      <span className={styles.toolbarSep} />
      {showEditBadge ? (
        <span className={styles.toolbarBadge}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          클릭 편집
        </span>
      ) : null}

      <div className={styles.toolbarRight}>
        <button type="button" onClick={onPrint} className={styles.pillBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          인쇄하기
        </button>
        <button
          type="button"
          onClick={onJpeg}
          disabled={jpegLoading}
          className={`${styles.pillBtn} ${styles.pillBtnDark}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {jpegLoading ? "저장 중..." : "JPEG 저장"}
        </button>
      </div>
    </div>
  );
}
