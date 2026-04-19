"use client";

import { useMemo } from "react";
import { useGeneralRepositories } from "@heritage-dx/api";
import {
  createClubStore,
  createConsultationStore,
  createMembershipTradeStore,
} from "@heritage-dx/store";
import type { ClubStore, ConsultationStore, MembershipTradeStore } from "@heritage-dx/store";

interface AppStores {
  club: ClubStore;
  tradeMemo: ConsultationStore;
  tradeRecord: MembershipTradeStore;
}

let cachedStores: AppStores | null = null;

export function useAppStores(): AppStores {
  const repos = useGeneralRepositories();

  return useMemo(() => {
    if (!cachedStores) {
      cachedStores = {
        club: createClubStore(repos),
        tradeMemo: createConsultationStore(repos),
        tradeRecord: createMembershipTradeStore(repos),
      };
    }
    return cachedStores;
  }, [repos]);
}
