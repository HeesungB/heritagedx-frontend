"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClubDetailResponse } from "@/types";
import { useClubRepository, useAdminRepositories } from "@heritage-dx/api";
import { PageContainer } from "@/components/layout";
import { PageLoading } from "@heritage-dx/ui";
import DocumentForm, {
  DocumentUploadData,
} from "@/components/forms/DocumentForm";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function NewClubDocumentPage({ params }: PageProps) {
  const clubsRepo = useClubRepository();
  const { clubDocuments: clubDocumentsAdmin } = useAdminRepositories();
  const { code: clubCode } = use(params);
  const router = useRouter();
  const [club, setClub] = useState<ClubDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadClub();
  }, [clubCode]);

  const loadClub = async () => {
    setIsLoading(true);
    try {
      const response = await clubsRepo.getOne(clubCode);
      if (response.success && response.data) {
        setClub(response.data);
      }
    } catch (error) {
      console.error("Failed to load club:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (data: DocumentUploadData) => {
    if (!club?.id) {
      console.error("Club ID is missing");
      return;
    }
    setIsSaving(true);
    try {
      let response;
      if (data.file) {
        // 파일이 있으면 FormData로 업로드
        response = await clubDocumentsAdmin.uploadFile(
          club.id,
          data.file,
          data.name,
          data.fileDescription
        );
      } else {
        // 파일이 없으면 JSON으로 전송
        response = await clubDocumentsAdmin.create(club.id, {
          name: data.name,
          fileDescription: data.fileDescription,
        });
      }
      if (response.success) {
        router.push(`/clubs/${clubCode}?tab=documents`);
      } else {
        alert(response.error || "서류 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create document:", error);
      alert("서류 등록 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          href={`/clubs/${clubCode}?tab=documents`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          서류 목록으로 돌아가기
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">서류 등록</h1>
      <DocumentForm onSubmit={handleSubmit} isLoading={isSaving} />
    </PageContainer>
  );
}
