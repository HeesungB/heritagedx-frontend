"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { ClubSearchSelect, type ClubSearchItem } from "@heritage-dx/ui";
import {
  OWNED_MEMBERSHIP_STATUS_LABEL,
  useClubs,
  useClubDetail,
  useTopClubs,
  type OwnedMembershipEntity,
  type OwnedMembershipStatusKey,
} from "@heritage-dx/store";
import { useAppStores } from "@/stores";

interface Props {
  mode: "add" | "edit";
  existingItems: OwnedMembershipEntity[];
  initialValue?: OwnedMembershipEntity;
  onSubmit: (item: OwnedMembershipEntity) => Promise<void> | void;
  onClose: () => void;
}

const STATUS_OPTIONS: ReadonlyArray<{
  value: OwnedMembershipStatusKey;
  label: string;
}> = (
  Object.entries(OWNED_MEMBERSHIP_STATUS_LABEL) as [
    OwnedMembershipStatusKey,
    string,
  ][]
).map(([value, label]) => ({ value, label }));

const inputCls =
  "h-10 w-full rounded-md border border-[#d4d4d8] bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors focus:border-[#0a0a0a] disabled:bg-gray-50 disabled:text-gray-500";

export function OwnedMembershipFormModal({
  mode,
  existingItems,
  initialValue,
  onSubmit,
  onClose,
}: Props) {
  const { club: clubStore } = useAppStores();
  const { clubs } = useClubs(clubStore);

  // ClubEntity 는 id를 갖지 않으므로(검색용 경량 모델), 선택된 골프장의 UUID는
  // useClubDetail 의 응답에서 가져온다. edit 모드에서는 초기 clubId를 가지고 있지만
  // 회원권 옵션을 다시 채우려면 동일하게 detail 호출이 필요하므로 code 기반으로 통일한다.
  const initialClubCode = useMemo(() => {
    if (!initialValue) return "";
    const matched = clubs.find((c) => c.code === initialValue.clubId);
    if (matched) return matched.code;
    const byName = clubs.find((c) => c.name === initialValue.clubName);
    return byName?.code ?? "";
  }, [clubs, initialValue]);

  const [selectedClubCode, setSelectedClubCode] = useState<string>(initialClubCode);
  useEffect(() => {
    if (!selectedClubCode && initialClubCode) setSelectedClubCode(initialClubCode);
  }, [initialClubCode, selectedClubCode]);

  const { detail: clubDetail, isLoading: clubDetailLoading } = useClubDetail(
    clubStore,
    selectedClubCode || null,
  );

  const [membershipId, setMembershipId] = useState<string>(
    initialValue?.membershipId ?? "",
  );
  const [membershipName, setMembershipName] = useState<string>(
    initialValue?.membershipName ?? "",
  );
  const [status, setStatus] = useState<string>(initialValue?.status ?? "OWNED");
  const [quantity, setQuantity] = useState<number>(initialValue?.quantity ?? 1);
  const [note, setNote] = useState<string>(initialValue?.note ?? "");
  const [displayOrder, setDisplayOrder] = useState<number>(
    initialValue?.displayOrder ?? existingItems.length + 1,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialValue && selectedClubCode === initialClubCode) {
      return;
    }
    setMembershipId("");
    setMembershipName("");
  }, [selectedClubCode, mode, initialValue, initialClubCode]);

  const clubsAsItems: ClubSearchItem[] = useMemo(
    () =>
      clubs.map((c) => ({
        code: c.code,
        name: c.name,
        region: c.region,
        operationTypes: c.operationTypes,
        holes: c.holes,
      })),
    [clubs],
  );

  const { topClubCodes, isFavorite, toggleFavorite, trackSelection } = useTopClubs(
    clubsAsItems,
    5,
  );

  const membershipOptions = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    for (const m of clubDetail?.memberships ?? []) {
      const name = (m.membershipName || m.membershipType || "").trim();
      if (!name || !m.id) continue;
      if (!seen.has(name)) seen.set(name, { id: m.id, name });
    }
    return Array.from(seen.values());
  }, [clubDetail?.memberships]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clubDetail?.id) {
      setError("골프장을 선택해주세요.");
      return;
    }
    if (!membershipId) {
      setError("회원권을 선택해주세요.");
      return;
    }
    if (!status.trim()) {
      setError("상태를 선택해주세요.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      setError("수량은 1 이상이어야 합니다.");
      return;
    }
    if (!Number.isFinite(displayOrder) || displayOrder < 1) {
      setError("정렬 순서는 1 이상이어야 합니다.");
      return;
    }

    const duplicate = existingItems.find(
      (it) =>
        it.clubId === clubDetail.id &&
        it.membershipId === membershipId &&
        !(
          mode === "edit" &&
          initialValue &&
          it.clubId === initialValue.clubId &&
          it.membershipId === initialValue.membershipId
        ),
    );
    if (duplicate) {
      setError("이미 등록된 골프장·회원권 조합입니다.");
      return;
    }

    const next: OwnedMembershipEntity = {
      clubId: clubDetail.id,
      membershipId,
      status,
      quantity,
      note: note.trim() ? note.trim() : null,
      displayOrder,
      clubName: clubDetail.name,
      membershipName: membershipName || null,
    };

    setSubmitting(true);
    try {
      await onSubmit(next);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[480px] overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#0a0a0a]">
            {mode === "add" ? "회원권 추가" : "회원권 수정"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <Field label="골프장" required>
            <ClubSearchSelect
              clubs={clubsAsItems}
              selectedClubCode={selectedClubCode}
              onChange={(code) => setSelectedClubCode(code)}
              topClubCodes={topClubCodes}
              isFavorite={isFavorite}
              onToggleFavorite={(code, item) =>
                toggleFavorite(code, {
                  name: item.name,
                  region: item.region,
                  holes: item.holes,
                })
              }
              onClubSelect={(item) =>
                trackSelection({ code: item.code, name: item.name })
              }
              placeholder="골프장 검색"
            />
          </Field>

          <Field label="회원권" required>
            <select
              value={membershipName}
              onChange={(e) => {
                const picked = membershipOptions.find((o) => o.name === e.target.value);
                setMembershipId(picked?.id ?? "");
                setMembershipName(e.target.value);
              }}
              className={inputCls}
              disabled={!selectedClubCode || clubDetailLoading || membershipOptions.length === 0}
            >
              <option value="">
                {!selectedClubCode
                  ? "먼저 골프장을 선택해주세요"
                  : clubDetailLoading
                    ? "회원권 목록 불러오는 중…"
                    : membershipOptions.length === 0
                      ? "등록된 회원권이 없습니다"
                      : "선택"}
              </option>
              {membershipOptions.map((opt) => (
                <option key={opt.id} value={opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="상태" required>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputCls}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="수량" required>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={`${inputCls} text-right tabular-nums`}
              />
            </Field>
          </div>

          <Field label="메모">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 명의이전 완료, 만료 임박 등"
              className={inputCls}
            />
          </Field>

          <Field label="정렬 순서">
            <input
              type="number"
              min={1}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className={`${inputCls} text-right tabular-nums`}
            />
          </Field>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-9 items-center rounded-md border border-[#d4d4d8] bg-white px-4 text-[13px] font-semibold text-[#3f3f46] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 items-center rounded-md bg-[#0a0a0a] px-4 text-[13px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {submitting ? "저장 중…" : mode === "add" ? "추가" : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-[#3f3f46]">
        {label}
        {required && <span className="ml-1 text-[#DC2626]">*</span>}
      </span>
      {children}
    </label>
  );
}
