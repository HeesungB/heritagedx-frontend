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

const initialState: AppState = {
  currentStep: 1,
  selectedClub: null,
  clubDetail: null,
  transactionForm: null,
  selectedScenario: null,
};

export default function Home() {
  const [appState, setAppState] = useState<AppState>(initialState);

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

  // 특정 단계로 이동 (사이드바에서 클릭 시)
  const handleStepClick = (stepNumber: number) => {
    // 단계 1,2,3만 이동 가능
    if (stepNumber < 1 || stepNumber > 3) return;

    // 이전 단계의 데이터가 필요한 경우 체크
    if (stepNumber === 2 && !appState.selectedClub) {
      // 2단계는 골프장 선택이 필요
      return;
    }
    if (stepNumber === 3 && (!appState.selectedClub || !appState.selectedScenario)) {
      // 3단계는 골프장과 시나리오 선택이 필요
      return;
    }

    setAppState((prev) => ({
      ...prev,
      currentStep: stepNumber,
    }));
  };

  // 이전 단계로 이동
  const handlePreviousStep = () => {
    if (appState.currentStep > 1) {
      setAppState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  // 전체 초기화 (1단계로 돌아가기)
  const handleReset = () => {
    setAppState(initialState);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        selectedClub={appState.selectedClub}
        clubDetail={appState.clubDetail}
        selectedScenario={appState.selectedScenario}
      />
      <div className="flex flex-1">
        <Sidebar
          currentStep={appState.currentStep}
          onStepClick={handleStepClick}
          canGoToStep2={!!appState.selectedClub}
          canGoToStep3={!!appState.selectedClub && !!appState.selectedScenario}
        />
        <MainContent
          appState={appState}
          onClubConfirm={handleClubConfirm}
          onTransactionConfirm={handleTransactionConfirm}
          onDocumentsConfirm={handleDocumentsConfirm}
          onSaveDraft={handleSaveDraft}
          onPreviousStep={handlePreviousStep}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}
