export default function OperatorNotice() {
  return (
    <div className="border border-gray-300 rounded p-4 mt-6">
      <p className="font-semibold mb-2">운영자 법적 책임 범위</p>
      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
        <li>골프장 정보 정확성 확인 (공식 자료 대조)</li>
        <li>시스템 데이터 갱신 후 정책 변경 여부 확인</li>
        <li>선택 골프장과 실제 양수 대상지 일치 여부</li>
      </ul>
    </div>
  );
}
