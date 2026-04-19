export interface ClubDocumentEntity {
  id: string;
  clubId: string;
  name: string;
  fileName?: string;
  fileDescription?: string;
  storageKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubScenarioDocumentEntity {
  id: string;
  clubId: string;
  scenarioId: string;
  clubDocumentId: string;
  name: string;
  fileName?: string;
  fileDescription?: string;
  minCount?: number;
  unit?: string;
  isMandatory?: boolean;
  notes?: string;
  displayOrder?: number;
  ownerTypes?: string[];
  createdAt?: string;
  updatedAt?: string;
}
