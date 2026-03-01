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
  useConsultationRepository,
  useMembershipTradeRepository,
} from "@heritage-dx/api";
import { Club, TradeMemo, TradeRecord } from "@/types";

interface PreloadedMemos {
  trades: TradeMemo[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface PreloadedRecords {
  trades: TradeRecord[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
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
  const consultationsRepo = useConsultationRepository();
  const membershipTradesRepo = useMembershipTradeRepository();

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
      let allClubs: Club[] = [];
      let page = 1;
      let hasNext = true;

      while (hasNext) {
        const response = await clubsRepo.getAll({ page, limit: 100 });
        if (response.success && response.data) {
          allClubs = [...allClubs, ...(response.data.clubs || [])];
          hasNext = response.data.pagination?.hasNext ?? false;
          page++;
        } else {
          break;
        }
      }

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
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 20,
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
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 20,
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
