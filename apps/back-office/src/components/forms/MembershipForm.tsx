"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Membership } from "@/types";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
} from "@heritage-dx/ui";

// 빈 문자열을 undefined로 변환하는 헬퍼
const optionalNumber = z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  },
  z.number().optional()
);

const membershipSchema = z.object({
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
  avgMarketPrice3y: z.string().optional(),
  dealerPriceRange: z.string().optional(),

  // 거래 정보
  minTransactionUnit: z.string().optional(),
  transactionTendency: z.string().optional(),
  recentTransactionType: z.string().optional(),
  tradableTypeSummary: z.string().optional(),
  registrationDifficulty: z.string().optional(),
  additionalDocumentFrequency: z.string().optional(),
  balanceRisk: z.string().optional(),
  transactionRiskMemo: z.string().optional(),

  // 준회원 정보
  hasAssociateMember: z.boolean(),
  associateMemberCondition: z.string().optional(),

  // 가족회원 정보
  hasFamilyMember: z.boolean(),
  familyMemberCondition: z.string().optional(),

  // 위임 정보
  canDelegate: z.boolean(),
  delegationWeekdayRule: z.string().optional(),
  delegationWeekendRule: z.string().optional(),
  delegationRestriction: z.string().optional(),

  // 분양/입회 정보
  initialSalePrice: z.string().optional(),
  initialSaleYear: z.string().optional(),
  initialSaleMethod: z.string().optional(),
  estimatedSalePrice: z.string().optional(),
  estimatedPriceDate: z.string().optional(),
  registeredPersonCount: optionalNumber,
  admissionAge: optionalNumber,

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

type MembershipFormData = z.infer<typeof membershipSchema>;

interface MembershipFormProps {
  initialData?: Membership;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const riskOptions = [
  { value: "", label: "선택" },
  { value: "1", label: "1 (매우 낮음)" },
  { value: "2", label: "2 (낮음)" },
  { value: "3", label: "3 (보통)" },
  { value: "4", label: "4 (높음)" },
  { value: "5", label: "5 (매우 높음)" },
];

// 기본 그린피 유형
const DEFAULT_FEE_TYPES = ["정회원", "준회원", "무기명회원", "비회원", "위임", "동반"];

interface GreenFeeRow {
  type: string;
  weekday: string;
  weekend: string;
}

// initialData의 Record<string, number>에서 GreenFeeRow[] 로 변환
function buildGreenFeeRows(initialData?: Membership): GreenFeeRow[] {
  const weekday = initialData?.weekdayGreenFee || {};
  const weekend = initialData?.weekendGreenFee || {};
  const allTypes = new Set([...Object.keys(weekday), ...Object.keys(weekend)]);

  if (allTypes.size === 0) {
    // 기본 4종류
    return ["정회원", "준회원", "비회원"].map((t) => ({ type: t, weekday: "", weekend: "" }));
  }

  // 정렬
  const order = DEFAULT_FEE_TYPES;
  const sorted = Array.from(allTypes).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return sorted.map((type) => ({
    type,
    weekday: weekday[type] !== undefined ? String(weekday[type]) : "",
    weekend: weekend[type] !== undefined ? String(weekend[type]) : "",
  }));
}

export default function MembershipForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: MembershipFormProps) {
  const [showExtra, setShowExtra] = useState(false);
  const [greenFeeRows, setGreenFeeRows] = useState<GreenFeeRow[]>(() =>
    buildGreenFeeRows(initialData)
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: initialData
      ? {
          membershipType: (initialData.membershipType === "개인" || initialData.membershipType === "법인") ? initialData.membershipType : undefined as unknown as "개인" | "법인",
          membershipName: initialData.membershipName || "",
          reservationNotes: initialData.reservationNotes || "",
          memberDaySchedule: initialData.memberDaySchedule || "",
          recentMarketPrice: initialData.recentMarketPrice || "",
          recentPriceUpdateDate: initialData.recentPriceUpdateDate || "",
          avgMarketPrice3y: initialData.avgMarketPrice3y || "",
          dealerPriceRange: initialData.dealerPriceRange || "",
          minTransactionUnit: initialData.minTransactionUnit || "",
          transactionTendency: initialData.transactionTendency || "",
          recentTransactionType: initialData.recentTransactionType || "",
          tradableTypeSummary: initialData.tradableTypeSummary || "",
          registrationDifficulty: initialData.registrationDifficulty != null ? String(initialData.registrationDifficulty) : "",
          additionalDocumentFrequency: initialData.additionalDocumentFrequency != null ? String(initialData.additionalDocumentFrequency) : "",
          balanceRisk: initialData.balanceRisk != null ? String(initialData.balanceRisk) : "",
          transactionRiskMemo: initialData.transactionRiskMemo || "",
          hasAssociateMember: initialData.hasAssociateMember || false,
          associateMemberCondition: initialData.associateMemberCondition || "",
          hasFamilyMember: initialData.hasFamilyMember || false,
          familyMemberCondition: initialData.familyMemberCondition || "",
          canDelegate: initialData.canDelegate || false,
          delegationWeekdayRule: initialData.delegationWeekdayRule || "",
          delegationWeekendRule: initialData.delegationWeekendRule || "",
          delegationRestriction: initialData.delegationRestriction || "",
          initialSalePrice: initialData.initialSalePrice || "",
          initialSaleYear: initialData.initialSaleYear || "",
          initialSaleMethod: initialData.initialSaleMethod || "",
          estimatedSalePrice: initialData.estimatedSalePrice || "",
          estimatedPriceDate: initialData.estimatedPriceDate || "",
          registeredPersonCount: initialData.registeredPersonCount,
          admissionAge: initialData.admissionAge,
          memberBenefits: initialData.memberBenefits || "",
          specialNotes: initialData.specialNotes || "",
          transferManagerName: initialData.transferManagerName || "",
          transferManagerPhone: initialData.transferManagerPhone || "",
          buyerDocuments: initialData.buyerDocuments || "",
          sellerDocuments: initialData.sellerDocuments || "",
          isActive: initialData.isActive ?? true,
          displayOrder: initialData.displayOrder ?? 0,
        }
      : {
          membershipType: undefined as unknown as "개인" | "법인",
          hasAssociateMember: false,
          hasFamilyMember: false,
          canDelegate: false,
          isActive: true,
          displayOrder: 0,
        },
  });

  // 체크박스 상태 감시
  const hasAssociateMember = useWatch({ control, name: "hasAssociateMember" });
  const hasFamilyMember = useWatch({ control, name: "hasFamilyMember" });
  const canDelegate = useWatch({ control, name: "canDelegate" });

  // 그린피 행 관리
  const updateGreenFeeRow = (index: number, field: keyof GreenFeeRow, value: string) => {
    setGreenFeeRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addGreenFeeRow = () => {
    setGreenFeeRows((prev) => [...prev, { type: "", weekday: "", weekend: "" }]);
  };

  const removeGreenFeeRow = (index: number) => {
    setGreenFeeRows((prev) => prev.filter((_, i) => i !== index));
  };

  // API에서 거부하는 필드 목록 (백엔드 DTO에 미포함)
  const API_REJECTED_FIELDS = new Set([
    "hasAssociateMember",
    "hasFamilyMember",
    "canDelegate",
    "associateMemberCondition",
    "familyMemberCondition",
    "delegationWeekdayRule",
    "delegationWeekendRule",
    "delegationRestriction",
    "admissionAge",
  ]);

  // PUT 시 제외해야 하는 필드 (폼 관리 + 메타 + 관계 데이터)
  const EXCLUDE_FROM_PUT = new Set([
    ...Object.keys(membershipSchema.shape),
    ...API_REJECTED_FIELDS,
    "weekdayGreenFee",
    "weekendGreenFee",
    "id",
    "clubId",
    "createdAt",
    "updatedAt",
    "documents",
    "scenarios",
    "club",
  ]);

  // 폼 제출: Zod 데이터 + 그린피 Record + initialData의 미관리 필드 합치기
  const handleFormSubmit = (data: MembershipFormData) => {
    console.log("🟢 MembershipForm handleFormSubmit 진입, data:", data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleaned: Record<string, any> = {};

    // 1) initialData에서 폼이 관리하지 않는 필드 보존 (reservationSystem 등)
    //    단, 배열은 관계 데이터일 가능성이 높으므로 제외
    if (initialData) {
      for (const [key, value] of Object.entries(initialData)) {
        if (EXCLUDE_FROM_PUT.has(key)) continue;
        if (value === null || value === undefined) continue;
        if (Array.isArray(value)) continue;
        cleaned[key] = value;
      }
    }

    // 2) 폼 데이터 처리
    for (const [key, value] of Object.entries(data)) {
      if (value === "" || value === null || value === undefined) continue;
      if (API_REJECTED_FIELDS.has(key)) continue;
      // 1-5 정수 필드
      if (["registrationDifficulty", "additionalDocumentFrequency", "balanceRisk"].includes(key)) {
        cleaned[key] = parseInt(value as string, 10);
        continue;
      }
      // 숫자 필드
      if (key === "registeredPersonCount" || key === "displayOrder") {
        const num = Number(value);
        if (!isNaN(num)) {
          cleaned[key] = num;
          continue;
        }
      }
      cleaned[key] = value;
    }

    // 3) 그린피 Record 빌드
    const weekdayGreenFee: Record<string, number> = {};
    const weekendGreenFee: Record<string, number> = {};
    for (const row of greenFeeRows) {
      if (!row.type.trim()) continue;
      if (row.weekday && !isNaN(Number(row.weekday))) {
        weekdayGreenFee[row.type.trim()] = Number(row.weekday);
      }
      if (row.weekend && !isNaN(Number(row.weekend))) {
        weekendGreenFee[row.type.trim()] = Number(row.weekend);
      }
    }
    if (Object.keys(weekdayGreenFee).length > 0) cleaned.weekdayGreenFee = weekdayGreenFee;
    if (Object.keys(weekendGreenFee).length > 0) cleaned.weekendGreenFee = weekendGreenFee;

    return onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, (errors) => {
      console.error("🔴 MembershipForm 유효성 검증 실패:", errors);
      console.error("🔴 에러 필드:", Object.keys(errors));
      Object.entries(errors).forEach(([field, error]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.error(`  - ${field}:`, (error as any)?.message || error);
      });
    })} className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              회원권 종류 <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.membershipType ? "border-red-500" : "border-gray-300"
              }`}
              {...register("membershipType")}
            >
              <option value="">선택하세요</option>
              <option value="개인">개인</option>
              <option value="법인">법인</option>
            </select>
            {errors.membershipType && (
              <p className="mt-1 text-sm text-red-500">{errors.membershipType.message}</p>
            )}
          </div>
          <Input
            label="회원권명"
            placeholder="예: 정회원, 주중회원"
            {...register("membershipName")}
          />
        </CardContent>
      </Card>

      {/* 비용 정보 (그린피) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>그린피 정보</CardTitle>
            <button
              type="button"
              onClick={addGreenFeeRow}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="w-4 h-4" />
              유형 추가
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 w-32">구분</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">주중</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">주말</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {greenFeeRows.map((row, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="py-2 px-3">
                      <Input
                        value={row.type}
                        onChange={(e) => updateGreenFeeRow(index, "type", e.target.value)}
                        placeholder="유형명"
                        list="fee-type-suggestions"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        value={row.weekday}
                        onChange={(e) => updateGreenFeeRow(index, "weekday", e.target.value)}
                        placeholder="원"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        value={row.weekend}
                        onChange={(e) => updateGreenFeeRow(index, "weekend", e.target.value)}
                        placeholder="원"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <button
                        type="button"
                        onClick={() => removeGreenFeeRow(index)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <datalist id="fee-type-suggestions">
              {DEFAULT_FEE_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </CardContent>
      </Card>

      {/* 시세 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>시세 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="최근 시세"
            placeholder="1억 2천만원"
            {...register("recentMarketPrice")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="추정 시세"
              placeholder="1억 5천만원"
              {...register("estimatedSalePrice")}
            />
            <Input
              label="추정 시세 기준일"
              placeholder="예: 2025년 03월"
              {...register("estimatedPriceDate")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 분양/입회 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>분양/입회 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="분양가"
              placeholder="1억원"
              {...register("initialSalePrice")}
            />
            <Input
              label="기명인 수"
              type="number"
              placeholder="명"
              {...register("registeredPersonCount")}
            />
            <Input
              label="입회 나이"
              type="number"
              placeholder="세"
              {...register("admissionAge")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 예약 안내 */}
      <Card>
        <CardHeader>
          <CardTitle>예약 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="예약 안내"
            minRows={3}
            placeholder="예약 시 참고사항"
            {...register("reservationNotes")}
          />
          <Input
            label="회원의 날"
            placeholder="매월 2, 4주 일요일, 3대 국경일"
            {...register("memberDaySchedule")}
          />
        </CardContent>
      </Card>

      {/* 회원 혜택 */}
      <Card>
        <CardHeader>
          <CardTitle>회원 혜택</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="회원 혜택"
            minRows={3}
            placeholder="회원 혜택 내용을 입력하세요"
            {...register("memberBenefits")}
          />
          <Textarea
            label="특이사항"
            minRows={3}
            placeholder="특이사항을 입력하세요"
            {...register("specialNotes")}
          />
        </CardContent>
      </Card>

      {/* 명의개서 담당자 */}
      <Card>
        <CardHeader>
          <CardTitle>명의개서 담당자</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="담당자"
              placeholder="홍길동"
              {...register("transferManagerName")}
            />
            <Input
              label="연락처"
              placeholder="010-1234-5678"
              {...register("transferManagerPhone")}
            />
          </div>
          <Textarea
            label="매수 서류"
            minRows={2}
            placeholder="매수 시 필요한 서류"
            {...register("buyerDocuments")}
          />
          <Textarea
            label="매도 서류"
            minRows={2}
            placeholder="매도 시 필요한 서류"
            {...register("sellerDocuments")}
          />
        </CardContent>
      </Card>

      {/* ========== 엑스트라 정보 (접이식) ========== */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => setShowExtra(!showExtra)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-600">엑스트라 정보</span>
          {showExtra ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showExtra && (
          <div className="p-4 pt-0 space-y-6">
            {/* 준회원 정보 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  {...register("hasAssociateMember")}
                />
                <span className="text-sm font-medium text-gray-700">
                  준회원 제도 운영
                </span>
              </label>
              {hasAssociateMember && (
                <div className="space-y-2 pl-6 border-l-2 border-gray-200">
                  <Textarea
                    label="자격 조건"
                    minRows={2}
                    placeholder="준회원 자격 조건"
                    {...register("associateMemberCondition")}
                  />
                  <p className="text-sm text-gray-500">
                    준회원 그린피는 위 비용 정보 섹션에서 입력할 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 가족회원 정보 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  {...register("hasFamilyMember")}
                />
                <span className="text-sm font-medium text-gray-700">
                  가족회원 제도 운영
                </span>
              </label>
              {hasFamilyMember && (
                <div className="space-y-2 pl-6 border-l-2 border-gray-200">
                  <Textarea
                    label="자격 조건"
                    minRows={2}
                    placeholder="가족회원 자격 조건"
                    {...register("familyMemberCondition")}
                  />
                  <p className="text-sm text-gray-500">
                    가족회원 그린피는 위 비용 정보 섹션에서 입력할 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 위임 정보 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  {...register("canDelegate")}
                />
                <span className="text-sm font-medium text-gray-700">
                  예약 위임 가능
                </span>
              </label>
              {canDelegate && (
                <div className="space-y-2 pl-6 border-l-2 border-gray-200">
                  <Textarea
                    label="주중 위임 규정"
                    minRows={2}
                    placeholder="주중 예약 위임 규정"
                    {...register("delegationWeekdayRule")}
                  />
                  <Textarea
                    label="주말 위임 규정"
                    minRows={2}
                    placeholder="주말 예약 위임 규정"
                    {...register("delegationWeekendRule")}
                  />
                  <Textarea
                    label="위임 제한사항"
                    minRows={2}
                    placeholder="위임 관련 제한사항"
                    {...register("delegationRestriction")}
                  />
                </div>
              )}
            </div>

            {/* 추가 시세 정보 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">추가 시세 정보</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="시세 업데이트 일자"
                  type="date"
                  {...register("recentPriceUpdateDate")}
                />
                <Input
                  label="3년 평균 시세"
                  placeholder="1억 1천만원"
                  {...register("avgMarketPrice3y")}
                />
              </div>
              <Input
                label="딜러 체감 가격대"
                placeholder="1억 ~ 1.5억"
                {...register("dealerPriceRange")}
              />
            </div>

            {/* 거래 정보 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">거래 정보</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="거래 최소 단위"
                  placeholder="1구좌"
                  {...register("minTransactionUnit")}
                />
                <Input
                  label="체결 성향"
                  placeholder="안정적"
                  {...register("transactionTendency")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="최근 거래 형태"
                  placeholder="직거래, 중개거래"
                  {...register("recentTransactionType")}
                />
                <Input
                  label="거래 가능 유형 요약"
                  placeholder="개인/법인 거래 가능"
                  {...register("tradableTypeSummary")}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="명의개서 난이도"
                  options={riskOptions}
                  {...register("registrationDifficulty")}
                />
                <Select
                  label="추가 서류 빈도"
                  options={riskOptions}
                  {...register("additionalDocumentFrequency")}
                />
                <Select
                  label="잔금 리스크"
                  options={riskOptions}
                  {...register("balanceRisk")}
                />
              </div>
              <Textarea
                label="거래 리스크 메모"
                minRows={2}
                placeholder="거래 시 주의사항"
                {...register("transactionRiskMemo")}
              />
            </div>

            {/* 추가 분양 정보 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">추가 분양 정보</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="분양 연도"
                  placeholder="예: 2020"
                  {...register("initialSaleYear")}
                />
                <Input
                  label="분양 방식"
                  placeholder="공개분양, 회원모집"
                  {...register("initialSaleMethod")}
                />
              </div>
            </div>

            {/* 메타 정보 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">메타 정보</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      {...register("isActive")}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      활성화
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    비활성화하면 목록에서 숨김 처리됩니다
                  </p>
                </div>
                <Input
                  label="표시 순서"
                  type="number"
                  placeholder="0"
                  {...register("displayOrder")}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "저장 중..." : initialData ? "수정" : "등록"}
        </Button>
      </div>
    </form>
  );
}
