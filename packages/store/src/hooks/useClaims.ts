"use client";

import { useState } from "react";
import { useClaimRepository } from "@heritage-dx/api";
import type { ClaimInput } from "@heritage-dx/types";

export function useClaims() {
  const claimRepo = useClaimRepository();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = async (data: ClaimInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await claimRepo.create(data);
      if (!response.success) {
        throw new Error(response.error || "클레임 제출 실패");
      }
      return response;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("클레임 제출 실패");
      setError(e);
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error };
}
