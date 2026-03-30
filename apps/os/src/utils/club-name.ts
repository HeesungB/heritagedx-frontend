// 골프장명 정규화: CC/GC/접미사 제거, 괄호 제거, 소문자화
export function normalizeName(name: string): string {
  return name
    .replace(/\s+/g, "")
    .replace(/CC|GC|C\.C\.|G\.C\./gi, "")
    .replace(/(골프장|컨트리클럽|골프클럽|골프&리조트|골프리조트|골프링크스|골프코스)/gi, "")
    .replace(/\([^)]*\)/g, "")
    .toLowerCase();
}
