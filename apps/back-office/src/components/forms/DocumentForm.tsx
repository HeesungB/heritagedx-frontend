"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, FileText } from "lucide-react";
interface DocumentInitialData {
  id?: string;
  name?: string;
  description?: string;
}
import { documentSchema, type DocumentFormValues } from "@heritage-dx/store/schemas";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@heritage-dx/ui";

export interface DocumentUploadData extends DocumentFormValues {
  file?: File;
}

interface DocumentFormProps {
  initialData?: DocumentInitialData;
  onSubmit: (data: DocumentUploadData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  enableFileUpload?: boolean;
}

export default function DocumentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  enableFileUpload = true,
}: DocumentFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || "",
          fileDescription: initialData.description || "",
        }
      : {
          name: "",
          fileDescription: "",
        },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onFormSubmit = (data: DocumentFormValues) => {
    onSubmit({
      ...data,
      file: selectedFile || undefined,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialData?.id && (
            <Input
              label="서류 ID"
              value={initialData.id}
              disabled
            />
          )}
          <Input
            label="서류명"
            placeholder="인감증명서"
            error={errors.name?.message}
            required
            {...register("name")}
          />
          <Input
            label="파일 설명"
            placeholder="서류에 대한 설명"
            {...register("fileDescription")}
          />
        </CardContent>
      </Card>

      {enableFileUpload && (
        <Card>
          <CardHeader>
            <CardTitle>파일 업로드</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.hwp,.hwpx,.jpg,.jpeg,.png"
            />
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  클릭하거나 파일을 드래그하여 업로드
                </p>
                <p className="text-xs text-gray-400">
                  PDF, DOC, DOCX, HWP, HWPX, JPG, PNG 지원
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : history.back())}
        >
          취소
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "수정" : "등록"}
        </Button>
      </div>
    </form>
  );
}
