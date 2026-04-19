"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  ChevronRight,
  FileText,
  FolderOpen,
  Upload,
  Download,
  Loader2,
  X,
  File,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import {
  PageLoading,
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ConfirmModal,
  Drawer,
  Badge,
} from "@heritage-dx/ui";
import { useAdminRepositories } from "@heritage-dx/api";
import type { GlobalDocument } from "@heritage-dx/types";

export default function CommonDocumentsPage() {
  const { globalDocuments: globalDocumentsAdmin } = useAdminRepositories();
  const [documents, setDocuments] = useState<GlobalDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<GlobalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GlobalDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<GlobalDocument | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // 새 서류 추가 폼 상태
  const [newDocName, setNewDocName] = useState("");
  const [newDocDescription, setNewDocDescription] = useState("");
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 수정 폼 상태
  const [editDocName, setEditDocName] = useState("");
  const [editDocDescription, setEditDocDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // 파일 교체 상태
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [isReplacingFile, setIsReplacingFile] = useState(false);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // 다운로드 상태
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredDocuments(
        documents.filter(
          (d) =>
            (d.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.fileName || "").toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredDocuments(documents);
    }
  }, [searchTerm, documents]);

  // 선택된 서류가 변경될 때 수정 폼 초기화
  useEffect(() => {
    if (selectedDocument) {
      setEditDocName(selectedDocument.name || "");
      setEditDocDescription(selectedDocument.fileDescription || "");
      setReplaceFile(null);
    }
  }, [selectedDocument]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await globalDocumentsAdmin.getAll({ limit: 100 });
      if (response.success && response.data) {
        setDocuments(response.data.documents || []);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
      setDocuments([]);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      const response = await globalDocumentsAdmin.delete(deleteTarget.id);
      if (response.success) {
        setDocuments(documents.filter((d) => d.id !== deleteTarget.id));
        if (selectedDocument?.id === deleteTarget.id) {
          setSelectedDocument(null);
        }
      } else {
        alert(response.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleAddDocument = async () => {
    if (!newDocName.trim()) {
      alert("서류명을 입력해주세요.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await globalDocumentsAdmin.create(
        newDocFile,
        newDocName,
        newDocDescription || undefined
      );
      if (response.success) {
        alert("서류가 등록되었습니다.");
        setShowAddDrawer(false);
        resetAddForm();
        loadDocuments();
      } else {
        alert(response.error || "서류 등록에 실패했습니다.");
      }
    } catch {
      alert("서류 등록 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const handleUpdateDocument = async () => {
    if (!selectedDocument?.id) return;
    if (!editDocName.trim()) {
      alert("서류명을 입력해주세요.");
      return;
    }
    setIsEditing(true);
    try {
      const response = await globalDocumentsAdmin.update(selectedDocument.id, {
        name: editDocName,
        fileDescription: editDocDescription || undefined,
      });
      if (response.success) {
        alert("서류가 수정되었습니다.");
        loadDocuments();
        // 선택된 서류 정보 업데이트
        setSelectedDocument({
          ...selectedDocument,
          name: editDocName,
          fileDescription: editDocDescription,
        });
      } else {
        alert(response.error || "서류 수정에 실패했습니다.");
      }
    } catch {
      alert("서류 수정 중 오류가 발생했습니다.");
    }
    setIsEditing(false);
  };

  const handleReplaceFile = async () => {
    if (!selectedDocument?.id || !replaceFile) return;
    setIsReplacingFile(true);
    try {
      const response = await globalDocumentsAdmin.replaceFile(
        selectedDocument.id,
        replaceFile
      );
      if (response.success) {
        alert("파일이 교체되었습니다.");
        loadDocuments();
        setReplaceFile(null);
        // 서류 정보 다시 조회
        const docResponse = await globalDocumentsAdmin.getOne(selectedDocument.id);
        if (docResponse.success && docResponse.data) {
          setSelectedDocument(docResponse.data);
        }
      } else {
        alert(response.error || "파일 교체에 실패했습니다.");
      }
    } catch {
      alert("파일 교체 중 오류가 발생했습니다.");
    }
    setIsReplacingFile(false);
  };

  const handleDownload = async (doc: GlobalDocument) => {
    if (!doc.id) {
      alert("다운로드에 필요한 정보가 없습니다.");
      return;
    }

    setIsDownloading(true);

    try {
      const urlResponse = await globalDocumentsAdmin.getDownloadUrl(doc.id);

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
      link.download = doc.fileName || doc.name || "document.pdf";
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

  const resetAddForm = () => {
    setNewDocName("");
    setNewDocDescription("");
    setNewDocFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewDocFile(file);
    }
  };

  const handleReplaceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReplaceFile(file);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">공용 서류함</h1>
            <p className="text-sm text-gray-500">
              모든 골프장에서 공용으로 사용되는 서류를 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* 메인 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>서류 목록</CardTitle>
              <Badge variant="default">{documents.length}개</Badge>
            </div>
            <Button size="sm" onClick={() => setShowAddDrawer(true)}>
              <Plus className="w-4 h-4 mr-1" />
              새 서류 등록
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 검색 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="서류명 또는 파일명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 서류 목록 */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">
                  {searchTerm ? "검색 결과가 없습니다" : "등록된 서류가 없습니다"}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddDrawer(true)}
                    className="text-primary hover:underline text-sm"
                  >
                    새 서류 등록하기
                  </button>
                )}
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc)}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {doc.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doc.fileName || "파일 없음"}
                        {doc.fileDescription && ` · ${doc.fileDescription}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.storageKey && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(doc);
                        }}
                        disabled={isDownloading}
                        className="p-2 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="다운로드"
                      >
                        <Download className="w-4 h-4 text-gray-500 hover:text-primary" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(doc);
                      }}
                      className="p-2 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-error" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 서류 추가 Drawer */}
      <Drawer
        isOpen={showAddDrawer}
        onClose={() => {
          setShowAddDrawer(false);
          resetAddForm();
        }}
        title="새 서류 등록"
        width="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <Upload className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">공용 서류 등록</p>
                <p className="text-sm text-blue-700 mt-1">
                  여기서 등록한 서류는 모든 골프장에서 공용으로 사용할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 파일 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                파일 첨부
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.hwp,.xls,.xlsx"
                className="hidden"
              />
              {newDocFile ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <File className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {newDocFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(newDocFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewDocFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      클릭하여 파일을 선택하세요
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF, DOC, DOCX, HWP, XLS, XLSX (선택사항)
                    </p>
                  </div>
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                서류명 <span className="text-red-500">*</span>
              </label>
              <Input
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="예: 매매계약서"
              />
            </div>

            <Textarea
              label="설명"
              value={newDocDescription}
              onChange={(e) => setNewDocDescription(e.target.value)}
              placeholder="서류에 대한 설명을 입력하세요"
              minRows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDrawer(false);
                resetAddForm();
              }}
            >
              취소
            </Button>
            <Button onClick={handleAddDocument} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  등록 중...
                </>
              ) : (
                "등록"
              )}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 서류 상세/수정 Drawer */}
      <Drawer
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        title="서류 상세"
        width="lg"
      >
        {selectedDocument && (
          <div className="space-y-6">
            {/* 첨부 파일 정보 */}
            {selectedDocument.storageKey && (
              <Card>
                <CardHeader>
                  <CardTitle>첨부 파일</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedDocument.fileName || "첨부파일"}
                        </p>
                        {selectedDocument.fileDescription && (
                          <p className="text-sm text-gray-500">
                            {selectedDocument.fileDescription}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(selectedDocument)}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isDownloading ? "다운로드 중..." : "다운로드"}
                    </button>
                  </div>

                  {/* 파일 교체 */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      파일 교체
                    </p>
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      onChange={handleReplaceFileSelect}
                      accept=".pdf,.doc,.docx,.hwp,.xls,.xlsx"
                      className="hidden"
                    />
                    {replaceFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-3">
                            <File className="w-6 h-6 text-yellow-600" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {replaceFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(replaceFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setReplaceFile(null);
                              if (replaceFileInputRef.current) {
                                replaceFileInputRef.current.value = "";
                              }
                            }}
                            className="p-1 hover:bg-yellow-100 rounded"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleReplaceFile}
                          disabled={isReplacingFile}
                        >
                          {isReplacingFile ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              교체 중...
                            </>
                          ) : (
                            "파일 교체"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => replaceFileInputRef.current?.click()}
                        className="text-sm text-primary hover:underline"
                      >
                        새 파일로 교체하기
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 서류 정보 수정 폼 */}
            <Card>
              <CardHeader>
                <CardTitle>서류 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      서류명 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={editDocName}
                      onChange={(e) => setEditDocName(e.target.value)}
                      placeholder="서류명을 입력하세요"
                    />
                  </div>

                  <Textarea
                    label="설명"
                    value={editDocDescription}
                    onChange={(e) => setEditDocDescription(e.target.value)}
                    placeholder="서류에 대한 설명을 입력하세요"
                    minRows={3}
                  />

                  <div className="flex justify-end">
                    <Button
                      onClick={handleUpdateDocument}
                      disabled={isEditing}
                    >
                      {isEditing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        "저장"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 하단 버튼 */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(selectedDocument)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDocument(null)}
              >
                닫기
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="서류 삭제"
        message={`"${deleteTarget?.name}" 서류를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
