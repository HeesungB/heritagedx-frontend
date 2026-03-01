"use client";

import { ClubDetail } from "@/types";
import { Button, Loading } from "@heritage-dx/ui";

interface GolfClubDetailProps {
  detail: ClubDetail;
  loading: boolean;
  onConfirm: () => void;
  onReset: () => void;
}

export default function GolfClubDetail({ detail, loading, onConfirm, onReset }: GolfClubDetailProps) {
  if (loading) {
    return (
      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="py-8 flex justify-center">
          <Loading text="상세 정보 로딩 중..." />
        </div>
      </div>
    );
  }

  // 주 연락처 찾기 (isPrimary가 true인 것 또는 첫번째)
  const primaryContact = detail.contacts?.find(c => c.isPrimary) || detail.contacts?.[0];
  const contactPerson = primaryContact?.contactPerson || "-";
  const contactDepartment = primaryContact?.department || "";
  const contactDisplay = contactDepartment
    ? `${contactPerson} — ${contactDepartment}`
    : contactPerson;

  const phoneContact = primaryContact?.phoneNumber || "-";
  const emailContact = primaryContact?.email || "-";
  const contactString = `${phoneContact} / ${emailContact}`;

  const bankAccount = detail.bankAccounts?.[0];
  const bankDisplay = bankAccount
    ? `${bankAccount.bankName || ""} ${bankAccount.accountNumber || ""} (${bankAccount.accountHolder || ""})`
    : "-";

  const submissionMethods = detail.registration.submissionMethods.length > 0
    ? detail.registration.submissionMethods
    : ["VISIT", "MAIL", "EMAIL"];
  const processingTime = detail.registration.processingTime || "7-10 business days";

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* 타이틀 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">골프장 기초 정보</h2>
            <p className="text-sm text-gray-500 mt-0.5">L1 마스터 데이터 — 시스템 기록</p>
          </div>
        </div>
        <span className="rounded-full bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1">
          시스템 판정
        </span>
      </div>

      <div className="bg-info-background border border-info-border rounded-lg p-4 mb-6">
        <p className="text-info-text">
          <strong>데이터 갱신일 고지:</strong> 본 데이터는 최종 갱신일 기준 시스템 기록.
          운영자는 진행 전 골프장 행정실 직접 확인을 통해 현행 정확성 재검증 필요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
        {/* 기본 정보 */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-200">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            <h3 className="font-semibold text-gray-900">기본 정보</h3>
          </div>

          <div className="mb-4">
            <label className="text-gray-500 text-sm block mb-1">골프장명</label>
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-gray-900">
              {detail.name || "-"}
            </div>
          </div>

          {detail.address && (
            <div>
              <label className="text-gray-500 text-sm block mb-1">소재지</label>
              <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-gray-900">
                {detail.address}
              </div>
            </div>
          )}
        </div>

        {/* 담당 부서 연락처 */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-200">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <h3 className="font-semibold text-gray-900">담당 부서 연락처</h3>
          </div>

          <div className="mb-4">
            <label className="text-gray-500 text-sm block mb-1">담당자·부서명</label>
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-gray-900">
              {contactDisplay}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-sm block mb-1">전화·이메일</label>
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-gray-900">
              {contactString}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
        {/* 제출 방법 */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-200">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 className="font-semibold text-gray-900">제출 방법</h3>
          </div>

          <div className="mb-4">
            <label className="text-gray-500 text-sm block mb-1">제출 경로</label>
            <div className="flex flex-wrap gap-2">
              {submissionMethods.map((method) => (
                <span
                  key={method}
                  className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-full font-medium"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-sm block mb-1">처리 소요 기간</label>
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-gray-900">
              {processingTime}
            </div>
          </div>
        </div>

        {/* 수수료 정보 */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-200">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-gray-900">수수료 정보</h3>
          </div>

          <div className="mb-4">
            <label className="text-gray-500 text-sm block mb-1">명의개서료</label>
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-gray-900">
              {detail.costs.registrationFee || "-"}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-sm block mb-1">입금 계좌</label>
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-gray-900">
              {bankDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* 특이 사항 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-200">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <h3 className="font-semibold text-gray-900">특이 사항</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-900">
          {detail.memo || "특이 사항 없음"}
        </div>
      </div>

      {/* 외부 안내 URL */}
      {detail.registration.externalUrl && (
        <div className="mb-8">
          <label className="text-gray-500 text-sm block mb-1">외부 안내 URL</label>
          <div className="border border-gray-200 bg-gray-50 rounded-lg p-3">
            <a
              href={detail.registration.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link underline hover:text-link-hover"
            >
              {detail.registration.externalUrl}
            </a>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-6 mt-2">
        {/* 하단 액션 */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Button variant="outline" onClick={onReset} className="text-red-600 hover:bg-red-50">
              초기화
            </Button>
          </div>
          <Button onClick={onConfirm}>
            선택 확정 및 단계 2 진행 →
          </Button>
        </div>
      </div>
    </div>
  );
}
