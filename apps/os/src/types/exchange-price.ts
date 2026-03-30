// 매물 리스트 API — 회원권별 대표가격
export interface MembershipListing {
  clubId: string;
  clubName: string;
  membershipId: string;
  membershipName: string;
  buyRepresentativePrice: number | null;
  sellRepresentativePrice: number | null;
}
