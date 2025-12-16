export default function SystemNotice() {
  return (
    <div className="bg-gray-900 text-white p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚠</span>
        <h2 className="text-lg font-semibold">시스템 권한 제한</h2>
      </div>
      <p className="mb-4">
        <strong>본 시스템은 법적 판단 권한 없음.</strong> Heritage OS (HDX)는
        기술적 적합성 평가만 수행. 모든 출력 결과는 기술 검증 소견이며 법적 의견
        아님.
      </p>
      <p className="mb-2">운영자 및 제출자의 책임 범위:</p>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>모든 결과의 법적 해석</li>
        <li>외부 정책 적합성 검증</li>
        <li>최종 제출 판단</li>
        <li>전문 법률 자문 수행 여부</li>
      </ul>
      <hr className="border-gray-600 my-4" />
      <p>
        <strong>비구속 기술 평가:</strong> 본 평가는 기술 문서이며, 법률
        자문·법률 의견·권리·의무에 대한 구속력 있는 판정 아님.
      </p>
    </div>
  );
}
