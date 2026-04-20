"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@heritage-dx/ui";

interface DepositAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void | Promise<void>;
  isSubmitting?: boolean;
  initialAmount?: number | null;
}

export default function DepositAmountModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialAmount = null,
}: DepositAmountModalProps) {
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount ? String(initialAmount) : "");
    }
  }, [isOpen, initialAmount]);

  const numericAmount = Number(amount);
  const isValid = amount !== "" && Number.isFinite(numericAmount) && numericAmount > 0;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    await onSubmit(numericAmount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="계약금 입력"
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
        승인 요청 전에 계약금이 필요합니다. 금액을 입력해 주세요.
      </p>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        계약금 (원)
      </label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        autoFocus
        min={1}
        placeholder="10000000"
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
      />
    </Modal>
  );
}
