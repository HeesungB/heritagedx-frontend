"use client";

import { useEffect, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { ClubSearchSelect, type ClubSearchItem } from "@heritage-dx/ui";
import {
  OWNED_MEMBERSHIP_STATUS_LABEL,
  useClubs,
  useClubDetail,
  useTopClubs,
  type OwnedMembershipStatusKey,
} from "@heritage-dx/store";
import { useAppStores } from "@/stores";

export interface DraftMembership {
  /** UI 식별용. 서버에 보내지 않음. */
  rowId: string;
  /** ClubSearchSelect 가 사용하는 club code. */
  clubCode: string;
  /** clubDetail 응답에서 채워지는 UUID. payload 의 clubId. */
  clubId: string;
  clubName: string | null;
  membershipId: string;
  membershipName: string | null;
  status: string;
  quantity: number;
  note: string;
  displayOrder: number;
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

export function emptyDraftMembership(displayOrder: number): DraftMembership {
  return {
    rowId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `m-${Math.random().toString(36).slice(2)}`,
    clubCode: "",
    clubId: "",
    clubName: null,
    membershipId: "",
    membershipName: null,
    status: "OWNED",
    quantity: 1,
    note: "",
    displayOrder,
  };
}

interface Props {
  index: number;
  value: DraftMembership;
  onChange: (patch: Partial<DraftMembership>) => void;
  onRemove: () => void;
  canRemove: boolean;
  showError: boolean;
  duplicate: boolean;
}

export function MembershipRow({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
  showError,
  duplicate,
}: Props) {
  const { club: clubStore } = useAppStores();
  const { clubs } = useClubs(clubStore);
  const { detail: clubDetail, isLoading: clubDetailLoading } = useClubDetail(
    clubStore,
    value.clubCode || null,
  );

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

  // clubDetail 응답이 도착하면 clubId / clubName 갱신
  useEffect(() => {
    if (!value.clubCode) return;
    if (clubDetail?.id && clubDetail.id !== value.clubId) {
      onChange({ clubId: clubDetail.id, clubName: clubDetail.name });
    }
  }, [clubDetail?.id, clubDetail?.name, value.clubCode, value.clubId, onChange]);

  // 회원권 옵션 dedup (이름 기준, 첫 매칭 id 대표)
  const membershipOptions = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    for (const m of clubDetail?.memberships ?? []) {
      const name = (m.membershipName || m.membershipType || "").trim();
      if (!name || !m.id) continue;
      if (!seen.has(name)) seen.set(name, { id: m.id, name });
    }
    return Array.from(seen.values());
  }, [clubDetail?.memberships]);

  const courseInvalid = showError && !value.clubId;
  const typeInvalid = showError && !value.membershipId;

  return (
    <div className="mb-2.5 rounded-[10px] border border-[#e5e7eb] bg-[#fafaf7] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#d4d4d8] bg-white text-[11px] font-semibold text-[#3f3f46]">
            {index + 1}
          </span>
          <span className="text-[13.5px] font-semibold text-[#101828]">
            회원권 정보
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] text-[#6a7282] hover:bg-[#f1f1f2] hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
            삭제
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center gap-1 text-[12.5px] font-medium text-[#3f3f46]">
            골프장명 <span className="text-red-600">*</span>
          </div>
          <div
            className={
              courseInvalid
                ? "rounded-md ring-1 ring-red-500"
                : ""
            }
          >
            <ClubSearchSelect
              clubs={clubsAsItems}
              selectedClubCode={value.clubCode}
              onChange={(code) => {
                const picked = clubs.find((c) => c.code === code);
                onChange({
                  clubCode: code,
                  // detail 호출 응답으로 clubId 가 채워질 때까지 임시로 비움
                  clubId: "",
                  clubName: picked?.name ?? null,
                  membershipId: "",
                  membershipName: null,
                });
              }}
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
              usePortal
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1 text-[12.5px] font-medium text-[#3f3f46]">
            회원권 종류 <span className="text-red-600">*</span>
          </div>
          <select
            value={value.membershipName ?? ""}
            onChange={(e) => {
              const picked = membershipOptions.find(
                (o) => o.name === e.target.value,
              );
              onChange({
                membershipId: picked?.id ?? "",
                membershipName: picked?.name ?? null,
              });
            }}
            disabled={
              !value.clubCode ||
              clubDetailLoading ||
              membershipOptions.length === 0
            }
            className={`h-10 w-full appearance-none rounded-md border bg-white bg-[length:14px_14px] bg-[right_12px_center] bg-no-repeat px-3 pr-8 text-[13.5px] outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
              typeInvalid
                ? "border-red-500 bg-red-50"
                : "border-[#e5e7eb] focus:border-[#3f3f46]"
            }`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
            }}
          >
            <option value="">
              {!value.clubCode
                ? "먼저 골프장을 선택해주세요"
                : clubDetailLoading
                  ? "회원권 목록 불러오는 중..."
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
        </div>
      </div>

      {(courseInvalid || typeInvalid || duplicate) && (
        <div className="mt-2 grid grid-cols-1 gap-3 text-[12px] text-red-600 sm:grid-cols-2">
          <div>{courseInvalid ? "골프장명을 입력해 주세요." : ""}</div>
          <div>
            {duplicate
              ? "이미 등록된 골프장·회원권 조합입니다."
              : typeInvalid
                ? "회원권 종류를 선택해 주세요."
                : ""}
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center gap-1 text-[12.5px] font-medium text-[#3f3f46]">
            상태 <span className="text-red-600">*</span>
          </div>
          <select
            value={value.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="h-10 w-full appearance-none rounded-md border border-[#e5e7eb] bg-white bg-[length:14px_14px] bg-[right_12px_center] bg-no-repeat px-3 pr-8 text-[13.5px] outline-none transition-colors focus:border-[#3f3f46]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1 text-[12.5px] font-medium text-[#3f3f46]">
            수량 <span className="text-red-600">*</span>
          </div>
          <input
            type="number"
            min={1}
            value={value.quantity}
            onChange={(e) => {
              const n = Number(e.target.value);
              onChange({ quantity: Number.isFinite(n) && n >= 1 ? n : 1 });
            }}
            className="h-10 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-right text-[13.5px] tabular-nums outline-none transition-colors focus:border-[#3f3f46]"
          />
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 text-[12.5px] font-medium text-[#3f3f46]">
          메모 <span className="text-[12px] font-normal text-[#99a1af]">선택</span>
        </div>
        <input
          type="text"
          value={value.note}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder="예: 명의이전 완료, 만료 임박 등"
          className="h-10 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[13.5px] outline-none transition-colors placeholder:text-[#99a1af] focus:border-[#3f3f46]"
        />
      </div>

      <div className="mt-3">
        <div className="mb-1.5 text-[12.5px] font-medium text-[#3f3f46]">
          정렬 순서 <span className="text-[12px] font-normal text-[#99a1af]">선택</span>
        </div>
        <input
          type="number"
          min={1}
          value={value.displayOrder}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange({ displayOrder: Number.isFinite(n) && n >= 1 ? n : 1 });
          }}
          className="h-10 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-right text-[13.5px] tabular-nums outline-none transition-colors focus:border-[#3f3f46]"
        />
      </div>
    </div>
  );
}
