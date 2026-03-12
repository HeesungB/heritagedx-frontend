"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Club } from "@/types";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@heritage-dx/ui";

const clubSchema = z.object({
  code: z.string().min(1, "골프장 코드를 입력하세요"),
  name: z.string().min(1, "골프장명을 입력하세요"),
  companyName: z.string().optional(),
  region: z.string().optional(),
  address: z.string().optional(),
  openingDate: z.string().optional(),
  holes: z.string().optional(),
  memberCount: z.string().optional(),
  cityAccessibility: z.string().optional(),
  website: z.string().optional(),
  memo: z.string().optional(),
  dealerMemo: z.string().optional(),
});

type ClubFormData = z.infer<typeof clubSchema>;

interface ClubFormProps {
  initialData?: Club;
  onSubmit: (data: ClubFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function ClubForm({
  initialData,
  onSubmit,
  isLoading = false,
}: ClubFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: initialData
      ? {
          code: initialData.code || "",
          name: initialData.name || "",
          companyName: initialData.companyName || "",
          region: initialData.region || "",
          address: initialData.address || "",
          openingDate: initialData.openingDate || "",
          holes: initialData.holes || "",
          memberCount:
            typeof initialData.memberCount === "number"
              ? String(initialData.memberCount)
              : (initialData.memberCount as string) || "",
          cityAccessibility: initialData.cityAccessibility || "",
          website: initialData.website || "",
          memo: initialData.memo || "",
          dealerMemo: initialData.dealerMemo || "",
        }
      : {
          code: "",
          name: "",
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="골프장 코드"
              placeholder="G_XXX"
              error={errors.code?.message}
              required
              disabled={!!initialData}
              {...register("code")}
            />
            <Input
              label="골프장명"
              placeholder="88 CC"
              error={errors.name?.message}
              required
              {...register("name")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="회사명"
              placeholder="88 관광개발"
              {...register("companyName")}
            />
            <Input
              label="지역"
              placeholder="경기 용인시"
              {...register("region")}
            />
          </div>

          <Input
            label="주소"
            placeholder="경기도 용인시..."
            {...register("address")}
          />
          <Input
            label="홈페이지"
            placeholder="https://www.example.com"
            {...register("website")}
          />
        </CardContent>
      </Card>

      {/* 코스 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>코스 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="개장일"
              type="date"
              {...register("openingDate")}
            />
            <Input
              label="코스규모"
              placeholder="36홀"
              {...register("holes")}
            />
            <Input
              label="회원수"
              placeholder="1,979명"
              {...register("memberCount")}
            />
          </div>

          <Input
            label="도심 접근성"
            placeholder="서울에서 40분"
            {...register("cityAccessibility")}
          />
        </CardContent>
      </Card>

      {/* 내부 메모 */}
      <Card>
        <CardHeader>
          <CardTitle>내부 메모</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="메모"
            minRows={3}
            placeholder="기타 참고사항"
            {...register("memo")}
          />

          <Textarea
            label="딜러 메모"
            minRows={3}
            placeholder="딜러 특이사항"
            {...register("dealerMemo")}
          />
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
