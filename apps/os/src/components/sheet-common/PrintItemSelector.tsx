"use client";

import { useState } from "react";
import styles from "./sheet.module.css";

export interface PrintSelectorItem {
  key: string;
  label: string;
  hasData?: boolean;
}

export interface PrintSelectorGroup {
  title: string;
  items: PrintSelectorItem[];
}

interface PrintItemSelectorProps {
  groups: PrintSelectorGroup[];
  hidden: Set<string>;
  onChange: (next: Set<string>) => void;
  defaultOpen?: boolean;
}

export default function PrintItemSelector({
  groups,
  hidden,
  onChange,
  defaultOpen = false,
}: PrintItemSelectorProps) {
  const [open, setOpen] = useState(defaultOpen);

  const flat = groups.flatMap((g) => g.items);
  const eligible = flat.filter((i) => i.hasData !== false);
  const total = eligible.length;
  const selected = eligible.filter((i) => !hidden.has(i.key)).length;
  const allOn = selected === total && total > 0;

  const toggle = (key: string) => {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  const toggleAll = () => {
    if (allOn) {
      const next = new Set<string>();
      flat.forEach((i) => next.add(i.key));
      onChange(next);
    } else {
      onChange(new Set());
    }
  };

  return (
    <div className={`${styles.printSelector} print:hidden`}>
      <button
        type="button"
        className={styles.psHead}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.psIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        </span>
        <span className={styles.psTitle}>프린트 항목 선택</span>
        <span className={styles.psCount}>
          {selected}/{total}
        </span>
        <svg
          className={`${styles.psChev} ${open ? styles.psChevOpen : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open ? (
        <div className={styles.psBody}>
          <div className={styles.psTop}>
            <button type="button" className={styles.psSelAll} onClick={toggleAll}>
              {allOn ? "전체 해제" : "전체 선택"}
            </button>
            <span className={styles.psNote}>· 해제된 항목은 문서에서 즉시 제외됩니다</span>
          </div>
          {groups.map((g) => (
            <div key={g.title} className={styles.psCol}>
              <h5>{g.title}</h5>
              <div className={styles.psGrid}>
                {g.items.map((it) => {
                  const disabled = it.hasData === false;
                  const on = !disabled && !hidden.has(it.key);
                  return (
                    <button
                      key={it.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && toggle(it.key)}
                      className={`${styles.psChip} ${on ? styles.psChipOn : styles.psChipOff}`}
                      style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                    >
                      <span className={styles.psBox}>
                        {on ? (
                          <svg viewBox="0 0 8 6" width="8" height="6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 3 L3 5 L7 1" />
                          </svg>
                        ) : null}
                      </span>
                      <span>{it.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
