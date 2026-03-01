"use client";

import { useState, useEffect } from "react";
import { Club, ClubDetail } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@heritage-dx/ui";
import TaxGuideModal from "./TaxGuideModal";
import TradeMemoSidebar from "./TradeMemoSidebar";
import MapSidebar from "./MapSidebar";
import ClubBasicInfoTable from "./club-profile/ClubBasicInfoTable";
import MembershipInfoSection from "./club-profile/MembershipInfoSection";
import BenefitsSheetSection from "./club-profile/BenefitsSheetSection";
import CostCalculatorSection from "./club-profile/CostCalculatorSection";
import DocumentsSection from "./club-profile/DocumentsSection";
import EstimateSection from "./club-profile/EstimateSection";

interface ClubProfileProps {
  detail: ClubDetail | null;
  loading: boolean;
  clubs?: Club[];
  onClubNavigate?: (clubCode: string) => void;
}

type ProfileTab = "membership" | "infoSheet" | "estimate" | "costCalc" | "documents";

export default function ClubProfile({ detail, loading, clubs, onClubNavigate }: ClubProfileProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("membership");
  const [showTaxGuide, setShowTaxGuide] = useState(false);
  const [isMemoSidebarOpen, setIsMemoSidebarOpen] = useState(false);
  const [isMapSidebarOpen, setIsMapSidebarOpen] = useState(false);

  // 통합 회원권 선택 인덱스 (헤더에서 관리)
  const [selectedMembershipIndex, setSelectedMembershipIndex] = useState(0);

  // 견적서 입력 필드 상태
  const [estimateRecipient, setEstimateRecipient] = useState("");
  const [estimatePrice, setEstimatePrice] = useState("");
  const [estimateCommission, setEstimateCommission] = useState("");
  const [estimateAcqTax, setEstimateAcqTax] = useState("");
  const [estimateStampDuty, setEstimateStampDuty] = useState("");
  const [estimateDeposit, setEstimateDeposit] = useState("");
  const [estimateManagerTitle, setEstimateManagerTitle] = useState("");

  // 혜택지 입력 필드 상태
  const [sheetRecipient, setSheetRecipient] = useState("");
  const [sheetBenefits, setSheetBenefits] = useState("");
  const [sheetMarketNote, setSheetMarketNote] = useState("");
  const [sheetManagerName, setSheetManagerName] = useState(user?.name || "");
  const [sheetManagerTitle, setSheetManagerTitle] = useState("");
  const [sheetManagerPhone, setSheetManagerPhone] = useState("");
  const [hiddenSheetItems, setHiddenSheetItems] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("sheetHiddenItems");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // 로그인 유저 이름을 담당자 기본값으로 설정
  useEffect(() => {
    if (user?.name && !sheetManagerName) {
      setSheetManagerName(user.name);
    }
  }, [user?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // 서류 상태
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [selectedScenarioCode, setSelectedScenarioCode] = useState<string | null>(null);

  // 골프장 변경 시 초기화
  useEffect(() => {
    setSelectedDocIds(new Set());
    const hasPS_BASIC = detail?.scenarios?.some(
      (s) => s.scenario.scenarioCode === "PS_BASIC"
    );
    setSelectedScenarioCode(hasPS_BASIC ? "PS_BASIC" : null);
    setSelectedMembershipIndex(0);
    // 첫 번째 회원권의 memberBenefits로 혜택지 자동 채움
    const firstBenefits = detail?.memberships?.[0]?.memberBenefits;
    if (firstBenefits) {
      setSheetBenefits(firstBenefits);
    }
  }, [detail?.code, detail?.scenarios]); // eslint-disable-line react-hooks/exhaustive-deps

  // 회원권 탭 변경 시 해당 memberBenefits로 혜택지 갱신
  useEffect(() => {
    const benefits = detail?.memberships?.[selectedMembershipIndex]?.memberBenefits;
    if (benefits) {
      setSheetBenefits(benefits);
    }
  }, [selectedMembershipIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // hiddenSheetItems 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(
      "sheetHiddenItems",
      JSON.stringify([...hiddenSheetItems])
    );
  }, [hiddenSheetItems]);

  if (loading) {
    return (
      <div className="flex-1 min-h-0 p-6 bg-gray-50 overflow-y-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="py-8 flex justify-center">
            <Loading text="골프장 정보 로딩 중..." />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex-1 min-h-0 p-6 bg-gray-50 overflow-y-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8 text-gray-500">
            골프장을 선택해 주세요.
          </div>
        </div>
      </div>
    );
  }

  const selectedMembership = detail.memberships?.[selectedMembershipIndex];
  const primaryContact = detail.contacts?.find(c => c.isPrimary) || detail.contacts?.[0];

  const tabs = [
    { id: "membership" as ProfileTab, label: "회원권 정보" },
    { id: "infoSheet" as ProfileTab, label: "혜택지" },
    { id: "estimate" as ProfileTab, label: "견적서" },
    { id: "costCalc" as ProfileTab, label: "비용산출" },
    { id: "documents" as ProfileTab, label: "서류" },
  ];

  return (
    <div className="flex-1 min-h-0 flex min-w-0 print:block">
      {/* 메인 콘텐츠 */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto bg-white print:p-0 print:overflow-visible">
        {/* 헤더 + 탭 (스크롤 시 상단 고정) */}
        <div className="sticky top-0 z-10 bg-white print:static">
          <div className="px-6 pt-4 pb-0 print:hidden">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold">{detail.name}</h2>
              {detail.basicInfo.holes && (
                <span className="text-sm text-gray-500">
                  {detail.basicInfo.holes}
                </span>
              )}

              {/* 회원권 선택기 */}
              {detail.memberships && detail.memberships.length > 1 && (
                <div className="flex gap-1.5">
                  {detail.memberships.map((m, index) => (
                    <button
                      key={m.id || index}
                      onClick={() => setSelectedMembershipIndex(index)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
                        selectedMembershipIndex === index
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-300 hover:border-emerald-500 hover:text-emerald-700"
                      }`}
                    >
                      {m.membershipName || m.membershipType || `회원권 ${index + 1}`}
                    </button>
                  ))}
                </div>
              )}

              <div className="ml-auto flex items-center gap-3">
                {!isMapSidebarOpen && (
                  <button
                    onClick={() => { setIsMapSidebarOpen(true); setIsMemoSidebarOpen(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
                    title="골프장 지도"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    지도
                  </button>
                )}
                {!isMemoSidebarOpen && (
                  <button
                    onClick={() => { setIsMemoSidebarOpen(true); setIsMapSidebarOpen(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
                    title="거래 메모"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    메모
                  </button>
                )}
                {detail.updatedAt && (
                  <div className="text-xs text-gray-400">
                    {new Date(detail.updatedAt).toLocaleDateString("ko-KR")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200 print:hidden mt-4 px-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 font-medium text-xs transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="px-6 py-4">
          {activeTab === "membership" && (
            <div className="space-y-4">
              <ClubBasicInfoTable
                companyName={detail.companyName ?? undefined}
                openingDate={detail.basicInfo.openingDate ?? undefined}
                holes={detail.basicInfo.holes ?? undefined}
                memberCount={detail.basicInfo.memberCount != null ? String(detail.basicInfo.memberCount) : undefined}
                address={detail.address}
                region={detail.region}
                memberDaySchedule={detail.memberships?.[selectedMembershipIndex]?.memberDaySchedule ?? undefined}
                phoneNumber={(detail.contacts?.find(c => c.isPrimary)?.phoneNumber ?? primaryContact?.phoneNumber) ?? undefined}
                totalLength={detail.basicInfo.totalLength ?? undefined}
                courseNames={detail.basicInfo.courseNames ?? undefined}

                introduction={detail.basicInfo.introduction ?? undefined}
                facilities={detail.basicInfo.facilities ?? undefined}
              />

              {detail.memberships && detail.memberships.length > 0 ? (
                <MembershipInfoSection
                  memberships={detail.memberships}
                  selectedIndex={selectedMembershipIndex}
                  memo={detail.memo}
                  reservationNotes={detail.memberships?.[selectedMembershipIndex]?.reservationNotes || detail.registration.reservationNotes}
                  caddyFee={detail.costs.caddyFee ?? undefined}
                  cartFee={detail.costs.cartFee ?? undefined}
                  registrationFee={detail.costs.registrationFee ?? undefined}
                  stampDuty={detail.costs.stampDuty ?? undefined}
                  agencyFee={detail.costs.agencyFee ?? undefined}
                  otherCosts={detail.costs.otherCosts ?? undefined}
                  currentClubAddress={detail.address}
                  currentClubName={detail.name}
                  clubs={clubs}
                  onClubNavigate={onClubNavigate}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  회원권 정보가 없습니다.
                </div>
              )}
            </div>
          )}

          {activeTab === "infoSheet" && (
            <BenefitsSheetSection
              detail={detail}
              selectedMembershipIndex={selectedMembershipIndex}
              sheetRecipient={sheetRecipient}
              onSheetRecipientChange={setSheetRecipient}
              sheetBenefits={sheetBenefits}
              onSheetBenefitsChange={setSheetBenefits}
              sheetMarketNote={sheetMarketNote}
              onSheetMarketNoteChange={setSheetMarketNote}
              sheetManagerName={sheetManagerName}
              onSheetManagerNameChange={setSheetManagerName}
              sheetManagerTitle={sheetManagerTitle}
              onSheetManagerTitleChange={setSheetManagerTitle}
              sheetManagerPhone={sheetManagerPhone}
              onSheetManagerPhoneChange={setSheetManagerPhone}
              hiddenSheetItems={hiddenSheetItems}
              onHiddenSheetItemsChange={setHiddenSheetItems}
            />
          )}

          {activeTab === "estimate" && (
            <EstimateSection
              detail={detail}
              selectedMembershipIndex={selectedMembershipIndex}
              recipient={estimateRecipient}
              onRecipientChange={setEstimateRecipient}
              price={estimatePrice}
              onPriceChange={setEstimatePrice}
              commission={estimateCommission}
              onCommissionChange={setEstimateCommission}
              acqTax={estimateAcqTax}
              onAcqTaxChange={setEstimateAcqTax}
              stampDuty={estimateStampDuty}
              onStampDutyChange={setEstimateStampDuty}
              deposit={estimateDeposit}
              onDepositChange={setEstimateDeposit}
              managerTitle={estimateManagerTitle}
              onManagerTitleChange={setEstimateManagerTitle}
            />
          )}

          {activeTab === "costCalc" && (
            <CostCalculatorSection
              taxOfficial={detail.costs.taxOfficial ?? undefined}
              transferFee={detail.costs.registrationFee ?? undefined}
              recentMarketPrice={detail.marketInfo.recentMarketPrice ?? undefined}
              onShowTaxGuide={() => setShowTaxGuide(true)}
            />
          )}

          {activeTab === "documents" && (
            <DocumentsSection
              detail={detail}
              selectedMembershipIndex={selectedMembershipIndex}
              selectedDocIds={selectedDocIds}
              onSelectedDocIdsChange={setSelectedDocIds}
              selectedScenarioCode={selectedScenarioCode}
              onSelectedScenarioCodeChange={setSelectedScenarioCode}
            />
          )}

        </div>

      {/* 세금 안내 모달 */}
      <TaxGuideModal
        isOpen={showTaxGuide}
        onClose={() => setShowTaxGuide(false)}
      />
    </div>

      {/* 오른쪽: 지도 사이드바 */}
      {isMapSidebarOpen && detail && (
        <MapSidebar
          currentAddress={detail.address}
          clubName={detail.name}
          onClose={() => setIsMapSidebarOpen(false)}
        />
      )}

      {/* 오른쪽: 거래 메모 사이드바 */}
      {isMemoSidebarOpen && detail && (
        <TradeMemoSidebar
          clubDetail={detail}
          onClose={() => setIsMemoSidebarOpen(false)}
        />
      )}
    </div>
  );
}
