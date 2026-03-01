// 한글 초성 14개 + 숫자
export const INITIALS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "0-9",
] as const;

// 유니코드 초성 인덱스 → 초성 문자 (19개, 쌍자음 포함)
const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ",
  "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

// 쌍자음 → 단자음 매핑
const DOUBLE_TO_SINGLE: Record<string, string> = {
  "ㄲ": "ㄱ",
  "ㄸ": "ㄷ",
  "ㅃ": "ㅂ",
  "ㅆ": "ㅅ",
  "ㅉ": "ㅈ",
};

/** 문자열 첫 글자의 초성을 추출 (숫자면 "0-9", 한글이 아니면 "#") */
export function getKoreanInitial(str: string): string {
  const ch = str.charAt(0);
  if (ch >= "0" && ch <= "9") return "0-9";
  const code = str.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "#";
  return CHOSEONG[Math.floor(code / 588)];
}

/** 쌍자음을 단자음으로 정규화 */
export function normalizeInitial(initial: string): string {
  return DOUBLE_TO_SINGLE[initial] ?? initial;
}

/** 지역 문자열에서 첫 단어(도/시) 추출: "충남 아산시" → "충남" */
export function getProvince(region: string): string {
  return region.trim().split(/\s+/)[0];
}

// 도/시 약칭 → 광역 그룹 매핑
const REGION_GROUP_MAP: Record<string, string> = {
  서울: "수도권", 경기: "수도권", 인천: "수도권",
  강원: "강원도",
  충남: "충청도", 충북: "충청도", 대전: "충청도", 세종: "충청도",
  전남: "전라도", 전북: "전라도", 광주: "전라도",
  경남: "경상도", 경북: "경상도", 대구: "경상도", 부산: "경상도", 울산: "경상도",
  제주: "제주도",
};

export const REGION_GROUPS = ["수도권", "강원도", "충청도", "전라도", "경상도", "제주도"] as const;

/** 지역 문자열 → 광역 그룹 반환. 매핑 없으면 null */
export function getRegionGroup(region: string): string | null {
  const province = getProvince(region);
  return REGION_GROUP_MAP[province] ?? null;
}
