/**
 * 010-XXXX-XXXX 형식의 한국 휴대폰 번호 자동 포맷.
 * 입력에서 숫자만 추출 → 11자리로 잘라낸 뒤 길이별 하이픈 삽입.
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const KOREAN_MOBILE_RE = /^010-\d{4}-\d{4}$/;

export function isValidKoreanMobile(value: string): boolean {
  return KOREAN_MOBILE_RE.test(value);
}
