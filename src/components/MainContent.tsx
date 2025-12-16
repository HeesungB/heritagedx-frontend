"use client";

import SystemNotice from "./SystemNotice";
import GolfClubSearch from "./GolfClubSearch";
import TransactionTypeForm from "./TransactionTypeForm";
import RequiredDocuments from "./RequiredDocuments";
import { Club, ClubDetail, TransactionFormData, Scenario } from "@/types";
import { AppState } from "@/app/page";

interface MainContentProps {
  appState: AppState;
  onClubConfirm: (club: Club, detail: ClubDetail) => void;
  onTransactionConfirm: (formData: TransactionFormData, scenario: Scenario) => void;
  onDocumentsConfirm: () => void;
  onSaveDraft: (formData: TransactionFormData) => void;
}

export default function MainContent({
  appState,
  onClubConfirm,
  onTransactionConfirm,
  onDocumentsConfirm,
  onSaveDraft,
}: MainContentProps) {
  return (
    <main className="flex-1 p-8">
      <SystemNotice />

      {appState.currentStep === 1 && (
        <GolfClubSearch onClubConfirm={onClubConfirm} />
      )}

      {appState.currentStep === 2 && appState.selectedClub && (
        <TransactionTypeForm
          clubCode={appState.selectedClub.code}
          clubName={appState.clubDetail?.name || appState.selectedClub.name}
          onConfirm={onTransactionConfirm}
          onSaveDraft={onSaveDraft}
        />
      )}

      {appState.currentStep === 3 && appState.selectedClub && appState.selectedScenario && (
        <RequiredDocuments
          clubCode={appState.selectedClub.code}
          scenarioCode={appState.selectedScenario.scenarioCode}
          onConfirm={onDocumentsConfirm}
        />
      )}

      {appState.currentStep === 4 && (
        <div className="border border-gray-300 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">서류 제출·검증 (단계 4)</h2>
          <p className="text-gray-500">단계 4 구현 예정...</p>
        </div>
      )}
    </main>
  );
}
