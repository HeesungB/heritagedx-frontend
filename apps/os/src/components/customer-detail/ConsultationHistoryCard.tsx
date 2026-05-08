"use client";

import { useEffect, useMemo } from "react";
import { useConsultations } from "@heritage-dx/store";
import { Loading } from "@heritage-dx/ui";
import { useAppStores } from "@/stores";
import { cd } from "./styles";
import { ConsultationRow } from "./ConsultationRow";

interface Props {
  customerId: string;
}

export function ConsultationHistoryCard({ customerId }: Props) {
  const { tradeMemo: consultationStore } = useAppStores();
  const { items, status, fetch, addNote } = useConsultations(consultationStore);

  useEffect(() => {
    void fetch({
      customerId,
      page: 1,
      limit: 50,
      sort: "createdAt",
      order: "DESC",
    });
  }, [customerId, fetch]);

  // store 가 다른 페이지(trade-memos) 와 공유되므로 customer 단위로 한 번 더 거름.
  const consultations = useMemo(
    () => items.filter((c) => c.customerId === customerId),
    [items, customerId],
  );

  const isLoading =
    status === "loading" || (status === "idle" && consultations.length === 0);

  return (
    <div style={cd.card}>
      <div style={cd.cardHead}>
        <div style={cd.cardTitle}>상담 이력</div>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>
          {consultations.length}건
        </span>
      </div>

      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "24px 0",
          }}
        >
          <Loading />
        </div>
      ) : consultations.length === 0 ? (
        <div style={cd.emptyBox}>등록된 상담이 없습니다.</div>
      ) : (
        <div
          style={{
            border: "1px solid var(--line-soft)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {consultations.map((c, i) => (
            <ConsultationRow
              key={c.id}
              item={c}
              isLast={i === consultations.length - 1}
              defaultOpen={i === 0}
              onAddNote={async (content) => {
                const result = await addNote(c.id, content);
                if (!result) {
                  throw new Error("메모 추가에 실패했습니다.");
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
