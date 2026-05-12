"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Grid3X3, Loader2, AlertCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useMyOrganization, canManageOrg } from "@heritage-dx/store";
import type { OrganizationEntity } from "@heritage-dx/store";

const DASH = "—";

function splitBusinessTypes(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,·/]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function formatUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function isFilled(v: unknown): v is string | number {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return true;
  return false;
}

export default function MyOrganizationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const isAdmin = canManageOrg(user);
  const {
    data: organization,
    isLoading,
    error: orgError,
  } = useMyOrganization(isAdmin ? user?.organizationId : undefined);
  const error = orgError?.message ?? null;

  useEffect(() => {
    if (user && !isAdmin) {
      router.replace("/");
    }
  }, [user, isAdmin, router]);

  const businessTypes = useMemo(
    () => splitBusinessTypes(organization?.businessType),
    [organization?.businessType],
  );

  const handleEdit = () => {
    toast.info("준비 중인 기능입니다", {
      description: "조직 정보 수정은 추후 업데이트 예정입니다.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!organization) return null;

  const rows = buildInfoRows(organization, businessTypes);

  return (
    <div className="px-10 pt-10 pb-14 overflow-y-auto">
      <div className="max-w-[920px] mx-auto">
        {/* Page header */}
        <div className="flex justify-between items-start gap-6 mb-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-neutral-50 grid place-items-center text-neutral-900 flex-shrink-0">
              <Grid3X3 className="w-[18px] h-[18px]" strokeWidth={1.6} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
                Organization
              </span>
              <h1 className="text-2xl font-bold tracking-[-0.025em] leading-[1.2] text-neutral-900 m-0">
                나의 조직
              </h1>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 pt-1.5">
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-neutral-900 bg-surface border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <Pencil className="w-[13px] h-[13px]" strokeWidth={1.7} />
              <span>정보 수정</span>
            </button>
          </div>
        </div>

        {/* Panel */}
        <div className="border border-neutral-100 rounded-card bg-surface overflow-hidden">
          <div className="px-6 pt-[18px] pb-[14px] border-b border-neutral-100 flex items-baseline justify-between gap-4">
            <h2 className="text-[13.5px] font-semibold text-neutral-900 tracking-[-0.01em] m-0">
              조직 정보
            </h2>
          </div>

          {rows.map((row, idx) => (
            <div
              key={row.label}
              className={`grid grid-cols-[200px_1fr] items-center px-6 py-4 gap-6 min-h-[56px] ${
                idx === 0 ? "" : "border-t border-neutral-50"
              }`}
            >
              <span className="text-[12.5px] text-neutral-500 font-medium tracking-[0.005em]">
                {row.label}
              </span>
              <div className="text-[13.5px] text-neutral-900 font-medium tracking-[-0.005em]">
                {row.value}
              </div>
            </div>
          ))}

          <div className="px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
            <span className="text-[11.5px] text-neutral-400 font-mono tracking-[0.02em]">
              Last updated · {formatUpdatedAt(organization.updatedAt)}
            </span>
            <span className="text-[11.5px] text-neutral-400 font-mono tracking-[0.02em]">
              {rows.length} fields
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Muted() {
  return <span className="text-neutral-400">{DASH}</span>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[13px] font-medium tracking-normal">
      {children}
    </span>
  );
}

function buildInfoRows(
  o: OrganizationEntity,
  businessTypes: string[],
): { label: string; value: React.ReactNode }[] {
  return [
    { label: "조직명", value: isFilled(o.name) ? o.name : <Muted /> },
    {
      label: "상호명",
      value: isFilled(o.businessName) ? o.businessName : <Muted />,
    },
    {
      label: "대표자명",
      value: isFilled(o.representativeName) ? o.representativeName : <Muted />,
    },
    {
      label: "사업자등록번호",
      value: isFilled(o.registrationNumber) ? (
        <Mono>{o.registrationNumber}</Mono>
      ) : (
        <Muted />
      ),
    },
    {
      label: "업종",
      value:
        businessTypes.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {businessTypes.map((t) => (
              <span
                key={t}
                className="text-[11.5px] font-medium px-2 py-[3px] rounded bg-neutral-50 text-neutral-600 border border-neutral-200 tracking-[-0.005em]"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <Muted />
        ),
    },
    { label: "주소", value: isFilled(o.address) ? o.address : <Muted /> },
    {
      label: "전화번호",
      value: isFilled(o.phoneNumber) ? (
        <Mono>{o.phoneNumber}</Mono>
      ) : (
        <Muted />
      ),
    },
    {
      label: "팩스번호",
      value: isFilled(o.faxNumber) ? <Mono>{o.faxNumber}</Mono> : <Muted />,
    },
    {
      label: "입금계좌",
      value: isFilled(o.depositAccount) ? (
        <div className="flex flex-col gap-0.5">
          <Mono>{o.depositAccount}</Mono>
          {isFilled(o.businessName) && (
            <span className="text-[11.5px] text-neutral-400">
              예금주 · {o.businessName}
            </span>
          )}
        </div>
      ) : (
        <Muted />
      ),
    },
    {
      label: "사용자 수",
      value:
        typeof o.userCount === "number" ? (
          <span className="inline-flex items-baseline gap-1">
            <span className="text-base font-bold tracking-[-0.02em] text-neutral-900 font-sans">
              {o.userCount}
            </span>
            <span className="text-xs text-neutral-500 font-medium">명</span>
          </span>
        ) : (
          <Muted />
        ),
    },
    {
      label: "상태",
      value: o.isActive ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-[3px] rounded bg-success-light text-success border border-success/20 leading-[1.5]">
          <span className="w-[5px] h-[5px] rounded-full bg-success" />
          활성
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-[3px] rounded bg-neutral-100 text-neutral-600 border border-neutral-200 leading-[1.5]">
          <span className="w-[5px] h-[5px] rounded-full bg-neutral-400" />
          비활성
        </span>
      ),
    },
  ];
}
