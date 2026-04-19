"use client";

import { useState } from "react";
import { useAdminRepositories } from "@heritage-dx/api";
import type { UserCreateInput, UserUpdateInput } from "@heritage-dx/types";

export function useUserMutations() {
  const { users: usersRepo } = useAdminRepositories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = async (data: UserCreateInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await usersRepo.create(data);
      if (!response.success) {
        throw new Error(response.error || "사용자 생성 실패");
      }
      return response;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("사용자 생성 실패");
      setError(e);
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = async (id: string, data: UserUpdateInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await usersRepo.update(id, data);
      if (!response.success) {
        throw new Error(response.error || "사용자 수정 실패");
      }
      return response;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("사용자 수정 실패");
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
      const response = await usersRepo.delete(id);
      if (!response.success) {
        throw new Error(response.error || "사용자 삭제 실패");
      }
      return response;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("사용자 삭제 실패");
      setError(e);
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (id: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await usersRepo.resetPassword(id);
      if (!response.success) {
        throw new Error(response.error || "비밀번호 초기화 실패");
      }
      return response;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("비밀번호 초기화 실패");
      setError(e);
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { create, update, remove, resetPassword, isSubmitting, error };
}
