"use client";

import { useState } from "react";
import { ClubDetail } from "@/types";

interface ClubProfileProps {
  detail: ClubDetail | null;
  loading: boolean;
}

type ProfileTab = "basic" | "fee" | "transaction" | "scenario";

export default function ClubProfile({ detail, loading }: ClubProfileProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("basic");

  if (loading) {
    return (
      <div className="flex-1 min-h-0 p-6 bg-gray-50 overflow-y-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8 text-gray-500">골프장 정보 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex-1 min-h-0 p-6 bg-gray-50 overflow-y-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8 text-gray-500">골프장을 선택해 주세요.</div>
        </div>
      </div>
    );
  }

  const primaryContact = detail.contacts?.find((c) => c.isPrimary) || detail.contacts?.[0];
  const bankAccount = detail.bankAccounts?.[0];

  // 개장일 포맷팅
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 금액 포맷팅
  const formatCurrency = (amount?: number | object | null) => {
    if (!amount) return "-";
    // 객체인 경우 처리
    if (typeof amount === "object") {
      // 객체에서 숫자 값을 추출 시도
      const values = Object.values(amount).filter((v) => typeof v === "number");
      if (values.length > 0) {
        return values.map((v) => `${(v as number).toLocaleString()}원`).join(" / ");
      }
      return "-";
    }
    return `${amount.toLocaleString()}원`;
  };

  const tabs = [
    { id: "basic" as ProfileTab, label: "기본 정보" },
    { id: "fee" as ProfileTab, label: "수수료/비용" },
    { id: "transaction" as ProfileTab, label: "거래 정보" },
    { id: "scenario" as ProfileTab, label: "시나리오" },
  ];

  return (
    <div className="flex-1 min-h-0 p-6 bg-gray-50 overflow-y-auto">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">{detail.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                <span className="px-2 py-0.5 bg-gray-100 rounded">{detail.code}</span>
                <span>·</span>
                <span>{detail.region}</span>
                {detail.holes && (
                  <>
                    <span>·</span>
                    <span>{detail.holes}</span>
                  </>
                )}
                {detail.memberCount && (
                  <>
                    <span>·</span>
                    <span>회원 {detail.memberCount}</span>
                  </>
                )}
              </div>
            </div>
            {detail.updatedAt && (
              <div className="text-xs text-gray-400">
                최종 업데이트: {new Date(detail.updatedAt).toLocaleDateString("ko-KR")}
              </div>
            )}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
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

        {/* 탭 컨텐츠 */}
        <div className="p-6">
          {activeTab === "basic" && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">골프장 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="소재지" value={detail.address} />
                  <InfoField label="지역" value={detail.region} />
                  <InfoField label="개장일" value={formatDate(detail.openingDate)} />
                  <InfoField label="운영 형태" value={detail.holes} />
                  <InfoField label="총 거리" value={detail.totalLength} />
                  <InfoField label="총 회원 수" value={detail.memberCount} />
                  {detail.courseNames && detail.courseNames.length > 0 && (
                    <InfoField label="코스 구성" value={detail.courseNames.join(", ")} />
                  )}
                  <InfoField label="도시 접근성" value={detail.cityAccessibility} />
                </div>
              </section>

              {/* 연락처 정보 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">연락처</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="담당자" value={primaryContact?.contactPerson} />
                  <InfoField label="부서" value={primaryContact?.department} />
                  <InfoField
                    label="전화번호"
                    value={primaryContact?.phoneNumber}
                    isPhone
                  />
                  <InfoField label="팩스" value={primaryContact?.fax} />
                  <InfoField label="이메일" value={primaryContact?.email} isEmail />
                </div>
              </section>

              {/* 세무/행정 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">세무/행정 정보</h3>
                <div className="grid grid-cols-1 gap-4">
                  <InfoField label="관할 세무서" value={detail.taxOfficial} fullWidth />
                </div>
              </section>

              {/* 특이 사항 */}
              {detail.memo && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">특이 사항</h3>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">{detail.memo}</p>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === "fee" && (
            <div className="space-y-6">
              {/* 명의개서 수수료 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">명의개서 수수료</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField
                    label="명의개서 수수료"
                    value={detail.transferFee}
                    highlight
                  />
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">입금 계좌</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
                      {bankAccount ? (
                        <div>
                          {bankAccount.bankName && <span>{bankAccount.bankName} </span>}
                          <span className="font-mono">{bankAccount.accountNumber}</span>
                          {bankAccount.accountHolder && <span> ({bankAccount.accountHolder})</span>}
                        </div>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* 이용 비용 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">이용 비용</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoField label="평일 그린피" value={formatCurrency(detail.weekdayGreenFee)} />
                  <InfoField label="주말 그린피" value={formatCurrency(detail.weekendGreenFee)} />
                  <InfoField label="카트피" value={formatCurrency(detail.cartFee)} />
                </div>
              </section>

              {/* 시세 정보 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">시세 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="최근 시세" value={detail.recentMarketPrice} />
                  <InfoField label="시세 업데이트일" value={detail.recentPriceUpdateDate} />
                  <InfoField label="3년 평균 시세" value={detail.avgMarketPrice3y} />
                  <InfoField label="딜러 가격대" value={detail.dealerPriceRange} />
                </div>
              </section>
            </div>
          )}

          {activeTab === "transaction" && (
            <div className="space-y-6">
              {/* 거래 동향 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">거래 동향</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="거래 경향" value={detail.transactionTendency} />
                  <InfoField label="최근 거래 유형" value={detail.recentTransactionType} />
                  <InfoField label="거래 가능 유형" value={detail.tradableTypeSummary} />
                  <InfoField label="최소 거래 단위" value={detail.minTransactionUnit} />
                </div>
              </section>

              {/* 등록 정보 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">등록 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="등록 난이도" value={detail.registrationDifficulty} />
                  <InfoField label="추가 서류 빈도" value={detail.additionalDocumentFrequency} />
                  <InfoField label="등록 시간" value={detail.registrationHours} />
                  <InfoField label="등록 절차" value={detail.registrationProcedure} />
                </div>
              </section>

              {/* 예약/이용 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">예약/이용</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="주말 예약 난이도" value={detail.weekendReservationDifficulty} />
                  <InfoField label="클레임 빈도" value={detail.claimFrequency} />
                  <InfoField label="예약 참고사항" value={detail.reservationNotes} fullWidth />
                </div>
              </section>

              {/* 리스크 정보 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">리스크 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="밸런스 리스크" value={detail.balanceRisk} />
                  <InfoField label="거래 리스크 메모" value={detail.transactionRiskMemo} />
                </div>
              </section>

              {/* 딜러/회원권 메모 */}
              {(detail.dealerMemo || detail.membershipInfo) && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">참고 정보</h3>
                  <div className="space-y-4">
                    {detail.dealerMemo && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <label className="block text-sm font-medium text-blue-800 mb-1">딜러 메모</label>
                        <p className="text-blue-900 whitespace-pre-wrap">{detail.dealerMemo}</p>
                      </div>
                    )}
                    {detail.membershipInfo && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <label className="block text-sm font-medium text-purple-800 mb-1">회원권 정보</label>
                        <p className="text-purple-900 whitespace-pre-wrap">{detail.membershipInfo}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === "scenario" && (
            <div className="space-y-6">
              {/* 가능한 필터 옵션 */}
              {detail.scenarioOptions?.availableFilters && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">거래 옵션</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 거래 측면 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">거래 측면</label>
                      <div className="flex flex-wrap gap-2">
                        {detail.scenarioOptions.availableFilters.sides?.map((side, idx) => (
                          <span
                            key={`side-${idx}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {side.label} ({side.count})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 소유자 유형 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">소유자 유형</label>
                      <div className="flex flex-wrap gap-2">
                        {detail.scenarioOptions.availableFilters.ownerTypes?.map((type, idx) => (
                          <span
                            key={`owner-${idx}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {type.label} ({type.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 시나리오 목록 */}
              {detail.scenarioOptions?.scenarios && detail.scenarioOptions.scenarios.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">시나리오 목록</h3>
                  <div className="space-y-2">
                    {detail.scenarioOptions.scenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                scenario.side === "Seller"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {scenario.side === "Seller" ? "양도자" : "양수자"}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                scenario.ownerType === "Personal"
                                  ? "bg-green-100 text-green-700"
                                  : scenario.ownerType === "Corporate"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-pink-100 text-pink-700"
                              }`}
                            >
                              {scenario.ownerType === "Personal"
                                ? "개인"
                                : scenario.ownerType === "Corporate"
                                ? "법인"
                                : "가족"}
                            </span>
                            <span className="font-medium text-gray-900">{scenario.name}</span>
                          </div>
                          <span className="text-xs text-gray-400 font-mono">{scenario.scenarioCode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 정보 필드 컴포넌트
interface InfoFieldProps {
  label: string;
  value?: string | null;
  highlight?: boolean;
  fullWidth?: boolean;
  isPhone?: boolean;
  isEmail?: boolean;
}

function InfoField({ label, value, highlight, fullWidth, isPhone, isEmail }: InfoFieldProps) {
  // 객체인 경우 안전하게 처리
  const safeValue = typeof value === "object" && value !== null
    ? JSON.stringify(value)
    : value;
  const displayValue = safeValue || "-";
  const hasValue = safeValue && safeValue !== "-";

  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <div
        className={`p-3 border rounded text-gray-900 ${
          highlight && hasValue
            ? "bg-green-50 border-green-200 font-semibold text-green-800"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        {isPhone && hasValue ? (
          <a href={`tel:${safeValue}`} className="text-blue-600 hover:underline">
            {displayValue}
          </a>
        ) : isEmail && hasValue ? (
          <a href={`mailto:${safeValue}`} className="text-blue-600 hover:underline">
            {displayValue}
          </a>
        ) : (
          displayValue
        )}
      </div>
    </div>
  );
}
