"use client";

import { useState, FormEvent } from "react";
import { authApi } from "@/lib/authApi";
import { Modal, Button, Input } from "@heritage-dx/ui";

interface PasswordChangeModalProps {
  onSuccess: () => void;
}

export default function PasswordChangeModal({ onSuccess }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("현재 비밀번호를 입력하세요.");
      return;
    }
    if (!newPassword) {
      setError("새 비밀번호를 입력하세요.");
      return;
    }
    if (newPassword.length < 8) {
      setError("새 비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("현재 비밀번호와 다른 비밀번호를 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    const result = await authApi.changePassword({
      currentPassword,
      newPassword,
    });

    if (!result.success) {
      setError(result.error || "비밀번호 변경에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    onSuccess();
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => {}}
      title="비밀번호 변경"
    >
      <p className="text-sm text-gray-500 mb-4">
        보안을 위해 비밀번호를 변경해주세요.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <Input
          id="currentPassword"
          label="현재 비밀번호"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="현재 비밀번호를 입력하세요"
          autoComplete="current-password"
        />

        <Input
          id="newPassword"
          label="새 비밀번호"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="새 비밀번호를 입력하세요 (8자 이상)"
          autoComplete="new-password"
        />

        <Input
          id="confirmPassword"
          label="새 비밀번호 확인"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="새 비밀번호를 다시 입력하세요"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          className="w-full"
        >
          비밀번호 변경
        </Button>
      </form>
    </Modal>
  );
}
