export interface DocumentEntity {
  id: string;
  clubDocumentId: string | null;
  docCode: string | null;
  name: string;
  fileName: string | null;
  fileDescription: string | null;
  minCount: number;
  unit: string;
  isMandatory: boolean;
  notes: string;
  displayOrder: number;
  condition: string | null;
  clubRequirement: string | null;
  downloadUrl: string | null;
  downloadUrlExpiresAt: string | null;
}

export interface GlobalDocumentEntity {
  id: string;
  name: string;
  fileName: string | null;
  fileDescription: string | null;
  downloadUrl: string | null;
  downloadUrlExpiresAt: string | null;
}

export interface CustomerDocumentEntity {
  id: string;
  clubId: string | null;
  name: string;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MembershipDocumentEntity {
  id: string;
  membershipId: string;
  name: string;
  fileName: string;
  fileDescription: string;
  downloadUrl: string;
  downloadUrlExpiresAt: string;
}
