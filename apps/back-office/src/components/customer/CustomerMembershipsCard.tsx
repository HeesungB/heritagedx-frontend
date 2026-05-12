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
import CustomerCardShell from "./CustomerCardShell";
import { OwnedMembershipFormModal } from "./OwnedMembershipFormModal";

interface CustomerMembershipsCardProps {
  customer: CustomerEntity;
  onPatch: (patch: CustomerUpdateInput) => Promise<boolean>;
}

// 골프장 이름 첫 글자 코드 + 색상 round-robin (시안 V2 club-code 컬러).
const CODE_PALETTE: { bg: string; text: string }[] = [
  { bg: "#DCFCE7", text: "#166534" },
  { bg: "#E8EEFB", text: "#2D3FAA" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#FFE4E6", text: "#9F1239" },
];

function deriveCode(clubName: string | null): string {
  if (!clubName) return "—";
  const trimmed = clubName.trim();
  if (!trimmed) return "—";
  const code = trimmed.slice(0, 2);
  return /^[\x00-\x7F]+$/.test(code) ? code.toUpperCase() : code;
}

function statusTagClass(status: string): string {
  if (status === "OWNED") return "bg-[#DCFCE7] text-[#166534]";
  if (status === "SELLING" || status === "TRANSFER_PENDING")
    return "bg-[#FEF3C7] text-[#92400E]";
  if (status === "SOLD") return "bg-[#F1F3F5] text-[#475569]";
  return "bg-[#F1F3F5] text-[#475569]";
}

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; initial: OwnedMembershipEntity }
  | null;

export default function CustomerMembershipsCard({
  customer,
  onPatch,
}: CustomerMembershipsCardProps) {
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
        !(
          it.clubId === deleting.clubId &&
          it.membershipId === deleting.membershipId
        ),
    );
    const ok = await persistList(next);
    setDeletingInProgress(false);
    if (ok) setDeleting(null);
  };

  return (
    <CustomerCardShell
      title="보유 회원권"
      titleMeta="· 멤버십 포함"
      action={
        <button
          type="button"
          onClick={() => setModal({ mode: "add" })}
          className="inline-flex items-center gap-1.5 h-[26px] px-[9px] rounded-md bg-surface border border-neutral-200 text-neutral-600 text-[11.5px] font-medium cursor-pointer transition-colors hover:text-neutral-900 hover:border-[#D4D4D2]"
        >
          <Plus className="w-[11px] h-[11px]" strokeWidth={2} />
          회원권 추가
        </button>
      }
    >
      <div className="border border-neutral-100 rounded-[10px] overflow-hidden">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12.5px] text-neutral-500">
            등록된 보유 회원권이 없습니다.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3.5 py-[11px] text-[11.5px] font-medium text-neutral-400 bg-[#FAFAF9] border-b border-neutral-100 tracking-[-0.005em] whitespace-nowrap">
                  골프장
                </th>
                <th className="text-left px-3.5 py-[11px] text-[11.5px] font-medium text-neutral-400 bg-[#FAFAF9] border-b border-neutral-100 tracking-[-0.005em] whitespace-nowrap">
                  회원 유형
                </th>
                <th className="text-left px-3.5 py-[11px] text-[11.5px] font-medium text-neutral-400 bg-[#FAFAF9] border-b border-neutral-100 tracking-[-0.005em] whitespace-nowrap w-[110px]">
                  상태
                </th>
                <th className="text-right px-3.5 py-[11px] text-[11.5px] font-medium text-neutral-400 bg-[#FAFAF9] border-b border-neutral-100 tracking-[-0.005em] whitespace-nowrap w-[70px]">
                  수량
                </th>
                <th className="text-left px-3.5 py-[11px] text-[11.5px] font-medium text-neutral-400 bg-[#FAFAF9] border-b border-neutral-100 tracking-[-0.005em] whitespace-nowrap">
                  메모
                </th>
                <th className="text-right px-3.5 py-[11px] text-[11.5px] font-medium text-neutral-400 bg-[#FAFAF9] border-b border-neutral-100 tracking-[-0.005em] whitespace-nowrap w-[90px]">
                  <span className="sr-only">액션</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((m, idx) => {
                const palette = CODE_PALETTE[idx % CODE_PALETTE.length]!;
                const statusLabel =
                  getOwnedMembershipStatusLabel(m.status) ?? m.status;
                return (
                  <tr
                    key={`${m.clubId}-${m.membershipId}`}
                    className="border-t border-neutral-50"
                  >
                    <td className="px-3.5 py-3.5 align-middle">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[10.5px] font-bold tracking-[0.02em] mr-2.5 align-middle"
                        style={{
                          background: palette.bg,
                          color: palette.text,
                        }}
                      >
                        {deriveCode(m.clubName ?? null)}
                      </span>
                      <span className="font-semibold text-neutral-900 align-middle">
                        {m.clubName ?? "—"}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 align-middle text-neutral-600 text-[13px]">
                      {m.membershipName ?? "—"}
                    </td>
                    <td className="px-3.5 py-3.5 align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-[9px] py-1 rounded-full whitespace-nowrap ${statusTagClass(m.status)}`}
                      >
                        {(m.status === "OWNED" ||
                          m.status === "SELLING" ||
                          m.status === "TRANSFER_PENDING") && (
                          <span className="w-[5px] h-[5px] rounded-full bg-current inline-block" />
                        )}
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 align-middle text-right">
                      <span className="font-mono text-[12px] text-neutral-500 tabular-nums">
                        {m.quantity}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 align-middle">
                      <span
                        className={`text-[12.5px] ${m.note?.trim() ? "text-neutral-700" : "text-neutral-400"}`}
                      >
                        {m.note?.trim() || "—"}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 align-middle text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setModal({ mode: "edit", initial: m })}
                          aria-label="수정"
                          title="수정"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-surface border border-neutral-200 text-neutral-600 cursor-pointer transition-colors hover:text-neutral-900 hover:border-[#D4D4D2]"
                        >
                          <Pencil className="w-3 h-3" strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(m)}
                          aria-label="삭제"
                          title="삭제"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-surface border border-neutral-200 text-[#B91C1C] cursor-pointer transition-colors hover:border-[#FCA5A5]"
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
    </CustomerCardShell>
  );
}
