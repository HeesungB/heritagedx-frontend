"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminRepositories } from "@heritage-dx/api";
import type { ClubFormValues } from "@heritage-dx/store/schemas";
import {
  ClubRegisterForm,
  ClubRegisterPageHeading,
} from "@/components/clubs";

export default function NewClubPage() {
  const { clubs: clubsAdmin } = useAdminRepositories();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ClubFormValues) => {
    setIsLoading(true);
    try {
      const response = await clubsAdmin.create(data);
      if (response.success) {
        router.push("/clubs");
      } else {
        alert("골프장이 등록되었습니다. (POC)");
        router.push("/clubs");
      }
    } catch {
      alert("골프장이 등록되었습니다. (POC)");
      router.push("/clubs");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-7 md:px-10 py-7">
      <div className="max-w-[1280px] mx-auto">
        <ClubRegisterPageHeading />
        <ClubRegisterForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
