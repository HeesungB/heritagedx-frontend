"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "@heritage-dx/ui";
import type { ConsultationApprovalFillableField } from "@heritage-dx/store";

interface ApprovalRequirementsPatch {
  customerName?: string;
  contact?: string;
  offerPrice?: number;
  depositAmount?: number;
}

interface ApprovalRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFillable: ConsultationApprovalFillableField[];
  initial: {
    customerName?: string;
    contact?: string;
    offerPrice?: number | null;
    depositAmount?: number | null;
  };
  onSubmit: (patch: ApprovalRequirementsPatch) => void | Promise<void>;
  isSubmitting?: boolean;
}

const FIELD_CONFIG: Record<
  ConsultationApprovalFillableField,
  { label: string; helper: string; type: "text" | "number"; placeholder: string }
> = {
  customerName: {
    label: "고객명",
    helper: "이름을 입력해 주세요.",
    type: "text",
    placeholder: "홍길동",
  },
  contact: {
    label: "연락처",
    helper: "연락처를 입력해 주세요.",
    type: "text",
    placeholder: "010-1234-5678",
  },
  offerPrice: {
    label: "제시가 (원)",
    helper: "0보다 큰 금액을 입력해 주세요.",
    type: "number",
    placeholder: "50000000",
  },
  depositAmount: {
    label: "계약금 (원)",
    helper: "0보다 큰 금액을 입력해 주세요.",
    type: "number",
    placeholder: "10000000",
  },
};

export default function ApprovalRequirementsModal({
  isOpen,
  onClose,
  missingFillable,
  initial,
  onSubmit,
  isSubmitting = false,
}: ApprovalRequirementsModalProps) {
  const [values, setValues] = useState<Record<ConsultationApprovalFillableField, string>>({
    customerName: "",
    contact: "",
    offerPrice: "",
    depositAmount: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    setValues({
      customerName: (initial.customerName ?? "").trim(),
      contact: (initial.contact ?? "").trim(),
      offerPrice:
        initial.offerPrice != null && initial.offerPrice > 0 ? String(initial.offerPrice) : "",
      depositAmount:
        initial.depositAmount != null && initial.depositAmount > 0
          ? String(initial.depositAmount)
          : "",
    });
  }, [isOpen, initial.customerName, initial.contact, initial.offerPrice, initial.depositAmount]);

  const { patch, isValid } = useMemo(() => {
    const next: ApprovalRequirementsPatch = {};
    let valid = missingFillable.length > 0;

    for (const field of missingFillable) {
      const raw = values[field];
      if (field === "customerName" || field === "contact") {
        const trimmed = raw.trim();
        if (!trimmed) {
          valid = false;
        } else {
          next[field] = trimmed;
        }
      } else {
        const num = Number(raw);
        if (raw === "" || !Number.isFinite(num) || num <= 0) {
          valid = false;
        } else {
          next[field] = num;
        }
      }
    }

    return { patch: next, isValid: valid };
  }, [missingFillable, values]);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    await onSubmit(patch);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="승인 요청 전 필수 입력"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid} isLoading={isSubmitting}>
            승인 요청
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 mb-3">
        승인 요청 전에 다음 값을 채워야 거래 내역으로 전환할 수 있습니다.
      </p>
      <div className="space-y-3">
        {missingFillable.map((field) => {
          const cfg = FIELD_CONFIG[field];
          return (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {cfg.label}
              </label>
              <input
                type={cfg.type}
                value={values[field]}
                onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                min={cfg.type === "number" ? 1 : undefined}
                placeholder={cfg.placeholder}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">{cfg.helper}</p>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
