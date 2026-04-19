"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useClubRepository,
  useConsultationAdminRepository,
  useMembershipTradeAdminRepository,
} from "@heritage-dx/api";
import type { Club, Consultation, MembershipTrade, Pagination } from "@heritage-dx/types";

interface PreloadedMemos {
  trades: Consultation[];
  pagination: Pagination;
}

interface PreloadedRecords {
  trades: MembershipTrade[];
  pagination: Pagination;
}

interface DataContextType {
  clubs: Club[];
  isLoadingClubs: boolean;
  refreshClubs: () => Promise<void>;

  preloadedMemos: PreloadedMemos | null;
  clearPreloadedMemos: () => void;

  preloadedRecords: PreloadedRecords | null;
  clearPreloadedRecords: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const clubsRepo = useClubRepository();
  const consultationsRepo = useConsultationAdminRepository();
  const membershipTradesRepo = useMembershipTradeAdminRepository();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);

  const [preloadedMemos, setPreloadedMemos] = useState<PreloadedMemos | null>(
    null,
  );
  const [preloadedRecords, setPreloadedRecords] =
    useState<PreloadedRecords | null>(null);

  const hasLoadedRef = useRef(false);

  const loadAllClubs = useCallback(async () => {
    setIsLoadingClubs(true);
    try {
      const LIMIT = 100;

      // 1. 첫 페이지 — totalPages 로 남은 페이지 수 계산 (1-6)
      const first = await clubsRepo.getAll({ page: 1, limit: LIMIT });
      if (!first.success || !first.data) {
        setClubs([]);
        return;
      }

      const firstClubs = first.data.clubs || [];
      const totalPages = first.data.pagination?.totalPages ?? 1;

      if (totalPages <= 1) {
        setClubs(firstClubs);
        return;
      }

      // 2. 나머지 페이지를 병렬 fetch — 순차 waterfall 제거
      const remaining = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          clubsRepo.getAll({ page: i + 2, limit: LIMIT }),
        ),
      );

      const allClubs: Club[] = [
        ...firstClubs,
        ...remaining.flatMap((res) =>
          res.success && res.data ? res.data.clubs || [] : [],
        ),
      ];

      setClubs(allClubs);
    } catch (error) {
      console.error("Failed to load clubs:", error);
    }
    setIsLoadingClubs(false);
  }, [clubsRepo]);

  const refreshClubs = useCallback(async () => {
    await loadAllClubs();
  }, [loadAllClubs]);

  const clearPreloadedMemos = useCallback(() => {
    setPreloadedMemos(null);
  }, []);

  const clearPreloadedRecords = useCallback(() => {
    setPreloadedRecords(null);
  }, []);

  // user가 확인되면 골프장 로드 → 완료 후 거래 메모/내역 프리로드
  useEffect(() => {
    if (!user || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    (async () => {
      // 1. 골프장 전체 로드
      await loadAllClubs();

      // 2. 거래 메모 page 1 + 거래 내역 page 1 병렬 프리로드
      const [memosRes, recordsRes] = await Promise.allSettled([
        consultationsRepo.getAll({
          page: 1,
          limit: 20,
          sort: "registrationDate",
          order: "DESC",
        }),
        membershipTradesRepo.getAll({
          page: 1,
          limit: 20,
          sort: "contractDate",
          order: "DESC",
        }),
      ]);

      if (
        memosRes.status === "fulfilled" &&
        memosRes.value.success &&
        memosRes.value.data
      ) {
        setPreloadedMemos({
          trades: memosRes.value.data.trades || [],
          pagination: memosRes.value.data.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        });
      }

      if (
        recordsRes.status === "fulfilled" &&
        recordsRes.value.success &&
        recordsRes.value.data
      ) {
        setPreloadedRecords({
          trades: recordsRes.value.data.trades || [],
          pagination: recordsRes.value.data.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
    })();
  }, [user, loadAllClubs, consultationsRepo, membershipTradesRepo]);

  return (
    <DataContext.Provider
      value={{
        clubs,
        isLoadingClubs,
        refreshClubs,
        preloadedMemos,
        clearPreloadedMemos,
        preloadedRecords,
        clearPreloadedRecords,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
