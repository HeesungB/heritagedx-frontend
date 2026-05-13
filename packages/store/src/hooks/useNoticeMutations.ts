"use client";

import { useState } from "react";
import { useNoticeRepository } from "@heritage-dx/api";
import type { NoticeInput } from "@heritage-dx/types";
import { useInvalidate } from "./useInvalidate";

export function useNoticeMutations() {
  const noticeRepo = useNoticeRepository();
  const invalidate = useInvalidate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = async (input: NoticeInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await noticeRepo.create(input);
      if (!response.success) {
        throw new Error(response.error || "공지사항 생성 실패");
      }
      await invalidate("notices");
      return response;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("공지사항 생성 실패");
      setError(e);
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = async (id: string, input: NoticeInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await noticeRepo.update(id, input);
      if (!response.success) {
        throw new Error(response.error || "공지사항 수정 실패");
      }
      await invalidate("notices");
      return response;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("공지사항 수정 실패");
      setError(e);
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await noticeRepo.delete(id);
      if (!response.success) {
        throw new Error(response.error || "공지사항 삭제 실패");
      }
      await invalidate("notices");
      return response;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("공지사항 삭제 실패");
      setError(e);
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { create, update, remove, isSubmitting, error };
}
