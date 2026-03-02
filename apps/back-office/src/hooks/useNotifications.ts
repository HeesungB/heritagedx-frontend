"use client";

import { useState, useEffect, useCallback } from "react";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  clubName: string;
  tradeType: string;
  customerName: string;
  membershipType: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<NotificationPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?page=1&limit=50");
      if (!res.ok) return;
      const data = await res.json();
      const unread = (data.notifications as NotificationItem[]).filter((n) => !n.isRead).length;
      // 50건 중 unread 수 — 전체 unread가 50 이상이면 근사치
      setUnreadCount(unread);
    } catch {
      // ignore
    }
  }, []);

  const fetchNotifications = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${page}&limit=20`);
      if (!res.ok) {
        // 빈 상태로 처리 (컬렉션 미존재 등)
        setNotifications([]);
        setPagination(null);
        return;
      }
      const data = await res.json();
      setNotifications(data.notifications);
      setPagination(data.pagination);
      // unreadCount도 갱신
      const unread = (data.notifications as NotificationItem[]).filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // 낙관적 업데이트
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
      // 실패 시 롤백
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // 낙관적 업데이트
    const prevNotifications = notifications;
    const prevUnreadCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      // 실패 시 롤백
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
    }
  }, [notifications, unreadCount]);

  // 마운트 시 unreadCount 조회
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // FCM 포그라운드 알림 수신 시 자동 갱신
  useEffect(() => {
    const handler = () => {
      refreshUnreadCount();
    };
    window.addEventListener("fcm-notification-received", handler);
    return () => window.removeEventListener("fcm-notification-received", handler);
  }, [refreshUnreadCount]);

  return {
    unreadCount,
    refreshUnreadCount,
    notifications,
    pagination,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
