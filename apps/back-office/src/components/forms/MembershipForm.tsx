"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { MembershipEntity } from "@heritage-dx/store";
import { membershipSchema, type MembershipFormValues } from "@heritage-dx/store/schemas";
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

interface MembershipFormProps {
  initialData?: MembershipEntity;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
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
function buildGreenFeeRows(initialData?: MembershipEntity): GreenFeeRow[] {
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

export default function MembershipEntityForm({
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
  } = useForm<MembershipFormValues>({
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
          initialSalePrice: initialData.initialSalePrice || "",
          initialSaleYear: initialData.initialSaleYear || "",
          initialSaleMethod: initialData.initialSaleMethod || "",
          estimatedSalePrice: initialData.estimatedSalePrice || "",
          estimatedPriceDate: initialData.estimatedPriceDate || "",
          registeredPersonCount: initialData.registeredPersonCount ?? undefined,
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
          isActive: true,
          displayOrder: 0,
        },
  });

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

  // PUT 시 제외해야 하는 필드 (폼 관리 + 메타 + 관계 데이터)
  const EXCLUDE_FROM_PUT = new Set([
    ...Object.keys(membershipSchema.shape),
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
  const handleFormSubmit = (data: MembershipFormValues) => {
    console.log("🟢 MembershipEntityForm handleFormSubmit 진입, data:", data);
    const cleaned: Record<string, unknown> = {};

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
      console.error("🔴 MembershipEntityForm 유효성 검증 실패:", errors);
      console.error("🔴 에러 필드:", Object.keys(errors));
      Object.entries(errors).forEach(([field, error]) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? (error as { message?: unknown }).message
            : error;
        console.error(`  - ${field}:`, message);
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
