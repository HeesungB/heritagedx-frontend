import { z } from "zod";
import type { ScenarioSide, ScenarioOwnerType } from "@heritage-dx/types";

// API 값을 폼 값으로 정규화 (API → Form)
// 반환 타입은 스키마 enum 값과 일치시킨다 (ScenarioSide/ScenarioOwnerType는 API 상 더 넓은 타입이므로 리터럴로 좁힘)
export const normalizeSide = (side: string | undefined): "Seller" | "Buyer" => {
  if (!side) return "Seller";
  const upper = side.toUpperCase();
  return upper === "SELLER" ? "Seller" : "Buyer";
};

export const normalizeOwnerType = (
  ownerType: string | undefined
): "Personal" | "Corporate" => {
  if (!ownerType) return "Personal";
  const upper = ownerType.toUpperCase();
  if (upper === "CORPORATE") return "Corporate";
  if (upper === "PERSONAL" || upper === "INDIVIDUAL") return "Personal";
  return "Personal";
};

const SCENARIO_SIDES = ["Seller", "Buyer"] as const satisfies readonly ScenarioSide[];
const SCENARIO_OWNER_TYPES = ["Personal", "Corporate"] as const satisfies readonly ScenarioOwnerType[];

export const createScenarioSchema = z.object({
  scenarioCode: z.string().min(1, "시나리오 코드를 입력하세요"),
  name: z.string().min(1, "시나리오명을 입력하세요"),
  description: z.string().optional(),
  side: z.enum(SCENARIO_SIDES),
  ownerType: z.enum(SCENARIO_OWNER_TYPES),
  hasProxy: z.boolean(),
  isCertificateLost: z.boolean(),
  isFamily: z.boolean(),
  requiresTaxInvoice: z.boolean(),
  displayOrder: z.coerce.number().optional(),
  isActive: z.boolean(),
});

export const updateScenarioSchema = z.object({
  name: z.string().min(1, "시나리오명을 입력하세요"),
  description: z.string().optional(),
  side: z.enum(SCENARIO_SIDES),
  ownerType: z.enum(SCENARIO_OWNER_TYPES),
  hasProxy: z.boolean(),
  isCertificateLost: z.boolean(),
  isFamily: z.boolean(),
  requiresTaxInvoice: z.boolean(),
  displayOrder: z.coerce.number().optional(),
  isActive: z.boolean(),
});

export type CreateScenarioFormValues = z.infer<typeof createScenarioSchema>;
export type UpdateScenarioFormValues = z.infer<typeof updateScenarioSchema>;
export type ScenarioFormValues = CreateScenarioFormValues | UpdateScenarioFormValues;
