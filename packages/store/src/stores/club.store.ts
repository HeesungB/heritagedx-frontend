import { createStore } from "zustand/vanilla";
import type { GeneralRepositories } from "@heritage-dx/api";
import type { FetchStatus } from "../entities/common";
import type { ClubEntity, ClubDetailEntity } from "../entities/club";
import { mapClubDtoToEntity, mapClubDetailDtoToEntity } from "../mappers/club.mapper";

const CLUB_LIST_TTL_MS = 5 * 60 * 1000;
const CLUB_DETAIL_TTL_MS = 5 * 60 * 1000;

function isFresh(lastFetchedAt: number | null, ttlMs: number): boolean {
  if (lastFetchedAt === null) return false;
  return Date.now() - lastFetchedAt < ttlMs;
}

export interface ClubStoreState {
  // State
  clubs: ClubEntity[];
  totalCount: number;
  listStatus: FetchStatus;
  listLastFetchedAt: number | null;

  detailCache: Map<string, ClubDetailEntity>;
  detailFetchedAt: Map<string, number>;
  detailStatus: FetchStatus;
  activeDetailCode: string | null;

  // Actions
  fetchAllClubs: () => Promise<void>;
  fetchClubDetail: (code: string) => Promise<ClubDetailEntity | null>;
  invalidateList: () => void;
  invalidateDetail: (code: string) => void;
  getActiveDetail: () => ClubDetailEntity | null;
  hydrateClubs: (clubs: ClubEntity[], totalCount: number) => void;
  hydrateDetail: (code: string, detail: ClubDetailEntity) => void;
}

export function createClubStore(repos: GeneralRepositories) {
  return createStore<ClubStoreState>((set, get) => ({
    clubs: [],
    totalCount: 0,
    listStatus: "idle",
    listLastFetchedAt: null,

    detailCache: new Map(),
    detailFetchedAt: new Map(),
    detailStatus: "idle",
    activeDetailCode: null,

    fetchAllClubs: async () => {
      const { clubs, listStatus, listLastFetchedAt } = get();

      if (listStatus === "loading" || listStatus === "refreshing") return;

      // TTL 안이면 fetch 스킵 — 현재 메모리 캐시 그대로 사용
      if (clubs.length > 0 && isFresh(listLastFetchedAt, CLUB_LIST_TTL_MS)) {
        return;
      }

      // stale-while-revalidate: 데이터가 있으면 refreshing, 없으면 loading
      set({ listStatus: clubs.length > 0 ? "refreshing" : "loading" });

      try {
        let allClubs: ClubEntity[] = [];
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          const response = await repos.clubs.getAll({ page, limit: 100 });
          if (response.success && response.data) {
            const mapped = response.data.clubs.map(mapClubDtoToEntity);
            allClubs = [...allClubs, ...mapped];
            hasNext = response.data.pagination?.hasNext ?? false;
            page++;
          } else {
            break;
          }
        }

        set({
          clubs: allClubs,
          totalCount: allClubs.length,
          listStatus: "success",
          listLastFetchedAt: Date.now(),
        });
      } catch {
        set({ listStatus: "error" });
      }
    },

    fetchClubDetail: async (code: string) => {
      const { detailCache, detailFetchedAt, detailStatus } = get();
      set({ activeDetailCode: code });

      // 캐시 히트 → 즉시 반환. TTL 안이면 background refresh 도 스킵.
      const cached = detailCache.get(code);
      if (cached) {
        const fetchedAt = detailFetchedAt.get(code) ?? null;
        if (!isFresh(fetchedAt, CLUB_DETAIL_TTL_MS) && detailStatus !== "refreshing") {
          set({ detailStatus: "refreshing" });
          repos.clubs.getOne(code).then((response) => {
            if (response.success && response.data) {
              const entity = mapClubDetailDtoToEntity(response.data);
              set((s) => {
                const newCache = new Map(s.detailCache);
                const newFetched = new Map(s.detailFetchedAt);
                newCache.set(code, entity);
                newFetched.set(code, Date.now());
                return {
                  detailCache: newCache,
                  detailFetchedAt: newFetched,
                  detailStatus: "success",
                };
              });
            }
          }).catch(() => {
            // 백그라운드 실패는 무시 — 기존 캐시 유지
          });
        }
        return cached;
      }

      // 캐시 미스 → loading
      set({ detailStatus: "loading" });
      try {
        const response = await repos.clubs.getOne(code);
        if (response.success && response.data) {
          const entity = mapClubDetailDtoToEntity(response.data);
          set((s) => {
            const newCache = new Map(s.detailCache);
            const newFetched = new Map(s.detailFetchedAt);
            newCache.set(code, entity);
            newFetched.set(code, Date.now());
            return {
              detailCache: newCache,
              detailFetchedAt: newFetched,
              detailStatus: "success",
            };
          });
          return entity;
        }
        set({ detailStatus: "error" });
        return null;
      } catch {
        set({ detailStatus: "error" });
        return null;
      }
    },

    invalidateList: () => {
      set({ listLastFetchedAt: null });
    },

    invalidateDetail: (code: string) => {
      set((s) => {
        const newCache = new Map(s.detailCache);
        const newFetched = new Map(s.detailFetchedAt);
        newCache.delete(code);
        newFetched.delete(code);
        return { detailCache: newCache, detailFetchedAt: newFetched };
      });
    },

    getActiveDetail: () => {
      const { activeDetailCode, detailCache } = get();
      if (!activeDetailCode) return null;
      return detailCache.get(activeDetailCode) ?? null;
    },

    hydrateClubs: (clubs: ClubEntity[], totalCount: number) => {
      set({
        clubs,
        totalCount,
        listStatus: "success",
        listLastFetchedAt: Date.now(),
      });
    },

    hydrateDetail: (code: string, detail: ClubDetailEntity) => {
      set((s) => {
        const newCache = new Map(s.detailCache);
        const newFetched = new Map(s.detailFetchedAt);
        newCache.set(code, detail);
        newFetched.set(code, Date.now());
        return {
          detailCache: newCache,
          detailFetchedAt: newFetched,
          detailStatus: "success",
          activeDetailCode: code,
        };
      });
    },
  }));
}

export type ClubStore = ReturnType<typeof createClubStore>;
