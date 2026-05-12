"use client";

import { useState, useEffect, use, useCallback } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Building2,
  CreditCard,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clubDetailSchema, type ClubDetailFormValues } from "@heritage-dx/store/schemas";
import { pickClubUpdatePayload } from "@heritage-dx/store/mappers";

import type { ClubDetailResponse } from "@/types";
import type { Membership } from "@heritage-dx/types";
import { useClubRepository, useAdminRepositories } from "@heritage-dx/api";
import { PageContainer } from "@/components/layout";
import {
  PageLoading,
  Button,
  Input,
  Textarea,
  ConfirmModal,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@heritage-dx/ui";
import MembershipForm from "@/components/forms/MembershipForm";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function ClubDetailPage({ params }: PageProps) {
  const clubsRepo = useClubRepository();
  const { clubs: clubsAdmin, memberships: membershipsAdmin } = useAdminRepositories();
  const { code } = use(params);
  const [club, setClub] = useState<ClubDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("info");

  // 회원권 관련 상태
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [expandedMembershipId, setExpandedMembershipId] = useState<string | null>(null);
  const [showAddMembershipForm, setShowAddMembershipForm] = useState(false);
  const [deleteMembershipTarget, setDeleteMembershipTarget] = useState<Membership | null>(null);
  const [isDeletingMembership, setIsDeletingMembership] = useState(false);
  const [isSavingMembership, setIsSavingMembership] = useState(false);

  // 기본정보 폼
  const {
    register: registerClubInfo,
    handleSubmit: handleSubmitClubInfo,
    reset: resetClubInfo,
    formState: { errors: clubInfoErrors, isDirty: isClubInfoDirty },
  } = useForm<ClubDetailFormValues>({
    resolver: zodResolver(clubDetailSchema),
  });

  // club 데이터 로드 시 폼 초기화
  useEffect(() => {
    if (club) {
      resetClubInfo({
        name: club.name || "",
        companyName: club.companyName || "",
        region: club.region || "",
        address: club.address || "",
        openingDate: club.openingDate || "",
        holes: club.holes || "",
        totalLength: club.totalLength || "",
        memberCount: typeof club.memberCount === "number" ? String(club.memberCount) : club.memberCount || "",
        membershipInfo: club.membershipInfo || "",
        introduction: club.introduction || "",
        facilities: club.facilities || "",
        registrationFee: club.registrationFee || "",
        stampDuty: club.stampDuty || "",
        agencyFee: club.agencyFee || "",
        otherCosts: club.otherCosts || "",
        website: club.website || "",
        caddyFee: club.caddyFee,
        cartFee: club.cartFee,
      });
    }
  }, [club, resetClubInfo]);

  // 기본 정보 로드
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const clubResponse = await clubsRepo.getOne(code);
      if (clubResponse.success && clubResponse.data) {
        setClub(clubResponse.data);
        setMemberships(clubResponse.data.memberships || []);
      } else {
        setClub(null);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setClub(null);
    }
    setIsLoading(false);
  }, [code, clubsRepo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 기본정보 인라인 저장 - UpdateClubDto 화이트리스트로 페이로드 구성 (응답의 read-only
  // 필드 taxOfficial, operationType 등 제거 → forbidNonWhitelisted 방지)
  const handleClubInfoSave = async (data: ClubDetailFormValues) => {
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
        loadData();
      } else {
        alert(response.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update club:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  // 회원권 추가
  const handleAddMembership = async (data: Record<string, unknown>) => {
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
        setShowAddMembershipForm(false);
        loadData();
      } else {
        alert(response.error || "회원권 등록에 실패했습니다.");
      }
    } catch {
      alert("회원권 등록 중 오류가 발생했습니다.");
    }
    setIsSavingMembership(false);
  };

  // 회원권 수정
  const handleUpdateMembership = async (
    membershipId: string,
    data: Record<string, unknown>,
  ) => {
    const clubId = club?.id;
    if (!membershipId || !clubId) return;
    setIsSavingMembership(true);
    try {
      const response = await membershipsAdmin.update(clubId, membershipId, data);
      if (response.success) {
        alert("회원권이 수정되었습니다.");
        setExpandedMembershipId(null);
        loadData();
      } else {
        alert(response.error || "회원권 수정에 실패했습니다.");
      }
    } catch {
      alert("회원권 수정 중 오류가 발생했습니다.");
    }
    setIsSavingMembership(false);
  };

  // 회원권 삭제
  const handleDeleteMembership = async () => {
    const clubId = club?.id;
    if (!deleteMembershipTarget?.id || !clubId) return;
    setIsDeletingMembership(true);
    try {
      const response = await membershipsAdmin.delete(clubId, deleteMembershipTarget.id);
      if (response.success) {
        setMemberships(memberships.filter((m) => m.id !== deleteMembershipTarget.id));
        if (expandedMembershipId === deleteMembershipTarget.id) {
          setExpandedMembershipId(null);
        }
      } else {
        alert(response.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
    setIsDeletingMembership(false);
    setDeleteMembershipTarget(null);
  };

  const tabs = [
    { id: "info", label: "기본 정보", icon: Building2 },
    { id: "memberships", label: "회원권", icon: CreditCard },
  ];

  if (isLoading) {
    return <PageLoading />;
  }

  if (!club) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">골프장을 찾을 수 없습니다.</p>
        </div>
      </PageContainer>
    );
  }

  const renderInfoTab = () => (
    <form onSubmit={handleSubmitClubInfo(handleClubInfoSave)} className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">코드</label>
              <p className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">{club.code}</p>
            </div>
            <Input
              label="골프장명"
              error={clubInfoErrors.name?.message}
              required
              {...registerClubInfo("name")}
            />
            <Input
              label="회사명"
              placeholder="88 관광개발"
              {...registerClubInfo("companyName")}
            />
            <Input
              label="지역"
              placeholder="경기 용인시"
              {...registerClubInfo("region")}
            />
          </div>
          <Input
            label="주소"
            placeholder="경기도 용인시..."
            {...registerClubInfo("address")}
          />
          <Input
            label="홈페이지"
            placeholder="https://www.example.com"
            {...registerClubInfo("website")}
          />
        </CardContent>
      </Card>

      {/* 골프장 소개 */}
      <Card>
        <CardHeader>
          <CardTitle>골프장 소개</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            label="소개"
            minRows={4}
            placeholder="골프장 소개글을 입력하세요"
            {...registerClubInfo("introduction")}
          />
          <div className="mt-4">
            <Input
              label="부대시설"
              placeholder="클럽하우스, 골프연습장, 수영장 등"
              {...registerClubInfo("facilities")}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="회원구성"
              minRows={3}
              placeholder="회원 구성 정보를 입력하세요"
              {...registerClubInfo("membershipInfo")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 코스 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>코스 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="개장일"
              type="date"
              {...registerClubInfo("openingDate")}
            />
            <Input
              label="코스규모"
              placeholder="36홀"
              {...registerClubInfo("holes")}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="코스거리"
              placeholder="6,484m(동코스), 6,427m(서코스)"
              {...registerClubInfo("totalLength")}
            />
            <Input
              label="회원수"
              placeholder="1,979명"
              {...registerClubInfo("memberCount")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 연락처 (담당자/전화번호만 표시) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>연락처</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {club.contacts && club.contacts.length > 0 ? (
            <div className="space-y-3">
              {club.contacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {contact.contactPerson && (
                      <div>
                        <span className="text-gray-500">담당자: </span>
                        <span className="text-gray-900">{contact.contactPerson}</span>
                      </div>
                    )}
                    {contact.phoneNumber && (
                      <div>
                        <span className="text-gray-500">전화: </span>
                        <span className="text-gray-900">{contact.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                  {contact.isPrimary && (
                    <Badge variant="default">대표</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">등록된 연락처가 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* 비용 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>비용 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="캐디피"
              type="number"
              placeholder="130000"
              {...registerClubInfo("caddyFee")}
            />
            <Input
              label="카트비"
              type="number"
              placeholder="100000"
              {...registerClubInfo("cartFee")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 명의개서 비용 */}
      <Card>
        <CardHeader>
          <CardTitle>명의개서 비용</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="명의개서료"
              placeholder="명의개서료"
              {...registerClubInfo("registrationFee")}
            />
            <Input
              label="인지대"
              placeholder="인지대"
              {...registerClubInfo("stampDuty")}
            />
            <Input
              label="대행수수료"
              placeholder="대행수수료"
              {...registerClubInfo("agencyFee")}
            />
            <Input
              label="기타비용"
              placeholder="기타비용"
              {...registerClubInfo("otherCosts")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-3 sticky bottom-0 bg-white py-4 border-t">
        <Button type="submit" disabled={isSaving || !isClubInfoDirty}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            "저장"
          )}
        </Button>
      </div>
    </form>
  );

  const renderMembershipsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">회원권</h2>
          <Badge variant="default">{memberships.length}개</Badge>
        </div>
        <Button size="sm" onClick={() => {
          setShowAddMembershipForm(true);
          setExpandedMembershipId(null);
        }}>
          <Plus className="w-4 h-4 mr-1" />
          추가
        </Button>
      </div>

      {showAddMembershipForm && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>새 회원권 추가</CardTitle>
              <button
                onClick={() => setShowAddMembershipForm(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <MembershipForm
              onSubmit={handleAddMembership}
              onCancel={() => setShowAddMembershipForm(false)}
              isLoading={isSavingMembership}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {memberships.length === 0 && !showAddMembershipForm ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">등록된 회원권이 없습니다</p>
                <button
                  onClick={() => setShowAddMembershipForm(true)}
                  className="text-primary hover:underline text-sm"
                >
                  새 회원권 등록하기
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          memberships.map((membership) => {
            const isExpanded = expandedMembershipId === membership.id;
            return (
              <Card key={membership.id} className={isExpanded ? "border-primary" : ""}>
                <div
                  onClick={() => {
                    setExpandedMembershipId(isExpanded ? null : membership.id);
                    setShowAddMembershipForm(false);
                  }}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        membership.isActive !== false ? "bg-blue-50" : "bg-gray-100"
                      }`}>
                        <CreditCard className={`w-5 h-5 ${
                          membership.isActive !== false ? "text-blue-500" : "text-gray-400"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {membership.membershipType}
                          </span>
                          {membership.membershipName && (
                            <span className="text-sm text-gray-500">
                              ({membership.membershipName})
                            </span>
                          )}
                          {membership.isActive === false && (
                            <Badge variant="warning" className="text-xs">비활성</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {membership.membershipType || "-"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteMembershipTarget(membership);
                        }}
                        className="p-2 hover:bg-gray-200 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {!isExpanded && (membership.recentMarketPrice || membership.dealerPriceRange) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-sm">
                      {membership.recentMarketPrice && (
                        <div>
                          <span className="text-gray-500">최근 시세: </span>
                          <span className="text-gray-900">{membership.recentMarketPrice}</span>
                        </div>
                      )}
                      {membership.dealerPriceRange && (
                        <div>
                          <span className="text-gray-500">매도가 범위: </span>
                          <span className="text-gray-900">{membership.dealerPriceRange}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <CardContent className="border-t">
                    <MembershipForm
                      initialData={membership as unknown as import("@heritage-dx/store").MembershipEntity}
                      onSubmit={async (data) => {
                        await handleUpdateMembership(membership.id, data);
                      }}
                      onCancel={() => setExpandedMembershipId(null)}
                      isLoading={isSavingMembership}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{club.name}</h1>
        <p className="text-sm text-gray-500">{club.code}</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {activeTab === "info" && renderInfoTab()}
        {activeTab === "memberships" && renderMembershipsTab()}
      </div>

      <ConfirmModal
        isOpen={!!deleteMembershipTarget}
        onClose={() => setDeleteMembershipTarget(null)}
        onConfirm={handleDeleteMembership}
        title="회원권 삭제"
        message={`"${deleteMembershipTarget?.membershipType}" 회원권을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeletingMembership}
      />
    </PageContainer>
  );
}
