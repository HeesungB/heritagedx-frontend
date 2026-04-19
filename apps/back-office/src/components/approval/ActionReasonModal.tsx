"use client";

import { useEffect, useState } from "react";
import { Button, Textarea } from "@heritage-dx/ui";

export type ReasonAction = "HOLD" | "REJECT";

interface Props {
  open: boolean;
  action: ReasonAction | null;
  onConfirm: (reason: string) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const TITLES: Record<ReasonAction, { title: string; placeholder: string }> = {
  HOLD: { title: "보류 사유 입력", placeholder: "보류 사유를 입력하세요" },
  REJECT: { title: "반려 사유 입력", placeholder: "반려 사유를 입력하세요" },
};

export function ActionReasonModal({ open, action, onConfirm, onCancel, submitting }: Props) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  if (!open || !action) return null;
  const { title, placeholder } = TITLES[action];
  const trimmed = reason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          rows={4}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            취소
          </Button>
          <Button
            type="button"
            disabled={!trimmed || submitting}
            isLoading={submitting}
            onClick={() => onConfirm(trimmed)}
          >
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}
