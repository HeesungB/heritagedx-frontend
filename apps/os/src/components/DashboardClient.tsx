"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { Button, Loading, Modal } from "@heritage-dx/ui";
import { Notice, NoticeForm } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useNotices, useNoticeMutations, canManageOrg } from "@heritage-dx/store";

const emptyForm: NoticeForm = {
  title: "",
  content: "",
};

export default function DashboardClient() {
  const { user } = useAuth();
  const isAdmin = canManageOrg(user);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NoticeForm>(emptyForm);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");

  // 검색 디바운스 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: notices, pagination, isLoading: loading, refetch: fetchNotices } = useNotices({
    page,
    limit: 20,
    order: sortOrder,
    ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
  });
  const totalPages = pagination?.totalPages ?? 1;

  const { create: createNotice, update: updateNotice, remove: removeNotice, isSubmitting: submitting } = useNoticeMutations();

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
    setForm({
      title: notice.title || "",
      content: notice.content || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    setErrorMessage(null);
    try {
      await removeNotice(id);
      setDeleteConfirmId(null);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <Header clubName={null} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 py-6 max-w-5xl mx-auto">
          {/* 골프장 바로가기 카드 */}
          <Link
            href="/clubs"
            className="block bg-white rounded-lg border border-gray-200 p-6 mb-6 hover:border-gray-400 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">골프장 정보</h3>
                  <p className="text-sm text-gray-500">골프장 상세 정보, 회원권, 서류 관리</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* 공지사항 섹션 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* 섹션 헤더 */}
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">공지사항</h2>
                    <p className="text-sm text-gray-500 mt-0.5">사내 공지사항을 관리합니다</p>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    onClick={() => { setShowForm(true); setEditingNotice(null); setForm(emptyForm); }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    새 공지
                  </Button>
                )}
              </div>
            </div>

            {/* 필터 바 */}
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                {/* 검색 */}
                <div className="flex-1 min-w-[200px] relative">
                  <input
                    type="text"
                    placeholder="제목, 내용 검색"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* 정렬 */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "DESC" | "ASC")}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                >
                  <option value="DESC">최신순</option>
                  <option value="ASC">오래된순</option>
                </select>
              </div>
            </div>

            {/* 작성/수정 폼 */}
            {isAdmin && showForm && (
              <div className="px-5 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">
                    {editingNotice ? "공지사항 수정" : "새 공지사항 작성"}
                  </h3>
                  <button onClick={handleCancelForm} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                      <span className="text-red-700 flex-1">{errorMessage}</span>
                      <button type="button" onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                      placeholder="공지사항 제목을 입력하세요"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">내용 <span className="text-red-500">*</span></label>
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 min-h-[120px] resize-y"
                      placeholder="공지사항 내용을 입력하세요"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handleCancelForm}>취소</Button>
                    <Button type="submit" disabled={submitting} isLoading={submitting}>{editingNotice ? "수정" : "저장"}</Button>
                  </div>
                </form>
              </div>
            )}

            {/* 공지사항 목록 */}
            <div>
              {loading ? (
                <div className="py-20 flex justify-center"><Loading text="로딩 중..." /></div>
              ) : notices.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-gray-400 mb-3">등록된 공지사항이 없습니다</p>
                  {isAdmin && (
                    <button
                      onClick={() => { setShowForm(true); setEditingNotice(null); setForm(emptyForm); }}
                      className="text-sm text-gray-600 underline hover:text-gray-900"
                    >
                      새 공지사항 작성하기
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-16">No</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-left">제목</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 text-center w-28">작성일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {notices.map((notice, index) => {
                      const rowNumber = (totalPages * 20) - ((page - 1) * 20 + index);
                      return (
                        <tr
                          key={notice.id}
                          onClick={() => setSelectedNotice(notice)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 text-sm text-gray-500 text-center">{rowNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{notice.title}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 text-center whitespace-nowrap">{formatDate(notice.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 공지사항 상세 모달 */}
      <Modal
        isOpen={!!selectedNotice}
        onClose={() => { setSelectedNotice(null); setDeleteConfirmId(null); }}
        title={selectedNotice?.title || ""}
        size="lg"
        footer={isAdmin ? (
          <>
            <Button variant="outline" size="sm" onClick={() => { handleEdit(selectedNotice!); setSelectedNotice(null); }}>
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              수정
            </Button>
            {deleteConfirmId === selectedNotice?.id ? (
              <>
                <Button variant="danger" size="sm" onClick={() => { handleDelete(selectedNotice!.id); setSelectedNotice(null); }}>삭제</Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>취소</Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(selectedNotice!.id)} className="text-red-600 hover:bg-red-50">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </Button>
            )}
          </>
        ) : undefined}
      >
        {selectedNotice && (
          <>
            <p className="text-xs text-gray-500 mb-3">{formatDate(selectedNotice.createdAt)}</p>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {selectedNotice.content}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
