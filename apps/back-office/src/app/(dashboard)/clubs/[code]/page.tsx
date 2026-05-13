"use client";

import { useCallback, useEffect, useState, use } from "react";
import type { ClubDetailFormValues } from "@heritage-dx/store/schemas";
import { pickClubUpdatePayload } from "@heritage-dx/store/mappers";
import { useFavoriteClubs } from "@heritage-dx/store";
import type { ClubContactEntity, MembershipEntity } from "@heritage-dx/store";
import { useAdminRepositories, useClubRepository } from "@heritage-dx/api";
import { PageLoading, ConfirmModal } from "@heritage-dx/ui";

import type { ClubDetailResponse } from "@/types";
import {
  CLUB_INFO_FORM_ID,
  ClubDetailActionBar,
  ClubDetailHeader,
  ClubDetailTabs,
  type ClubDetailTabId,
  ClubInfoForm,
  ClubMembershipPanel,
} from "@/components/clubs";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function ClubDetailPage({ params }: PageProps) {
  const clubsRepo = useClubRepository();
  const { clubs: clubsAdmin, memberships: membershipsAdmin } = useAdminRepositories();
  const { code } = use(params);

  const [club, setClub] = useState<ClubDetailResponse | null>(null);
  const [memberships, setMemberships] = useState<MembershipEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingMembership, setIsSavingMembership] = useState(false);

  const [activeTab, setActiveTab] = useState<ClubDetailTabId>("basic");
  const [deleteTarget, setDeleteTarget] = useState<MembershipEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isFavorite, toggleFavorite } = useFavoriteClubs();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await clubsRepo.getOne(code);
      if (response.success && response.data) {
        setClub(response.data);
        setMemberships(
          (response.data.memberships || []) as unknown as MembershipEntity[],
        );
      } else {
        setClub(null);
        setMemberships([]);
      }
    } catch (error) {
      console.error("Failed to load club detail:", error);
      setClub(null);
      setMemberships([]);
    }
    setIsLoading(false);
  }, [clubsRepo, code]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveBasicInfo = async (data: ClubDetailFormValues) => {
    const clubId = club?.id;
    if (!clubId) {
      alert("골프장 ID가 없습니다.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = pickClubUpdatePayload(
        club as unknown as Record<string, unknown>,
        data as unknown as Record<string, unknown>,
      );
      const response = await clubsAdmin.update(clubId, payload);
      if (response.success) {
        alert("저장되었습니다.");
        await loadData();
      } else {
        alert(response.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update club:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const handleCreateMembership = async (data: Record<string, unknown>) => {
    const clubId = club?.id;
    if (!clubId) {
      alert("골프장 ID가 없습니다.");
      return;
    }
    setIsSavingMembership(true);
    try {
      const response = await membershipsAdmin.create({ ...data, clubId });
      if (response.success && response.data) {
        alert("회원권이 등록되었습니다.");
        await loadData();
      } else {
        alert(response.error || "회원권 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create membership:", error);
      alert("회원권 등록 중 오류가 발생했습니다.");
    }
    setIsSavingMembership(false);
  };

  const handleUpdateMembership = async (
    membershipId: string,
    data: Record<string, unknown>,
  ) => {
    const clubId = club?.id;
    if (!clubId || !membershipId) return;
    setIsSavingMembership(true);
    try {
      const response = await membershipsAdmin.update(clubId, membershipId, data);
      if (response.success) {
        alert("회원권이 수정되었습니다.");
        await loadData();
      } else {
        alert(response.error || "회원권 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update membership:", error);
      alert("회원권 수정 중 오류가 발생했습니다.");
    }
    setIsSavingMembership(false);
  };

  const handleConfirmDelete = async () => {
    const clubId = club?.id;
    if (!deleteTarget?.id || !clubId) return;
    setIsDeleting(true);
    try {
      const response = await membershipsAdmin.delete(clubId, deleteTarget.id);
      if (response.success) {
        setMemberships((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      } else {
        alert(response.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete membership:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] px-7 md:px-10 py-7">
        <div className="max-w-[1280px] mx-auto text-center py-12">
          <p className="text-neutral-500 text-[13px]">골프장을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const operationType =
    club.operationType ||
    (Array.isArray(club.operationTypes) ? club.operationTypes?.[0] : undefined);

  const handleToggleFavorite = () => {
    toggleFavorite(club.code, {
      name: club.name,
      region: club.region ?? undefined,
      holes: club.holes ?? undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <div className="flex-1 px-7 md:px-10 pt-7 pb-2">
        <div className="max-w-[1280px] mx-auto">
          <ClubDetailHeader
            name={club.name}
            region={club.region}
            operationType={operationType}
            holes={club.holes}
            isFavorite={isFavorite(club.code)}
            onToggleFavorite={handleToggleFavorite}
          />

          <ClubDetailTabs active={activeTab} onChange={setActiveTab} />

          {activeTab === "basic" && (
            <ClubInfoForm
              defaults={club}
              contacts={club.contacts as unknown as ClubContactEntity[] | undefined}
              onSubmit={handleSaveBasicInfo}
            />
          )}

          {activeTab === "membership" && (
            <ClubMembershipPanel
              memberships={memberships}
              isSaving={isSavingMembership}
              onCreate={handleCreateMembership}
              onUpdate={handleUpdateMembership}
              onRequestDelete={setDeleteTarget}
            />
          )}
        </div>
      </div>

      <div className="px-7 md:px-10">
        <div className="max-w-[1280px] mx-auto">
          <ClubDetailActionBar
            note={
              activeTab === "membership"
                ? "회원권은 카드별로 저장됩니다"
                : undefined
            }
            isSaving={isSaving}
            onSave={() => {
              if (activeTab !== "basic") return;
              const form = document.getElementById(
                CLUB_INFO_FORM_ID,
              ) as HTMLFormElement | null;
              form?.requestSubmit();
            }}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="회원권 삭제"
        message={`"${deleteTarget?.membershipName || deleteTarget?.membershipType}" 회원권을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
