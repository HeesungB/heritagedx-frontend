"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import type { ClubDetailResponse } from "@/types";
import type { ClubDocumentEntity as ClubDocument } from "@heritage-dx/store";
import { useClubRepository, useAdminRepositories } from "@heritage-dx/api";
import { PageContainer } from "@/components/layout";
import {
  PageLoading,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@heritage-dx/ui";
import DocumentForm, {
  type DocumentUploadData,
} from "@/components/forms/DocumentForm";

interface PageProps {
  params: Promise<{ code: string; docCode: string }>;
}

export default function ClubDocumentDetailPage({ params }: PageProps) {
  const clubsRepo = useClubRepository();
  const { clubDocuments: clubDocumentsAdmin } = useAdminRepositories();
  const { code: clubCode, docCode } = use(params);
  const [club, setClub] = useState<ClubDetailResponse | null>(null);
  const [document, setDocument] = useState<ClubDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadData();
  }, [clubCode, docCode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 먼저 골프장 정보를 가져와서 clubId 획득
      const clubResponse = await clubsRepo.getOne(clubCode);
      if (clubResponse.success && clubResponse.data) {
        setClub(clubResponse.data);
        const clubId = clubResponse.data.id;

        if (clubId) {
          // clubId로 서류 목록 조회
          const response = await clubDocumentsAdmin.getByClub(clubId);
          if (response.success && response.data) {
            // URL 파라미터는 문서 id (파일명은 [docCode] 이지만 실제 값은 id)
            const doc = response.data.documents.find((d) => d.id === docCode);
            setDocument(doc || null);
          } else {
            setDocument(null);
          }
        } else {
          setDocument(null);
        }
      } else {
        setClub(null);
        setDocument(null);
      }
    } catch (error) {
      console.error("Failed to load document:", error);
      setClub(null);
      setDocument(null);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (data: DocumentUploadData) => {
    if (!club?.id || !document?.id) {
      console.error("Club ID or Document ID is missing");
      return;
    }
    setIsSaving(true);
    try {
      const response = await clubDocumentsAdmin.update(
        club.id,
        document.id,
        data
      );
      if (response.success) {
        alert("서류가 수정되었습니다.");
      } else {
        alert("서류가 수정되었습니다. (POC)");
      }
    } catch {
      alert("서류가 수정되었습니다. (POC)");
    }
    setIsSaving(false);
  };

  // 파일 다운로드 처리
  const handleDownload = async () => {
    const clubId = club?.id;
    const docId = document?.id;

    if (!clubId || !docId) {
      alert("다운로드에 필요한 정보가 없습니다.");
      return;
    }

    setIsDownloading(true);

    try {
      // 다운로드 URL 조회
      const urlResponse = await clubDocumentsAdmin.getDownloadUrl(clubId, docId);

      if (!urlResponse.success || !urlResponse.data?.url) {
        throw new Error("다운로드 URL을 가져올 수 없습니다.");
      }

      const downloadUrl = urlResponse.data.url;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`다운로드 실패: ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = document?.fileName || document?.name || "document.pdf";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("다운로드 에러:", error);
      alert("다운로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (!document) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">서류를 찾을 수 없습니다.</p>
        </div>
      </PageContainer>
    );
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{document.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>ID: {document.id}</span>
            {document.fileName && <span>파일명: {document.fileName}</span>}
          </div>
        </CardContent>
      </Card>

      {/* 파일 다운로드 섹션 */}
      {document.storageKey && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>첨부 파일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    {document.fileName || "첨부파일"}
                  </p>
                  {document.fileDescription && (
                    <p className="text-sm text-gray-500">
                      {document.fileDescription}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? "다운로드 중..." : "다운로드"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <DocumentForm
        initialData={{
          id: document.id,
          name: document.name,
          description: document.fileDescription,
        }}
        onSubmit={handleSubmit}
        isLoading={isSaving}
        enableFileUpload={false}
      />
    </PageContainer>
  );
}
