"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ScenarioEntity } from "@heritage-dx/store";
import {
  createScenarioSchema,
  updateScenarioSchema,
  normalizeSide,
  normalizeOwnerType,
  type CreateScenarioFormValues,
  type ScenarioFormValues,
} from "@heritage-dx/store/schemas";
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@heritage-dx/ui";

interface ScenarioFormProps {
  initialData?: ScenarioEntity;
  onSubmit: (data: ScenarioFormValues) => Promise<void>;
  isLoading?: boolean;
  isSimple?: boolean;
}

export default function ScenarioForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSimple = false,
}: ScenarioFormProps) {
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateScenarioFormValues>({
    resolver: zodResolver(
      isEditMode ? updateScenarioSchema : createScenarioSchema
    ),
    defaultValues: initialData
      ? {
          scenarioCode: initialData.scenarioCode || initialData.code || "",
          name: initialData.name || "",
          description: initialData.description || "",
          side: normalizeSide(initialData.side),
          ownerType: normalizeOwnerType(initialData.ownerType),
          hasProxy: initialData.hasProxy || false,
          isCertificateLost: initialData.isCertificateLost || false,
          isFamily: initialData.isFamily || false,
          requiresTaxInvoice: initialData.requiresTaxInvoice || false,
          displayOrder: initialData.displayOrder || 0,
          isActive: initialData.isActive !== false,
        }
      : {
          scenarioCode: "",
          name: "",
          side: "Seller" as const,
          ownerType: "Personal" as const,
          hasProxy: false,
          isCertificateLost: false,
          isFamily: false,
          requiresTaxInvoice: false,
          displayOrder: 0,
          isActive: true,
        },
  });

  const hasProxy = watch("hasProxy");
  const isCertificateLost = watch("isCertificateLost");
  const isFamily = watch("isFamily");
  const requiresTaxInvoice = watch("requiresTaxInvoice");
  const isActive = watch("isActive");

  // 폼 데이터를 API 형식으로 제출
  const handleFormSubmit = (data: CreateScenarioFormValues) => {
    const apiData = {
      ...data,
      displayOrder: data.displayOrder || 0,
    };
    // CreateScenarioFormValues 는 ScenarioFormValues 의 super-set (create 전용 필드 포함).
    // onSubmit 은 공통 ScenarioFormValues 계약으로 수용.
    return onSubmit(apiData as unknown as ScenarioFormValues);
  };

  // 간단한 등록 폼
  if (isSimple) {
    return (
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="시나리오명"
              placeholder="매도인-개인-직접거래"
              error={errors.name?.message}
              required
              {...register("name")}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="거래 당사자"
                options={[
                  { value: "Seller", label: "매도인" },
                  { value: "Buyer", label: "매수인" },
                ]}
                required
                {...register("side")}
              />
              <Select
                label="소유자 유형"
                options={[
                  { value: "Personal", label: "개인" },
                  { value: "Corporate", label: "법인" },
                ]}
                required
                {...register("ownerType")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시나리오 조건</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <input
                  type="checkbox"
                  id="hasProxy"
                  checked={hasProxy}
                  onChange={(e) => setValue("hasProxy", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="hasProxy" className="text-sm text-gray-700">
                  대리인
                </label>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <input
                  type="checkbox"
                  id="isCertificateLost"
                  checked={isCertificateLost}
                  onChange={(e) =>
                    setValue("isCertificateLost", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="isCertificateLost"
                  className="text-sm text-gray-700"
                >
                  증권분실
                </label>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <input
                  type="checkbox"
                  id="isFamily"
                  checked={isFamily}
                  onChange={(e) => setValue("isFamily", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isFamily" className="text-sm text-gray-700">
                  가족간거래
                </label>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <input
                  type="checkbox"
                  id="requiresTaxInvoice"
                  checked={requiresTaxInvoice}
                  onChange={(e) =>
                    setValue("requiresTaxInvoice", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="requiresTaxInvoice"
                  className="text-sm text-gray-700"
                >
                  세금계산서
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => history.back()}
          >
            취소
          </Button>
          <Button type="submit" isLoading={isLoading}>
            등록
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="시나리오 코드"
            placeholder="SELLER_INDIVIDUAL_DIRECT"
            error={
              (errors as { scenarioCode?: { message?: string } }).scenarioCode
                ?.message
            }
            required={!isEditMode}
            disabled={isEditMode}
            {...register("scenarioCode")}
          />
          <Input
            label="시나리오명"
            placeholder="매도인-개인-직접거래"
            error={errors.name?.message}
            required
            {...register("name")}
          />
          <Input
            label="설명"
            placeholder="시나리오에 대한 설명"
            {...register("description")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="표시 순서"
              type="number"
              placeholder="0"
              {...register("displayOrder")}
            />
            <div className="flex items-center gap-3 p-4 border rounded-lg h-fit mt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setValue("isActive", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                활성화
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>시나리오 조건</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="거래 당사자"
              options={[
                { value: "Seller", label: "매도인" },
                { value: "Buyer", label: "매수인" },
              ]}
              error={errors.side?.message}
              required
              {...register("side")}
            />
            <Select
              label="소유자 유형"
              options={[
                { value: "Personal", label: "개인" },
                { value: "Corporate", label: "법인" },
              ]}
              error={errors.ownerType?.message}
              required
              {...register("ownerType")}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <input
                type="checkbox"
                id="hasProxy-full"
                checked={hasProxy}
                onChange={(e) => setValue("hasProxy", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="hasProxy-full" className="text-sm text-gray-700">
                대리인 여부
              </label>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <input
                type="checkbox"
                id="isCertificateLost-full"
                checked={isCertificateLost}
                onChange={(e) =>
                  setValue("isCertificateLost", e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="isCertificateLost-full"
                className="text-sm text-gray-700"
              >
                증권 분실 여부
              </label>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <input
                type="checkbox"
                id="isFamily-full"
                checked={isFamily}
                onChange={(e) => setValue("isFamily", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isFamily-full" className="text-sm text-gray-700">
                가족간 거래
              </label>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <input
                type="checkbox"
                id="requiresTaxInvoice-full"
                checked={requiresTaxInvoice}
                onChange={(e) =>
                  setValue("requiresTaxInvoice", e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="requiresTaxInvoice-full"
                className="text-sm text-gray-700"
              >
                세금계산서 필요
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>
          취소
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "수정" : "등록"}
        </Button>
      </div>
    </form>
  );
}
