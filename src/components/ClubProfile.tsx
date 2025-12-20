"use client";

import { useState } from "react";
import { ClubDetail } from "@/types";

interface ClubProfileProps {
  detail: ClubDetail | null;
  loading: boolean;
}

type MemberTab = "regular" | "corporate";

export default function ClubProfile({ detail, loading }: ClubProfileProps) {
  const [memberTab, setMemberTab] = useState<MemberTab>("regular");

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

  // 회원 유형별 권리 정보 (실제로는 API에서 가져와야 함)
  const memberRights = {
    regular: {
      companionPolicy: "동반 4인까지",
      greenFeeBenefit: "본인 무료 / 동반자 30% 할인",
      reservationPriority: "최우선 (7일 전)",
      usageRestriction: "무제한 (성수기 주말 제한 있음)",
    },
    corporate: {
      companionPolicy: "동반 8인까지",
      greenFeeBenefit: "본인 무료 / 동반자 20% 할인",
      reservationPriority: "우선 (5일 전)",
      usageRestriction: "주 2회 제한",
    },
  };

  const currentRights = memberRights[memberTab];

  // 거래 상태 정보 (임시 데이터)
  const tradeInfo = {
    frequency: "거래 활발 (주 2~3건)",
    priceStability: "시세 안정적",
    corporateDemand: "법인 수요 높음",
    processingTime: "서류 처리 7일 소요",
  };

  return (
    <div className="flex-1 min-h-0 p-6 bg-gray-50 overflow-y-auto">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold mb-3">골프장 프로필</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>정회원</span>
            <span>·</span>
            <span>거래 활발</span>
            <span>·</span>
            <span>수도권 수요</span>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 소재지 */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">소재지</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
                {detail.address || "-"}
              </div>
            </div>

            {/* 담당자 */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">담당자</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
                {primaryContact?.contactPerson || "-"}
              </div>
            </div>

            {/* 연락처 */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">연락처</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
                {primaryContact?.phoneNumber || "-"}
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">이메일</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
                {primaryContact?.email || "-"}
              </div>
            </div>

            {/* 운영 형태 */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">운영 형태</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
                회원제 (18홀)
              </div>
            </div>

            {/* 총 회원 수 */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">총 회원 수</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
                1,200명
              </div>
            </div>
          </div>
        </div>

        {/* 회원 유형별 권리 정보 */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-4">회원 유형별 권리 정보</h3>

          {/* 탭 */}
          <div className="flex mb-4">
            <button
              onClick={() => setMemberTab("regular")}
              className={`px-6 py-2 font-medium transition-colors ${
                memberTab === "regular"
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              정회원
            </button>
            <button
              onClick={() => setMemberTab("corporate")}
              className={`px-6 py-2 font-medium transition-colors ${
                memberTab === "corporate"
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              법인회원
            </button>
          </div>

          {/* 권리 정보 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">동반자 정책</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                {currentRights.companionPolicy}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">그린피 혜택</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                {currentRights.greenFeeBenefit}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">예약 우선순위</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                {currentRights.reservationPriority}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">이용 제한</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                {currentRights.usageRestriction}
              </div>
            </div>
          </div>
        </div>

        {/* 실무 거래 참고 사항 */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">실무 거래 참고 사항</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-green-500">◎</span>
              <span>{tradeInfo.frequency}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-blue-500">↗</span>
              <span>{tradeInfo.priceStability}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-purple-500">△</span>
              <span>{tradeInfo.corporateDemand}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-gray-500">⏱</span>
              <span>{tradeInfo.processingTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
