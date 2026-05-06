"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Megaphone,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button, Loading, Modal } from "@heritage-dx/ui";
import { Notice, NoticeForm } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  useNotices,
  useNoticeMutations,
  useRecentSearches,
  canManageOrg,
} from "@heritage-dx/store";

const emptyForm: NoticeForm = {
  title: "",
  content: "",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function DashboardClient() {
  const { user } = useAuth();
  const isAdmin = canManageOrg(user);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NoticeForm>(emptyForm);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const PAGE_SIZE = 6;
  const {
    data: notices,
    pagination,
    isLoading: loading,
    refetch: fetchNotices,
  } = useNotices({
    page,
    limit: PAGE_SIZE,
    order: sortOrder,
    ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
  });
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.total ?? notices.length;

  const {
    create: createNotice,
    update: updateNotice,
    remove: removeNotice,
    isSubmitting: submitting,
  } = useNoticeMutations();

  const { recents: recentClubs, remove: removeRecentClub, clear: clearRecentClubs } =
    useRecentSearches("clubs", 10);

  const heroNotice = notices[0] ?? null;
  const restNotices = notices.slice(1);
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalItems);

  const openForm = () => {
    setShowForm(true);
    setEditingNotice(null);
    setForm(emptyForm);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      if (editingNotice) {
        await updateNotice(editingNotice.id, form);
      } else {
        await createNotice(form);
      }
      setEditingNotice(null);
      setForm(emptyForm);
      setShowForm(false);
      await fetchNotices();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setErrorMessage(null);
    setForm({ title: notice.title || "", content: notice.content || "" });
    setShowForm(true);
    setSelectedNotice(null);
    setConfirmDelete(false);
  };

  const handleDelete = async (id: string) => {
    setErrorMessage(null);
    try {
      await removeNotice(id);
      setSelectedNotice(null);
      setConfirmDelete(false);
      await fetchNotices();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingNotice(null);
    setForm(emptyForm);
    setErrorMessage(null);
  };

  const closeSlide = () => {
    setSelectedNotice(null);
    setConfirmDelete(false);
  };

  return (
    <div className="h-[calc(100vh-57px)] overflow-hidden bg-[#f5f5f5] p-6">
      <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[30%_1fr]">
        {/* LEFT — 골프장 정보 hub */}
        <section className="relative flex flex-col overflow-hidden rounded-2xl bg-[#0a0a0a] p-6 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 70%)",
            }}
          />

          <Link href="/clubs" className="group flex flex-col text-white no-underline">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-white/10 bg-white/5">
              <Flag className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div className="mt-6">
              <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em]">
                골프장 정보
              </h2>
              <p className="mt-2.5 text-[12.5px] leading-[1.6] text-white/70">
                등록된 골프장 검색, 상세 정보, 회원권과 서류를 한 곳에서 관리합니다.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3.5 text-[13px] font-medium">
              <span>골프장 검색으로 이동</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0a0a0a] transition-transform group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </span>
            </div>
          </Link>

          {/* 최근 검색한 골프장 */}
          <div className="relative mt-5 border-t border-dashed border-white/10 pt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-white/50">
                <Clock className="h-3 w-3" strokeWidth={1.8} />
                최근 검색한 골프장
              </span>
              {recentClubs.length > 0 && (
                <button
                  type="button"
                  onClick={clearRecentClubs}
                  className="rounded px-1.5 py-0.5 text-[11px] text-white/45 hover:bg-white/5 hover:text-white/85"
                >
                  모두 지우기
                </button>
              )}
            </div>
            {recentClubs.length === 0 ? (
              <p className="px-2.5 py-2 text-[12px] leading-relaxed text-white/40">
                최근 검색한 골프장이 없습니다.
              </p>
            ) : (
              <ul className="-mx-2.5 list-none">
                {recentClubs.map((c) => (
                  <li key={c.value}>
                    <Link
                      href={`/clubs?club=${encodeURIComponent(c.value)}`}
                      className="group flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors hover:bg-white/5"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[13px] font-medium tracking-[-0.005em] text-white">
                          {c.label}
                        </span>
                        {c.kind && (
                          <span className="mt-0.5 truncate text-[11px] text-white/45">
                            {c.kind}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeRecentClub(c.value);
                        }}
                        aria-label={`${c.label} 최근 항목 제거`}
                        className="ml-3 flex-shrink-0 rounded p-0.5 text-white/30 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-white/80"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* RIGHT — 공지사항 카드 */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_0_rgba(0,0,0,0.1)]">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#f9fafb]">
                <Megaphone className="h-5 w-5 text-[#0a0a0a]" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[#0a0a0a]">
                  공지사항
                </h2>
                <p className="mt-1 text-[13px] tracking-[-0.005em] text-[#6a7282]">
                  시스템 업데이트와 주요 안내 사항을 확인하세요.
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={openForm}
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a1a1a]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />새 공지
              </button>
            )}
          </div>

          {/* 툴바 */}
          <div className="flex gap-3 px-6 pb-4 pt-1">
            <div className="flex h-10 flex-1 items-center gap-2.5 rounded-[10px] bg-[#f9fafb] px-4">
              <Search className="h-3.5 w-3.5 text-[#99a1af]" strokeWidth={1.8} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="제목, 내용 검색"
                className="flex-1 border-0 bg-transparent text-[13px] text-[#0a0a0a] placeholder:text-[#0a0a0a66] focus:outline-none"
              />
            </div>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "DESC" | "ASC")}
                className="h-10 cursor-pointer appearance-none rounded-[10px] bg-[#f9fafb] pl-4 pr-9 text-[13px] text-[#364153] focus:outline-none"
              >
                <option value="DESC">최신순</option>
                <option value="ASC">오래된순</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6a7282]"
                strokeWidth={1.8}
              />
            </div>
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loading text="로딩 중..." />
              </div>
            ) : notices.length === 0 ? (
              <div className="py-20 text-center">
                <p className="mb-3 text-[#9ca3af]">등록된 공지사항이 없습니다</p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openForm}
                    className="text-sm text-[#4a5568] underline hover:text-[#0a0a0a]"
                  >
                    새 공지사항 작성하기
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Hero — 최신 1건 */}
                {heroNotice && (
                  <button
                    type="button"
                    onClick={() => setSelectedNotice(heroNotice)}
                    className={[
                      "mx-6 mb-2 block w-[calc(100%-3rem)] rounded-[14px] border border-[#f3f4f6] p-5 text-left transition-colors",
                      selectedNotice?.id === heroNotice.id
                        ? "bg-[#f3f4f6]"
                        : "bg-gradient-to-b from-[#fafafa] to-[#f5f5f5] hover:from-[#f5f5f5] hover:to-[#ededed]",
                    ].join(" ")}
                  >
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d4e9d4] px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] text-[#2f5a3f]">
                        <Pin className="h-2.5 w-2.5" strokeWidth={2} />
                        최신
                      </span>
                      <span className="text-[12px] tabular-nums text-[#6a7282]">
                        {formatDate(heroNotice.createdAt)}
                      </span>
                    </div>
                    <div className="mb-1.5 line-clamp-2 text-[17px] font-semibold leading-[1.4] tracking-[-0.01em] text-[#0a0a0a]">
                      {heroNotice.title}
                    </div>
                    <div className="line-clamp-1 text-[13px] leading-[1.55] text-[#6a7282]">
                      {heroNotice.content}
                    </div>
                  </button>
                )}

                {/* 일반 리스트 */}
                <div className="px-4 pb-2">
                  {restNotices.map((n, i) => (
                    <button
                      type="button"
                      key={n.id}
                      onClick={() => setSelectedNotice(n)}
                      className={[
                        "grid w-full grid-cols-[60px_1fr_100px_16px] items-center gap-4 rounded-xl p-4 text-left transition-colors",
                        selectedNotice?.id === n.id
                          ? "bg-[#f3f4f6]"
                          : "hover:bg-[#f9fafb]",
                      ].join(" ")}
                    >
                      <div className="text-[12px] font-medium tabular-nums text-[#99a1af]">
                        No. {totalItems - ((page - 1) * PAGE_SIZE + i + 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1 truncate text-[14px] font-medium tracking-[-0.005em] text-[#0a0a0a]">
                          {n.title}
                        </div>
                        <div className="truncate text-[12px] text-[#6a7282]">
                          {n.content}
                        </div>
                      </div>
                      <div className="text-right text-[12px] tabular-nums text-[#6a7282]">
                        {formatDate(n.createdAt)}
                      </div>
                      <ChevronRight
                        className="h-3.5 w-3.5 text-[#99a1af]"
                        strokeWidth={1.8}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 푸터 — 페이지네이션 */}
          {!loading && notices.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#f3f4f6] px-8 py-4">
              <div className="text-[12px] text-[#6a7282]">
                {rangeStart}–{rangeEnd} / {totalItems}건
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="이전 페이지"
                  className="grid h-8 w-8 place-items-center rounded-[10px] text-[#4a5568] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // 단순 1..min(totalPages,5) 표시
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={[
                        "h-8 min-w-8 rounded-[10px] px-2 text-[13px] font-medium",
                        pageNum === page
                          ? "bg-[#0a0a0a] text-white"
                          : "bg-transparent text-[#364153] hover:bg-[#f3f4f6]",
                      ].join(" ")}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="다음 페이지"
                  className="grid h-8 w-8 place-items-center rounded-[10px] text-[#4a5568] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 상세 슬라이드 패널 */}
      {selectedNotice && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            style={{ animation: "dx-fade-in .15s ease-out" }}
            onClick={closeSlide}
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 flex w-[420px] max-w-[92vw] flex-col bg-white p-6 shadow-[-8px_0_24px_-8px_rgba(0,0,0,0.12)]"
            style={{ animation: "dx-slide-in .22s cubic-bezier(.2,.7,.3,1)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[12px] tabular-nums text-[#6a7282]">
                {formatDate(selectedNotice.createdAt)}
              </div>
              <button
                type="button"
                onClick={closeSlide}
                aria-label="닫기"
                className="grid h-8 w-8 place-items-center rounded-lg text-[#4a5568] hover:bg-[#f3f4f6]"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
            <h3 className="mb-4 text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] text-[#0a0a0a]">
              {selectedNotice.title}
            </h3>
            <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-[14px] leading-[1.7] text-[#364153]">
              {selectedNotice.content}
            </div>
            {isAdmin && (
              <div className="flex justify-end gap-2 border-t border-[#f3f4f6] pt-4">
                <button
                  type="button"
                  onClick={() => handleEdit(selectedNotice)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-transparent px-4 text-[13px] font-medium text-[#364153] hover:bg-[#f3f4f6]"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                  수정
                </button>
                {confirmDelete ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="inline-flex h-10 items-center rounded-[10px] bg-transparent px-4 text-[13px] font-medium text-[#364153] hover:bg-[#f3f4f6]"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedNotice.id)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#fef2f2] px-4 text-[13px] font-medium text-[#b91c1c] hover:bg-[#fee2e2]"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      정말 삭제
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#fef2f2] px-4 text-[13px] font-medium text-[#b91c1c] hover:bg-[#fee2e2]"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                    삭제
                  </button>
                )}
              </div>
            )}
          </aside>
          <style jsx global>{`
            @keyframes dx-fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes dx-slide-in {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}

      {/* 공지 작성/수정 모달 */}
      <Modal
        isOpen={showForm}
        onClose={handleCancelForm}
        title={editingNotice ? "공지사항 수정" : "새 공지사항 작성"}
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={handleCancelForm}>
              취소
            </Button>
            <Button
              type="submit"
              form="notice-form"
              disabled={submitting}
              isLoading={submitting}
            >
              {editingNotice ? "수정" : "저장"}
            </Button>
          </>
        }
      >
        <form id="notice-form" onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
              <span className="flex-1 text-red-700">{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="shrink-0 text-red-400 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              placeholder="공지사항 제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="min-h-[160px] w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              placeholder="공지사항 내용을 입력하세요"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
