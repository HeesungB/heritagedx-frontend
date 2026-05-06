import { getCustomerGradeLabel, type CustomerEntity } from "@heritage-dx/store";
import { cd, getCustomerGradeColor, tagStyle } from "./styles";

interface PersonCardProps {
  customer: CustomerEntity;
}

function formatRegisteredAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function PersonCard({ customer }: PersonCardProps) {
  const gradeLabel = getCustomerGradeLabel(customer.customerGrade);
  const color = getCustomerGradeColor(customer.customerGrade);
  return (
    <div style={cd.personCard}>
      <div style={cd.personRow1}>
        <div style={cd.personLeft}>
          <div style={cd.personName}>{customer.name}</div>
          {gradeLabel && (
            <span style={tagStyle(color).wrap}>
              <span style={tagStyle(color).dot} />
              {gradeLabel}
            </span>
          )}
        </div>
      </div>
      <div style={cd.personRow2}>
        <span style={cd.metaItem}>
          <span style={cd.metaLabel}>연락처</span>
          <span style={cd.metaVal}>{customer.contact || "—"}</span>
        </span>
        <span style={cd.metaItem}>
          <span style={cd.metaLabel}>이메일</span>
          <span style={cd.metaVal}>{customer.email || "—"}</span>
        </span>
        <span style={cd.metaItem}>
          <span style={cd.metaLabel}>등록일</span>
          <span style={cd.metaVal}>{formatRegisteredAt(customer.createdAt)}</span>
        </span>
      </div>
    </div>
  );
}
