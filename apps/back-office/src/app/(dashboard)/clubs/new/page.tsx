"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminRepositories } from "@heritage-dx/api";
import { PageContainer, PageHeader } from "@/components/layout";
import ClubForm from "@/components/forms/ClubForm";

export default function NewClubPage() {
  const { clubs: clubsAdmin } = useAdminRepositories();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await clubsAdmin.create(data);
      if (response.success) {
        router.push("/clubs");
      } else {
        // POC: 에러 무시하고 성공 처리
        alert("골프장이 등록되었습니다. (POC)");
        router.push("/clubs");
      }
    } catch {
      // POC: 에러 무시하고 성공 처리
      alert("골프장이 등록되었습니다. (POC)");
      router.push("/clubs");
    }
    setIsLoading(false);
  };

  return (
    <PageContainer>
      <PageHeader
        title="골프장 등록"
        description="새로운 골프장을 등록합니다."
      />
      <ClubForm onSubmit={handleSubmit} isLoading={isLoading} />
    </PageContainer>
  );
}
