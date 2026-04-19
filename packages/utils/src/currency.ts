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
 * 원 단위 값을 "만원" 숫자 문자열(콤마 포함, 접미사 없음)로 반환
 * 예: 17_000_000 -> "1,700", null/0 이하 -> "—"
 */
export function toManwon(won: number | null | undefined): string {
  if (won == null || won <= 0) return "—";
  return Math.round(won / 10000).toLocaleString();
}

/**
 * 원 단위 금액을 억/천만/만 단위로 축약
 * 예: 123_000_000 -> "1.2억", 12_300_000 -> "1.2천만", 1_230_000 -> "123만"
 */
export function formatProfitShort(won: number): string {
  const manwon = wonToManwon(won);
  if (manwon >= 10000) {
    const eok = (manwon / 10000).toFixed(1);
    return `${eok}억`;
  }
  if (manwon >= 1000) {
    return `${(manwon / 1000).toFixed(1)}천만`;
  }
  return `${manwon}만`;
}

/**
 * 숫자 입력 필드용 포맷터 — 콤마 구분, 0 또는 undefined 는 빈 문자열
 */
export function formatKrwWithComma(value: number | undefined): string {
  if (!value) return "";
  return value.toLocaleString();
}

/**
 * 명의개서료 문자열을 원 단위로 변환
 * 예: "99만원" -> 990_000, "990,000원" -> 990_000, "99" -> 990_000 (만원 추정), 잘못된 입력 -> 990_000
 */
export function parseTransferFeeToWon(feeStr: string | null | undefined): number {
  if (!feeStr) return 990000;

  if (feeStr.includes("만원")) {
    const match = feeStr.match(/([0-9,]+)/);
    if (match) {
      const num = parseInt(match[1].replace(/,/g, ""), 10);
      return isNaN(num) ? 990000 : num * 10000;
    }
  }

  const match = feeStr.match(/([0-9,]+)/);
  if (match) {
    const won = parseInt(match[1].replace(/,/g, ""), 10);
    if (!isNaN(won)) {
      return won >= 10000 ? won : won * 10000;
    }
  }

  return 990000;
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
