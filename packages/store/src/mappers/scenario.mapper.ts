import type { ScenarioWithDocuments } from "@heritage-dx/types";
import type { ScenarioWithDocsEntity } from "../entities/scenario";
import { mapDocumentDtoToEntity, mapDocumentsSummaryDtoToEntity } from "./document.mapper";

export function mapScenarioWithDocsDtoToEntity(
  dto: ScenarioWithDocuments,
): ScenarioWithDocsEntity {
  return {
    scenario: {
      scenarioCode: dto.scenario.scenarioCode,
      name: dto.scenario.name,
      description: dto.scenario.description ?? null,
    },
    documentsLocal: dto.documentsLocal.map(mapDocumentDtoToEntity),
    summary: mapDocumentsSummaryDtoToEntity(dto.summary),
  };
}
