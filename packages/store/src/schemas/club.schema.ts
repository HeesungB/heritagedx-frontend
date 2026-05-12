import { z } from "zod";
import { optionalNumber } from "./_shared";

// ClubForm (생성/수정 기본 폼)
export const clubBaseSchema = z.object({
  code: z.string().min(1, "골프장 코드를 입력하세요"),
  name: z.string().min(1, "골프장명을 입력하세요"),
  companyName: z.string().optional(),
  region: z.string().optional(),
  address: z.string().optional(),
  openingDate: z.string().optional(),
  holes: z.string().optional(),
  totalLength: z.string().optional(),
  memberCount: z.string().optional(),
  website: z.string().optional(),
});

export type ClubFormValues = z.infer<typeof clubBaseSchema>;

// 클럽 상세 페이지 기본정보 수정 폼 (clubBaseSchema superset)
export const clubDetailSchema = z.object({
  name: z.string().min(1, "골프장명을 입력하세요"),
  companyName: z.string().optional(),
  region: z.string().optional(),
  address: z.string().optional(),
  openingDate: z.string().optional(),
  holes: z.string().optional(),
  totalLength: z.string().optional(),
  memberCount: z.string().optional(),
  membershipInfo: z.string().optional(),
  introduction: z.string().optional(),
  facilities: z.string().optional(),
  registrationFee: z.string().optional(),
  stampDuty: z.string().optional(),
  agencyFee: z.string().optional(),
  otherCosts: z.string().optional(),
  website: z.string().optional(),
  caddyFee: optionalNumber,
  cartFee: optionalNumber,
});

export type ClubDetailFormValues = z.infer<typeof clubDetailSchema>;
