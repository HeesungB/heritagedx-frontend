"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "방금 전";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;

  return `${Math.floor(months / 12)}년 전`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    pagination,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleNotificationClick = async (
    id: string,
    isRead: boolean,
    tradeId?: string | null
  ) => {
    if (!isRead) {
      await markAsRead(id);
    }
    router.push(tradeId ? `/trade-memos?memoId=${tradeId}` : "/trade-memos");
  };

  const handlePageChange = (page: number) => {
    fetchNotifications(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">알림</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">
                읽지 않은 알림 {unreadCount}건
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            모두 읽음
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && notifications.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm">알림이 없습니다</p>
        </div>
      )}

      {/* Notification list */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id, notification.isRead, notification.tradeId)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                notification.isRead
                  ? "bg-white border-gray-200 hover:bg-gray-50"
                  : "bg-blue-50 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Unread dot */}
                <div className="pt-1.5 shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      notification.isRead ? "bg-transparent" : "bg-blue-500"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      notification.isRead
                        ? "text-gray-700"
                        : "text-gray-900 font-semibold"
                    }`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 whitespace-pre-line">
                    {notification.body}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
          <span className="text-sm text-gray-500 px-2">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
