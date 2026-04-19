"use client";

import { useCallback, useState } from "react";
import { useAppStores } from "@/stores";
import { useCustomers } from "@heritage-dx/store";

export interface PendingCustomer {
  name: string;
  contact: string;
}

export interface EnsureResult {
  ok: boolean;
  errorMessage?: string;
}

export function useCustomerEnsureFlow() {
  const { customer: customerStore } = useAppStores();
  const { create, searchByQuery } = useCustomers(customerStore);

  const [pending, setPending] = useState<PendingCustomer | null>(null);
  const [processing, setProcessing] = useState(false);

  const requestEnsure = useCallback((data: PendingCustomer) => {
    setPending(data);
  }, []);

  const cancel = useCallback(() => {
    setPending(null);
  }, []);

  const confirm = useCallback(async (): Promise<EnsureResult> => {
    if (!pending) return { ok: false, errorMessage: "등록할 고객 정보가 없습니다." };
    setProcessing(true);
    try {
      const result = await create({
        name: pending.name,
        contact: pending.contact,
      });
      if (result.success) {
        return { ok: true };
      }
      if (result.conflict) {
        const matches = await searchByQuery(pending.contact, 5);
        const matched = matches.find(
          (c) => c.contact.replace(/\D/g, "") === pending.contact.replace(/\D/g, ""),
        );
        if (matched) {
          return { ok: true };
        }
      }
      return {
        ok: false,
        errorMessage: result.errorMessage ?? "고객 등록에 실패했습니다.",
      };
    } finally {
      setProcessing(false);
      setPending(null);
    }
  }, [pending, create, searchByQuery]);

  return {
    pending,
    processing,
    requestEnsure,
    confirm,
    cancel,
  };
}
