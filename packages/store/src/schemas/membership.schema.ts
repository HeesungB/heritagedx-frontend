import { z } from "zod";
import { optionalNumber } from "./_shared";

export const membershipSchema = z.object({
  membershipType: z.enum(["개인", "법인"], {
    errorMap: () => ({ message: "회원권 종류를 선택하세요" }),
  }),
  membershipName: z.string().optional(),

  // 예약 안내
  reservationNotes: z.string().optional(),
  memberDaySchedule: z.string().optional(),

  // 시세 정보
  recentMarketPrice: z.string().optional(),
  recentPriceUpdateDate: z.string().optional(),
  dealerPriceRange: z.string().optional(),
  estimatedSalePrice: z.string().optional(),
  estimatedPriceDate: z.string().optional(),

  // 분양/입회 정보
  initialSalePrice: z.string().optional(),
  initialSaleYear: z.string().optional(),
  initialSaleMethod: z.string().optional(),
  registeredPersonCount: optionalNumber,

  // 회원 혜택/특이사항
  memberBenefits: z.string().optional(),
  specialNotes: z.string().optional(),

  // 명의개서 담당자
  transferManagerName: z.string().optional(),
  transferManagerPhone: z.string().optional(),
  buyerDocuments: z.string().optional(),
  sellerDocuments: z.string().optional(),

  // 메타 정보
  isActive: z.boolean(),
  displayOrder: optionalNumber,
});

export type MembershipFormValues = z.infer<typeof membershipSchema>;
