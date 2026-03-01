/**
 * 금액을 세자리 콤마와 원 단위로 포맷팅
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
}

/**
 * 만원 단위를 억원/만원 표시로 변환
 * 예: 17000 -> "1억 7,000만원"
 */
export function formatManwon(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const remaining = manwon % 10000;
    if (remaining === 0) {
      return `${eok}억원`;
    }
    return `${eok}억 ${remaining.toLocaleString("ko-KR")}만원`;
  }
  return `${manwon.toLocaleString("ko-KR")}만원`;
}

/**
 * 만원 단위를 원 단위로 변환
 */
export function manwonToWon(manwon: number): number {
  return manwon * 10000;
}

/**
 * 원 단위를 만원 단위로 변환
 */
export function wonToManwon(won: number): number {
  return Math.floor(won / 10000);
}

/**
 * 문자열에서 숫자만 추출
 */
export function parseNumber(str: string): number {
  const num = parseInt(str.replace(/[^0-9]/g, ""), 10);
  return isNaN(num) ? 0 : num;
}

/**
 * 명의개서료 문자열에서 숫자(만원) 추출
 * 예: "990,000원" -> 99, "99만원" -> 99
 */
export function parseTransferFee(feeStr: string | null | undefined): number {
  if (!feeStr) return 99; // 기본값 99만원

  // 만원 단위로 된 경우
  if (feeStr.includes("만원")) {
    const match = feeStr.match(/([0-9,]+)/);
    if (match) {
      return parseNumber(match[1]);
    }
  }

  // 원 단위로 된 경우
  const match = feeStr.match(/([0-9,]+)/);
  if (match) {
    const won = parseNumber(match[1]);
    return Math.round(won / 10000); // 원 -> 만원
  }

  return 99; // 기본값
}
