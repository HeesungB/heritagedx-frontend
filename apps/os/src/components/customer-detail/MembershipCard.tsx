"use client";

import { Plus } from "lucide-react";
import type { CustomerEntity } from "@heritage-dx/store";
import { cd } from "./styles";

interface MembershipCardProps {
  customer: CustomerEntity;
}

// 시안 표 헤더. 실제 회원권 행 데이터는 백엔드 미연동.
const COLUMNS: ReadonlyArray<{ key: string; label: string; align?: "left" | "right" }> = [
  { key: "club", label: "골프장" },
  { key: "type", label: "회원 유형" },
  { key: "state", label: "상태" },
  { key: "exp", label: "만료", align: "right" },
];

export function MembershipCard({ customer }: MembershipCardProps) {
  const summary = customer.ownedMembershipSummary;

  return (
    <div style={cd.card}>
      <div style={cd.cardHead}>
        <div style={cd.cardTitle}>
          보유 회원권
          <span
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              fontWeight: 400,
              marginLeft: 4,
            }}
          >
            · 멤버십 포함
          </span>
        </div>
        <button
          type="button"
          disabled
          style={{
            ...cd.smallBtn,
            cursor: "not-allowed",
            opacity: 0.6,
          }}
          title="회원권 데이터 연동 후 활성화"
        >
          <Plus size={11} strokeWidth={1.8} />
          회원권 추가
        </button>
      </div>

      <div
        style={{
          border: "1px solid var(--line)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            borderSpacing: 0,
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  style={{
                    textAlign: c.align ?? "left",
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: "var(--text-3)",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--line)",
                    background: "#fafafa",
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={COLUMNS.length}
                style={{
                  padding: "32px 14px",
                  textAlign: "center",
                  fontSize: 12.5,
                  color: "var(--text-3)",
                  background: "#fff",
                }}
              >
                {summary ? (
                  <span style={{ whiteSpace: "pre-wrap" }}>{summary}</span>
                ) : (
                  "등록된 보유 회원권이 없습니다"
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
