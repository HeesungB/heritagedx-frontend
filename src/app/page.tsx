"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import { Club, ClubDetail, TransactionFormData, Scenario } from "@/types";

export interface AppState {
  currentStep: number;
  selectedClub: Club | null;
  clubDetail: ClubDetail | null;
  transactionForm: TransactionFormData | null;
  selectedScenario: Scenario | null;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>({
    currentStep: 1,
    selectedClub: null,
    clubDetail: null,
    transactionForm: null,
    selectedScenario: null,
  });

  const handleClubConfirm = (club: Club, detail: ClubDetail) => {
    setAppState((prev) => ({
      ...prev,
      currentStep: 2,
      selectedClub: club,
      clubDetail: detail,
    }));
  };

  const handleTransactionConfirm = (formData: TransactionFormData, scenario: Scenario) => {
    setAppState((prev) => ({
      ...prev,
      currentStep: 3,
      transactionForm: formData,
      selectedScenario: scenario,
    }));
    console.log("단계 3으로 진행:", formData, scenario);
  };

  const handleDocumentsConfirm = () => {
    setAppState((prev) => ({
      ...prev,
      currentStep: 4,
    }));
    console.log("단계 4로 진행");
  };

  const handleSaveDraft = (formData: TransactionFormData) => {
    console.log("임시 저장:", formData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        selectedClub={appState.selectedClub}
        clubDetail={appState.clubDetail}
        selectedScenario={appState.selectedScenario}
      />
      <div className="flex flex-1">
        <Sidebar currentStep={appState.currentStep} />
        <MainContent
          appState={appState}
          onClubConfirm={handleClubConfirm}
          onTransactionConfirm={handleTransactionConfirm}
          onDocumentsConfirm={handleDocumentsConfirm}
          onSaveDraft={handleSaveDraft}
        />
      </div>
    </div>
  );
}
