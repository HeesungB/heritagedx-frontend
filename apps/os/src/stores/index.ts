"use client";

import { useMemo } from "react";
import { useGeneralRepositories } from "@heritage-dx/api";
import {
  createClubStore,
  createTradeMemoStore,
  createTradeRecordStore,
} from "@heritage-dx/store";
import type { ClubStore, TradeMemoStore, TradeRecordStore } from "@heritage-dx/store";

interface AppStores {
  club: ClubStore;
  tradeMemo: TradeMemoStore;
  tradeRecord: TradeRecordStore;
}

let cachedStores: AppStores | null = null;

export function useAppStores(): AppStores {
  const repos = useGeneralRepositories();

  return useMemo(() => {
    if (!cachedStores) {
      cachedStores = {
        club: createClubStore(repos),
        tradeMemo: createTradeMemoStore(repos),
        tradeRecord: createTradeRecordStore(repos),
      };
    }
    return cachedStores;
  }, [repos]);
}
