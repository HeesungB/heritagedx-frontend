"use client";

import { createContext, useContext, ReactNode } from "react";
import type { GeneralRepositories, AdminRepositories } from "../interfaces";

interface RepositoryContextType {
  general: GeneralRepositories;
  admin?: AdminRepositories;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(
  undefined,
);

interface RepositoryProviderProps {
  general: GeneralRepositories;
  admin?: AdminRepositories;
  children: ReactNode;
}

export function RepositoryProvider({
  general,
  admin,
  children,
}: RepositoryProviderProps) {
  return (
    <RepositoryContext.Provider value={{ general, admin }}>
      {children}
    </RepositoryContext.Provider>
  );
}

function useRepositoryContext(): RepositoryContextType {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error(
      "useRepositoryContext must be used within a RepositoryProvider",
    );
  }
  return context;
}

export function useGeneralRepositories(): GeneralRepositories {
  return useRepositoryContext().general;
}

export function useAdminRepositories(): AdminRepositories {
  const { admin } = useRepositoryContext();
  if (!admin) {
    throw new Error(
      "Admin repositories are not available. Make sure RepositoryProvider is configured with admin repositories.",
    );
  }
  return admin;
}

// Convenience hooks
export function useClubRepository() {
  return useGeneralRepositories().clubs;
}

export function useScenarioRepository() {
  return useGeneralRepositories().scenarios;
}

export function useConsultationRepository() {
  return useGeneralRepositories().consultations;
}

export function useMembershipTradeRepository() {
  return useGeneralRepositories().membershipTrades;
}

export function useClaimRepository() {
  return useGeneralRepositories().claims;
}

export function useNoticeRepository() {
  return useGeneralRepositories().notices;
}

export function useMarketPriceRepository() {
  return useGeneralRepositories().marketPrices;
}

export function useCustomerRepository() {
  return useGeneralRepositories().customers;
}

export function useSettlementRepository() {
  return useGeneralRepositories().settlements;
}

export function useConsultationAdminRepository() {
  return useAdminRepositories().consultations;
}

export function useMembershipTradeAdminRepository() {
  return useAdminRepositories().membershipTrades;
}

export function useSettlementAdminRepository() {
  return useAdminRepositories().settlements;
}

export function useScenarioAdminRepository() {
  return useAdminRepositories().scenarios;
}
