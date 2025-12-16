"use client";

import { ClubDetail } from "@/types";

interface GolfClubDetailProps {
  detail: ClubDetail;
  loading: boolean;
  onConfirm: () => void;
}

export default function GolfClubDetail({ detail, loading, onConfirm }: GolfClubDetailProps) {
  if (loading) {
    return (
      <div className="mt-6 border border-gray-300 rounded p-6">
        <div className="text-center py-8 text-gray-500">상세 정보 로딩 중...</div>
      </div>
    );
  }

  const contactInfo = detail.contacts?.[0];
  const contactName = contactInfo?.name || "-";
  const contactDepartment = contactInfo?.department || "";
  const contactDisplay = contactDepartment
    ? `${contactName} — ${contactDepartment}`
    : contactName;

  const phoneContact = detail.contacts?.find(c => c.type === "phone")?.value || "-";
  const emailContact = detail.contacts?.find(c => c.type === "email")?.value || "-";
  const contactString = `${phoneContact} / ${emailContact}`;

  const bankAccount = detail.bankAccounts?.[0];
  const bankDisplay = bankAccount
    ? `${bankAccount.bank} ${bankAccount.account} (${bankAccount.holder})`
    : "-";

  const submissionMethods = detail.submissionMethods || ["VISIT", "MAIL", "EMAIL"];
  const processingTime = detail.processingTime || "7-10 business days";

  return (
    <div className="mt-6 border border-gray-300 rounded p-6">
      <h2 className="text-xl font-semibold mb-4">
        골프장 기초 정보 (L1 고정 데이터 — 읽기 전용)
      </h2>

      <div className="flex justify-between items-center mb-4">
        <button className="px-4 py-2 border border-gray-900">
          시스템 판정
        </button>
        <span className="text-gray-500 text-sm">L1 마스터 데이터 — 시스템 기록</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
        <p>
          <strong>데이터 갱신일 고지:</strong> 본 데이터는 최종 갱신일 기준 시스템 기록.
          운영자는 진행 전 골프장 행정실 직접 확인을 통해 현행 정확성 재검증 필요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* 기본 정보 */}
        <div>
          <h3 className="font-semibold border-b border-gray-300 pb-2 mb-4">기본 정보</h3>

          <div className="mb-4">
            <label className="text-gray-500 text-sm block mb-1">골프장명</label>
            <div className="border border-gray-200 bg-gray-50 p-3">
              {detail.name || "-"}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-sm block mb-1">소재지</label>
            <div className="border border-gray-200 bg-gray-50 p-3">
              {detail.address || "-"}
            </div>
          </div>
        </div>

        {/* 담당 부서 연락처 */}
        <div>
          <h3 className="font-semibold border-b border-gray-300 pb-2 mb-4">담당 부서 연락처</h3>

          <div className="mb-4">
            <label className="text-gray-500 text-sm block mb-1">담당자·부서명</label>
            <div className="border border-gray-200 bg-gray-50 p-3">
              {contactDisplay}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-sm block mb-1">전화·이메일</label>
            <div className="border border-gray-200 bg-gray-50 p-3">
              {contactString}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* 제출 방법 */}
        <div>
          <h3 className="font-semibold border-b border-gray-300 pb-2 mb-4">제출 방법</h3>

          <div className="mb-4">
            <label className="text-gray-500 text-sm block mb-1">제출 경로</label>
            <div className="flex gap-2">
              {submissionMethods.map((method) => (
                <span
                  key={method}
                  className="px-4 py-2 bg-gray-900 text-white text-sm"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-sm block mb-1">처리 소요 기간</label>
            <div className="border border-gray-200 bg-gray-50 p-3">
              {processingTime}
            </div>
          </div>
        </div>

        {/* 수수료 정보 */}
        <div>
          <h3 className="font-semibold border-b border-gray-300 pb-2 mb-4">수수료 정보</h3>

          <div className="mb-4">
            <label className="text-gray-500 text-sm block mb-1">명의개서 수수료</label>
            <div className="border border-gray-200 bg-gray-50 p-3">
              {detail.transferFee || "-"}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-sm block mb-1">입금 계좌</label>
            <div className="border border-gray-200 bg-gray-50 p-3">
              {bankDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* 특이 사항 */}
      <div className="mb-8">
        <h3 className="font-semibold border-b border-gray-300 pb-2 mb-4">특이 사항</h3>
        <div className="bg-gray-100 border border-gray-200 p-4">
          {detail.memo || "특이 사항 없음"}
        </div>
      </div>

      {/* 외부 안내 URL */}
      {detail.externalUrl && (
        <div className="mb-8">
          <label className="text-gray-500 text-sm block mb-1">외부 안내 URL</label>
          <div className="border border-gray-200 bg-gray-50 p-3">
            <a
              href={detail.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {detail.externalUrl}
            </a>
          </div>
        </div>
      )}

      <hr className="my-6" />

      {/* 하단 액션 */}
      <div className="flex justify-between items-center">
        <span className="text-gray-500">운영자 정확성 검증 확인 후 골프장 선택 진행</span>
        <button
          onClick={onConfirm}
          className="px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          선택 확정 및 단계 2 진행
        </button>
      </div>
    </div>
  );
}
