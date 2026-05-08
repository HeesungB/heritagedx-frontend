"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmModal } from "@heritage-dx/ui";
import {
  getOwnedMembershipStatusLabel,
  mapOwnedMembershipEntityToInput,
  type CustomerEntity,
  type CustomerUpdateInput,
  type OwnedMembershipEntity,
} from "@heritage-dx/store";
import { cd, getOwnedMembershipStatusColor, tagStyle } from "./styles";
import { OwnedMembershipFormModal } from "./OwnedMembershipFormModal";

interface MembershipCardProps {
  customer: CustomerEntity;
  onPatch: (patch: CustomerUpdateInput) => Promise<boolean>;
}

const COLUMNS: ReadonlyArray<{
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: number | string;
}> = [
  { key: "club", label: "골프장" },
  { key: "type", label: "회원 유형" },
  { key: "status", label: "상태", width: 90 },
  { key: "qty", label: "수량", align: "right", width: 60 },
  { key: "note", label: "메모" },
  { key: "actions", label: "", align: "right", width: 90 },
];

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; initial: OwnedMembershipEntity }
  | null;

export function MembershipCard({ customer, onPatch }: MembershipCardProps) {
  const items = customer.ownedMemberships;
  const [modal, setModal] = useState<ModalState>(null);
  const [deleting, setDeleting] = useState<OwnedMembershipEntity | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);

  const persistList = async (next: OwnedMembershipEntity[]) => {
    const sorted = [...next].sort((a, b) => a.displayOrder - b.displayOrder);
    return onPatch({
      ownedMemberships: sorted.map(mapOwnedMembershipEntityToInput),
    });
  };

  const handleModalSubmit = async (item: OwnedMembershipEntity) => {
    const next =
      modal?.mode === "edit"
        ? items.map((it) =>
            it.clubId === modal.initial.clubId &&
            it.membershipId === modal.initial.membershipId
              ? item
              : it,
          )
        : [...items, item];
    const ok = await persistList(next);
    if (!ok) throw new Error("저장에 실패했습니다.");
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    setDeletingInProgress(true);
    const next = items.filter(
      (it) =>
        !(it.clubId === deleting.clubId && it.membershipId === deleting.membershipId),
    );
    const ok = await persistList(next);
    setDeletingInProgress(false);
    if (ok) setDeleting(null);
  };

  return (
    <div style={cd.card}>
      <div style={cd.cardHead}>
        <div style={cd.cardTitle}>보유 회원권</div>
        <button
          type="button"
          onClick={() => setModal({ mode: "add" })}
          style={cd.smallBtn}
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
                    width: c.width,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
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
                  등록된 보유 회원권이 없습니다
                </td>
              </tr>
            ) : (
              items.map((it) => {
                const tag = tagStyle(getOwnedMembershipStatusColor(it.status), "sm");
                return (
                  <tr key={`${it.clubId}-${it.membershipId}`}>
                    <td style={cellStyle}>{it.clubName ?? "—"}</td>
                    <td style={cellStyle}>{it.membershipName ?? "—"}</td>
                    <td style={cellStyle}>
                      <span style={tag.wrap}>
                        <span style={tag.dot} />
                        {getOwnedMembershipStatusLabel(it.status) ?? it.status}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>{it.quantity}</td>
                    <td
                      style={{
                        ...cellStyle,
                        color: it.note ? "var(--text)" : "var(--text-3)",
                      }}
                    >
                      {it.note ?? "—"}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setModal({ mode: "edit", initial: it })}
                          style={iconBtn}
                          aria-label="수정"
                          title="수정"
                        >
                          <Pencil size={12} strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(it)}
                          style={{ ...iconBtn, color: "#b91c1c" }}
                          aria-label="삭제"
                          title="삭제"
                        >
                          <Trash2 size={12} strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <OwnedMembershipFormModal
          mode={modal.mode}
          existingItems={items}
          initialValue={modal.mode === "edit" ? modal.initial : undefined}
          onSubmit={handleModalSubmit}
          onClose={() => setModal(null)}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDeleteConfirm}
        title="회원권 삭제"
        message={
          deleting
            ? `${deleting.clubName ?? "이"} 회원권 (${deleting.membershipName ?? ""})을 삭제하시겠습니까?`
            : ""
        }
        confirmText="삭제"
        variant="danger"
        isLoading={deletingInProgress}
      />
    </div>
  );
}

const cellStyle = {
  padding: "10px 14px",
  borderTop: "1px solid var(--line)",
  fontSize: 12.5,
  color: "var(--text)",
  verticalAlign: "middle",
} as const;

const iconBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  borderRadius: 6,
  border: "1px solid var(--line)",
  background: "#fff",
  color: "var(--text-2)",
  cursor: "pointer",
} as const;
