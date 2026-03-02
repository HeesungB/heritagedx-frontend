// "XX골프장", "XXCC", "XXGC" 등 정규화
export function normalizeName(name: string): string {
  return name
    .replace(/\s+/g, "")
    .replace(/(골프장|컨트리클럽|CC|GC|골프클럽|골프&리조트|골프리조트)$/i, "")
    .toLowerCase();
}
