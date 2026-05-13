"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { MembershipEntity } from "@heritage-dx/store";

import ClubMembershipFormV2 from "./ClubMembershipFormV2";

type MembershipItem = MembershipEntity;

type MembershipType = "개인" | "법인";

interface ClubMembershipPanelProps {
  memberships: MembershipItem[];
  isSaving?: boolean;
  onCreate: (data: Record<string, unknown>) => Promise<void> | void;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void> | void;
  onRequestDelete: (membership: MembershipItem) => void;
}

export default function ClubMembershipPanel({
  memberships,
  isSaving = false,
  onCreate,
  onUpdate,
  onRequestDelete,
}: ClubMembershipPanelProps) {
  const [segment, setSegment] = useState<MembershipType>("개인");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(
    () => memberships.filter((m) => m.membershipType === segment),
    [memberships, segment],
  );

  const handleAddClick = () => {
    setExpandedId(null);
    setShowAdd(true);
  };

  const handleTagClick = (id: string) => {
    setShowAdd(false);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCreate = async (data: Record<string, unknown>) => {
    await onCreate(data);
    setShowAdd(false);
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    await onUpdate(id, data);
    setExpandedId(null);
  };

  return (
    <div>
      <header className="flex items-center justify-between mb-3.5 px-0.5">
        <div className="inline-flex items-baseline gap-2">
          <h2 className="text-[16px] font-bold tracking-[-0.02em] text-neutral-900 m-0">
            회원권
          </h2>
          <span className="text-[11.5px] font-medium font-mono text-[#888887] px-2 py-0.5 bg-neutral-50 border border-neutral-200 rounded-full">
            {memberships.length}개
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddClick}
          className="inline-flex items-center gap-1.5 h-[34px] px-3.5 bg-primary text-white border border-primary rounded-lg text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-[#1F1F1F]"
        >
          <Plus className="w-3 h-3" strokeWidth={2.2} />
          <span>추가</span>
        </button>
      </header>

      <div className="bg-surface border border-neutral-200 rounded-card px-3.5 py-3 mb-3.5 flex items-center gap-3 flex-wrap">
        <div className="inline-flex p-0.5 bg-neutral-50 border border-neutral-200 rounded-full flex-shrink-0">
          {(["개인", "법인"] as MembershipType[]).map((seg) => {
            const isActive = segment === seg;
            return (
              <button
                key={seg}
                type="button"
                onClick={() => {
                  setSegment(seg);
                  setExpandedId(null);
                }}
                className={`h-7 px-4 text-[12.5px] font-semibold rounded-full transition-colors cursor-pointer ${
                  isActive
                    ? "bg-surface text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {seg}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0 py-0.5">
          {filtered.length === 0 ? (
            <span className="text-[11.5px] text-neutral-400 px-1">
              {segment} 회원권이 없습니다
            </span>
          ) : (
            filtered.map((m) => {
              const isActive = expandedId === m.id;
              const label = m.membershipName || m.membershipType;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleTagClick(m.id)}
                  className={`flex-shrink-0 h-7 px-3 text-[12px] font-medium rounded-full border whitespace-nowrap cursor-pointer transition-colors ${
                    isActive
                      ? "bg-primary text-white border-primary font-semibold"
                      : "bg-surface text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 hover:border-[#DCDCD8]"
                  }`}
                >
                  {label}
                </button>
              );
            })
          )}
        </div>
      </div>

      {showAdd && (
        <article className="bg-surface border border-neutral-900 rounded-card overflow-hidden mb-3">
          <header className="px-[18px] py-3.5 flex items-center gap-3.5 border-b border-neutral-100">
            <div className="w-9 h-9 rounded-[9px] bg-[#F0EEF8] text-[#4D3FAA] grid place-items-center flex-shrink-0">
              <CreditCard className="w-4 h-4" strokeWidth={1.7} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-bold tracking-[-0.02em] text-neutral-900">
                새 회원권 추가
              </div>
              <div className="text-[12px] text-neutral-500">신규 등록</div>
            </div>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              aria-label="닫기"
              className="w-[30px] h-[30px] grid place-items-center rounded-md text-[#888887] hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.7} />
            </button>
          </header>
          <div className="px-[18px] py-4 bg-[#FAFAF9] border-t border-neutral-100">
            <ClubMembershipFormV2
              onSubmit={handleCreate}
              onCancel={() => setShowAdd(false)}
              isLoading={isSaving}
              submitLabel="등록"
            />
          </div>
        </article>
      )}

      {filtered.length === 0 && !showAdd ? (
        <div className="bg-surface border border-neutral-200 rounded-card py-14 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-[12px] bg-neutral-50 text-[#888887] grid place-items-center">
            <CreditCard className="w-6 h-6" strokeWidth={1.6} />
          </div>
          <div className="text-[13.5px] font-semibold text-neutral-800">
            {segment} 회원권이 없습니다
          </div>
          <button
            type="button"
            onClick={handleAddClick}
            className="text-[12px] text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline cursor-pointer"
          >
            새 회원권 등록하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((m) => {
            const isOpen = expandedId === m.id;
            return (
              <article
                key={m.id}
                className={`bg-surface rounded-card overflow-hidden transition-colors border ${
                  isOpen ? "border-neutral-900" : "border-neutral-200"
                }`}
              >
                <header
                  onClick={() => handleTagClick(m.id)}
                  className="px-[18px] py-3.5 flex items-center gap-3.5 cursor-pointer select-none transition-colors hover:bg-[#FBFBFA]"
                >
                  <div className="w-9 h-9 rounded-[9px] bg-[#F0EEF8] text-[#4D3FAA] grid place-items-center flex-shrink-0">
                    <CreditCard className="w-4 h-4" strokeWidth={1.7} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[14.5px] font-bold tracking-[-0.02em] text-neutral-900">
                        {m.membershipType}
                      </span>
                      {m.membershipName && (
                        <span className="text-[12px] text-neutral-500">
                          ({m.membershipName})
                        </span>
                      )}
                      {m.isActive === false && (
                        <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-warning-light text-warning">
                          비활성
                        </span>
                      )}
                    </div>
                    <span className="text-[11.5px] text-[#888887]">
                      {m.membershipType || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDelete(m);
                      }}
                      aria-label="삭제"
                      className="w-[30px] h-[30px] grid place-items-center rounded-md text-[#888887] hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                    >
                      <Trash2 className="w-[15px] h-[15px]" strokeWidth={1.7} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagClick(m.id);
                      }}
                      aria-label={isOpen ? "접기" : "펼치기"}
                      className="w-[30px] h-[30px] grid place-items-center rounded-md text-[#888887] hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                    >
                      <ChevronDown
                        className={`w-[15px] h-[15px] transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        strokeWidth={1.8}
                      />
                    </button>
                  </div>
                </header>
                {isOpen && (
                  <div className="px-[18px] py-4 border-t border-neutral-100 bg-[#FAFAF9]">
                    <ClubMembershipFormV2
                      initialData={m as unknown as MembershipEntity}
                      onSubmit={async (data) => {
                        await handleUpdate(m.id, data);
                      }}
                      onCancel={() => setExpandedId(null)}
                      isLoading={isSaving}
                      submitLabel="수정"
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
