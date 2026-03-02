export interface Claim {
  id: string;
  category: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimInput {
  category: string;
  content: string;
}
