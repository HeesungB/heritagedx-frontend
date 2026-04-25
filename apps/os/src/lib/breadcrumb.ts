export const PAGE_TITLES: Record<string, string> = {
  "/": "홈",
  "/clubs": "골프장 검색",
  "/customers": "고객 관리",
  "/trades": "상담일지",
  "/claims": "건의 사항",
};

export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const base = "/" + pathname.split("/").filter(Boolean)[0];
  return PAGE_TITLES[base] ?? "";
}
