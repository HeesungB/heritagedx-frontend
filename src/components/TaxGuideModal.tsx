"use client";

import { useEffect } from "react";

interface TaxGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 기본세율 안내 테이블 데이터
const TAX_RATE_TABLE = [
  { range: "1,400만원 이하", rate: "6%", deduction: "-" },
  { range: "5,000만원 이하", rate: "15%", deduction: "126만원" },
  { range: "8,800만원 이하", rate: "24%", deduction: "576만원" },
  { range: "1.5억원 이하", rate: "35%", deduction: "1,544만원" },
  { range: "3억원 이하", rate: "38%", deduction: "1,994만원" },
  { range: "5억원 이하", rate: "40%", deduction: "2,594만원" },
  { range: "10억원 이하", rate: "42%", deduction: "3,594만원" },
  { range: "10억원 초과", rate: "45%", deduction: "6,594만원" },
];

export default function TaxGuideModal({ isOpen, onClose }: TaxGuideModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">회원권 판매 세금 안내</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-8">
          {/* 01. 양도세 */}
          <section>
            <h3 className="text-lg font-bold mb-2">01. 양도세</h3>
            <p className="text-gray-600 mb-4">
              회원권을 매입했을 때보다 높은 가격에 매도해서 발생한 &apos;차익(이익)&apos;에 대해 납부하는 세금입니다.
            </p>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">양도세는 어떻게 계산되나요?</h4>
              <p className="text-gray-600 mb-3">
                양도차익에서 기본 공제를 제외한 금액에 세율을 적용하여 계산합니다.
              </p>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-sm">
                <p><strong>1.</strong> 판매가 - 구매가 - 필요경비 = 양도차익</p>
                <p className="pl-4 text-gray-600">필요경비 = 구매 시 부대비용 + 판매 시 부대비용</p>
                <p><strong>2.</strong> 양도차익 - 기본공제 = 과세표준</p>
                <p className="pl-4 text-gray-600">기본공제 = 250만원 (연 1회)</p>
                <p><strong>3.</strong> 과세표준 x 기본세율 = 산출세액</p>
                <p><strong>4.</strong> 산출세액 - 누진공제 = 양도세</p>
              </div>
            </div>

            {/* 기본세율 안내 테이블 */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2">기본세율 안내</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium">과세표준</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium">기본세율</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium">누진공제액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TAX_RATE_TABLE.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-200 px-3 py-2">{row.range}</td>
                        <td className="border border-gray-200 px-3 py-2 font-semibold">{row.rate}</td>
                        <td className="border border-gray-200 px-3 py-2">{row.deduction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 필요경비 안내 */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold mb-2">필요경비 증빙으로 세금 절감이 가능해요</h4>
              <p className="text-gray-600 text-sm mb-3">
                매매 시 발생한 부대비용 영수증을 잘 보관해두세요. 다음 증빙서류가 있으면 양도세 절감이 가능합니다.
              </p>
              <ol className="space-y-1 text-sm text-gray-700">
                <li>1. 구매 시 취득세 납부 영수증</li>
                <li>2. 구매 시 명의변경료</li>
                <li>3. 구매 시 거래수수료</li>
                <li>4. 판매 시 거래수수료</li>
              </ol>
            </div>
          </section>

          {/* 02. 주민세 */}
          <section>
            <h3 className="text-lg font-bold mb-2">02. 주민세</h3>
            <p className="text-gray-600 mb-4">
              양도세의 10%에 해당하는 금액으로, 관할 지자체에 납부하는 세금입니다. 양도세를 납부할 때 항상 함께 납부해야 합니다.
            </p>

            {/* 법인 회원 안내 */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <span className="text-yellow-600">&#x1F449;</span>
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">법인 회원이신가요?</h4>
                  <p className="text-sm text-yellow-700">
                    법인 명의로 판매하는 경우에는 양도세/주민세가 아닌 법인세 과세 대상입니다. 정확한 세금 계산은 세무사와 상담하시기를 권장드립니다.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            확인했어요
          </button>
        </div>
      </div>
    </div>
  );
}
