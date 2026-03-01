import { createStore } from "zustand/vanilla";
import type { GeneralRepositories } from "@heritage-dx/api";
import type { FetchStatus } from "../entities/common";
import type { ClubEntity, ClubDetailEntity } from "../entities/club";
import { mapClubDtoToEntity, mapClubDetailDtoToEntity } from "../mappers/club.mapper";

export interface ClubStoreState {
  // State
  clubs: ClubEntity[];
  totalCount: number;
  listStatus: FetchStatus;

  detailCache: Map<string, ClubDetailEntity>;
  detailStatus: FetchStatus;
  activeDetailCode: string | null;

  // Actions
  fetchAllClubs: () => Promise<void>;
  fetchClubDetail: (code: string) => Promise<ClubDetailEntity | null>;
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

    detailCache: new Map(),
    detailStatus: "idle",
    activeDetailCode: null,

    fetchAllClubs: async () => {
      const { clubs, listStatus } = get();

      // stale-while-revalidate: 데이터가 있으면 refreshing, 없으면 loading
      if (listStatus === "loading" || listStatus === "refreshing") return;
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
        });
      } catch {
        set({ listStatus: "error" });
      }
    },

    fetchClubDetail: async (code: string) => {
      const { detailCache, detailStatus } = get();
      set({ activeDetailCode: code });

      // 캐시 히트 → 즉시 반환 + 백그라운드 갱신
      const cached = detailCache.get(code);
      if (cached) {
        if (detailStatus !== "refreshing") {
          set({ detailStatus: "refreshing" });
          // 백그라운드 refresh
          repos.clubs.getOne(code).then((response) => {
            if (response.success && response.data) {
              const entity = mapClubDetailDtoToEntity(response.data);
              set((s) => {
                const newCache = new Map(s.detailCache);
                newCache.set(code, entity);
                return { detailCache: newCache, detailStatus: "success" };
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
            newCache.set(code, entity);
            return { detailCache: newCache, detailStatus: "success" };
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

    invalidateDetail: (code: string) => {
      set((s) => {
        const newCache = new Map(s.detailCache);
        newCache.delete(code);
        return { detailCache: newCache };
      });
    },

    getActiveDetail: () => {
      const { activeDetailCode, detailCache } = get();
      if (!activeDetailCode) return null;
      return detailCache.get(activeDetailCode) ?? null;
    },

    hydrateClubs: (clubs: ClubEntity[], totalCount: number) => {
      set({ clubs, totalCount, listStatus: "success" });
    },

    hydrateDetail: (code: string, detail: ClubDetailEntity) => {
      set((s) => {
        const newCache = new Map(s.detailCache);
        newCache.set(code, detail);
        return { detailCache: newCache, detailStatus: "success", activeDetailCode: code };
      });
    },
  }));
}

export type ClubStore = ReturnType<typeof createClubStore>;
