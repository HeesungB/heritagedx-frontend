import type { ReactNode } from "react";
import { cd } from "./styles";

interface EmptyCardProps {
  title: string;
  message?: string;
  actions?: ReactNode;
}

export function EmptyCard({ title, message = "데이터 준비 중", actions }: EmptyCardProps) {
  return (
    <div style={cd.card}>
      <div style={cd.cardHead}>
        <div style={cd.cardTitle}>{title}</div>
        {actions}
      </div>
      <div style={cd.emptyBox}>{message}</div>
    </div>
  );
}
