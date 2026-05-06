"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MembershipTrade } from "@/types";
import type { OrganizationEntity } from "@/types/organization";

// 양식 모든 필드를 단일 string Record 로 직렬화하여 저장/편집한다.
// 키는 ApprovalRequestSheet 의 셀이 직접 참조하는 식별자. 새 필드 추가 시 컴포넌트와 디폴트 산출 로직만 수정하면 된다.
export type ApprovalSheetOverrides = Record<string, string>;

interface ApprovalSheetData {
  overrides: ApprovalSheetOverrides;
}

function getStorageKey(consultationId: string) {
  return `hdx:approval-sheet:${consultationId}`;
}

function loadData(consultationId: string): ApprovalSheetData {
  if (typeof window === "undefined") return { overrides: {} };
  try {
    const raw = localStorage.getItem(getStorageKey(consultationId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { overrides: parsed.overrides || {} };
    }
  } catch {
    /* ignore */
  }
  return { overrides: {} };
}

function formatDateDot(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function todayDot(): string {
  const d = new Date();
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function num(value: number | null | undefined): string {
  if (value == null || value === 0) return "";
  return String(value);
}

export function computeApprovalSheetDefaults(
  trade: MembershipTrade | null,
  currentUserName?: string,
  organization?: OrganizationEntity | null,
): ApprovalSheetOverrides {
  if (!trade) return {};

  const isSell = trade.tradeType === "매도";
  const company = organization?.businessName || organization?.name || "";
  const membershipName = `${trade.clubName ?? ""} ${trade.membershipType ?? ""}`.trim();
  const date = formatDateDot(trade.tradeDate) || formatDateDot(trade.registrationDate) || todayDot();

  const base: ApprovalSheetOverrides = {
    companyName: company,
    date,
    membershipName,
    sellManager: "",
    sellCompany: "",
    sellContact: "",
    buyManager: "",
    buyCompany: "",
    buyContact: "",
    remarks: trade.remarks ?? "",
    inBankHolder: company,
    // 기본 자사 입금계좌
    inBank: organization?.depositAccount ? "" : "",
    inAccount: organization?.depositAccount ?? "",
  };

  if (isSell) {
    // 자사가 매도자(고객) 로부터 회원권을 사 오는 케이스 — 출금 섹션을 자기 쪽으로 매핑
    base.sellManager = currentUserName ?? "";
    base.sellCompany = trade.customerName ?? "";
    base.sellContact = trade.contact ?? "";
    base.outAmount = num(trade.offerPrice);
    base.outDeposit = num(trade.depositAmount);
    base.outDepositDate = formatDateDot(trade.tradeDate);
    base.outBankHolder = trade.customerName ?? "";
    base.outAccount = trade.accountNumber ?? "";
  } else {
    base.buyManager = currentUserName ?? "";
    base.buyCompany = trade.customerName ?? "";
    base.buyContact = trade.contact ?? "";
    base.inAmount = num(trade.offerPrice);
    base.inDeposit = num(trade.depositAmount);
    base.inDepositDate = formatDateDot(trade.tradeDate);
  }

  return base;
}

interface UseApprovalSheetStorageReturn {
  overrides: ApprovalSheetOverrides;
  setOverride: (key: string, value: string) => void;
  reset: () => void;
}

export function useApprovalSheetStorage(
  trade: MembershipTrade | null,
  currentUserName?: string,
  organization?: OrganizationEntity | null,
): UseApprovalSheetStorageReturn {
  const [overrides, setOverrides] = useState<ApprovalSheetOverrides>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIdRef = useRef<string | null>(null);

  // 디폴트 매핑은 trade/user/org 변할 때만 새로 계산. 저장값이 있으면 디폴트 위에 머지한다.
  useEffect(() => {
    if (!trade) {
      setOverrides({});
      currentIdRef.current = null;
      return;
    }
    currentIdRef.current = trade.id;
    const defaults = computeApprovalSheetDefaults(trade, currentUserName, organization);
    const stored = loadData(trade.id).overrides;
    setOverrides({ ...defaults, ...stored });
  }, [trade, currentUserName, organization]);

  const scheduleSave = useCallback((next: ApprovalSheetOverrides) => {
    if (typeof window === "undefined") return;
    const id = currentIdRef.current;
    if (!id) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(getStorageKey(id), JSON.stringify({ overrides: next }));
      } catch {
        /* quota/serialize error 는 무시 — draft 손실만 발생 */
      }
    }, 300);
  }, []);

  const setOverride = useCallback(
    (key: string, value: string) => {
      setOverrides((prev) => {
        const next = { ...prev, [key]: value };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const reset = useCallback(() => {
    const id = currentIdRef.current;
    if (id && typeof window !== "undefined") {
      try {
        localStorage.removeItem(getStorageKey(id));
      } catch {
        /* ignore */
      }
    }
    if (trade) {
      setOverrides(computeApprovalSheetDefaults(trade, currentUserName, organization));
    } else {
      setOverrides({});
    }
  }, [trade, currentUserName, organization]);

  return { overrides, setOverride, reset };
}
