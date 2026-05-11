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

// 정식명 → 약칭 매핑
const PROVINCE_NORMALIZE: Record<string, string> = {
  경기도: "경기", 강원도: "강원", 충청북도: "충북", 충청남도: "충남",
  전라북도: "전북", 전라남도: "전남", 경상북도: "경북", 경상남도: "경남",
  제주도: "제주", 제주특별자치도: "제주",
  서울특별시: "서울", 부산광역시: "부산", 대구광역시: "대구",
  인천광역시: "인천", 광주광역시: "광주", 대전광역시: "대전",
  울산광역시: "울산", 세종특별자치시: "세종",
};

/** 지역 문자열에서 첫 단어(도/시) 추출 후 약칭으로 정규화: "경기도 용인시" → "경기" */
export function getProvince(region: string): string {
  const first = region.trim().split(/\s+/)[0];
  return PROVINCE_NORMALIZE[first] ?? first;
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

// 첫 단어 정규화에서 누락된 경우(예: "제주시", "용인시" 처럼 도 prefix 없는 시 단독)
// 를 위한 부분 문자열 매칭 키워드. 정렬은 의미 없고, 어느 하나만 region 안에 포함되면 매칭.
const REGION_KEYWORDS: Record<string, string> = {
  ...REGION_GROUP_MAP,
  // 도/광역 풀네임을 contains 매칭 보강
  충청: "충청도", 전라: "전라도", 경상: "경상도",
};

export const REGION_GROUPS = ["수도권", "강원도", "충청도", "전라도", "경상도", "제주도", "해외"] as const;

/**
 * 지역 문자열 → 광역 그룹 반환.
 * - region 이 비어있으면 null
 * - 1차: 첫 단어를 약칭 정규화 후 REGION_GROUP_MAP 매칭 (예: "경기도 용인시" → "경기" → "수도권")
 * - 2차: 첫 단어가 미매칭이면 region 전체 문자열에서 한국 키워드 부분 매칭 (예: "제주시" → "제주" 포함 → "제주도")
 * - 그 외 → "해외"
 */
export function getRegionGroup(region: string): string | null {
  const trimmed = region.trim();
  if (!trimmed) return null;
  const province = getProvince(trimmed);
  const exact = REGION_GROUP_MAP[province];
  if (exact) return exact;
  for (const [keyword, group] of Object.entries(REGION_KEYWORDS)) {
    if (trimmed.includes(keyword)) return group;
  }
  return "해외";
}

/** address에서 "도 시" 부분 추출 (예: "경기도 용인시 처인구 ..." → "경기도 용인시") */
export function extractRegionFromAddress(address: string): string {
  const parts = address.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return parts[0] || "";
}

/** club의 region이 비어있으면 address에서 추출 */
export function getEffectiveRegion(region: string, address: string): string {
  if (region) return region;
  if (address) return extractRegionFromAddress(address);
  return "";
}
