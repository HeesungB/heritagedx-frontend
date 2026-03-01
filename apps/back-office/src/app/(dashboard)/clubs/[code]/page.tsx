"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Trash2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Check,
  X,
  Loader2,
  Building2,
  FolderOpen,
  Users,
  User,
  CreditCard,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  ClubDetailResponse,
  ClubDocument,
  ClubScenarioDocument,
  Scenario,
  CustomerDocument,
  Membership,
} from "@/types";
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
  Drawer,
  Badge,
} from "@heritage-dx/ui";
import DocumentForm from "@/components/forms/DocumentForm";
import MembershipForm from "@/components/forms/MembershipForm";

interface PageProps {
  params: Promise<{ code: string }>;
}

// 4개 고정 시나리오 정의
const FIXED_SCENARIOS = [
  {
    code: "PS_BASIC",
    name: "개인 양도",
    shortName: "개인 양도",
    side: "매도인",
    ownerType: "개인",
  },
  {
    code: "PB_BASIC",
    name: "개인 양수",
    shortName: "개인 양수",
    side: "매수인",
    ownerType: "개인",
  },
  {
    code: "CS_BASIC",
    name: "법인 양도",
    shortName: "법인 양도",
    side: "매도인",
    ownerType: "법인",
  },
  {
    code: "CB_BASIC",
    name: "법인 양수",
    shortName: "법인 양수",
    side: "매수인",
    ownerType: "법인",
  },
];

// 빈 문자열을 undefined로 변환하는 헬퍼
const optionalNumber = z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  },
  z.number().optional()
);

// 기본정보 폼 스키마
const clubInfoSchema = z.object({
  name: z.string().min(1, "골프장명을 입력하세요"),
  companyName: z.string().optional(),
  region: z.string().optional(),
  address: z.string().optional(),
  openingDate: z.string().optional(),
  holes: z.string().optional(),
  memberCount: z.string().optional(),
  cityAccessibility: z.string().optional(),
  memo: z.string().optional(),
  dealerMemo: z.string().optional(),
  introduction: z.string().optional(),
  facilities: z.string().optional(),
  registrationFee: z.string().optional(),
  stampDuty: z.string().optional(),
  agencyFee: z.string().optional(),
  otherCosts: z.string().optional(),
  caddyFee: optionalNumber,
  cartFee: optionalNumber,
});

type ClubInfoFormData = z.infer<typeof clubInfoSchema>;

export default function ClubDetailPage({ params }: PageProps) {
  const clubsRepo = useClubRepository();
  const {
    clubs: clubsAdmin,
    clubDocuments: clubDocumentsAdmin,
    clubScenarioDocuments: clubScenarioDocumentsAdmin,
    scenarios: scenariosAdmin,
    customerDocuments: customerDocumentsAdmin,
    memberships: membershipsAdmin,
  } = useAdminRepositories();
  const { code } = use(params);
  const [club, setClub] = useState<ClubDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 탭 상태
  const [activeTab, setActiveTab] = useState("info");

  // 시나리오 서브탭 상태
  const [activeScenario, setActiveScenario] = useState(FIXED_SCENARIOS[0].code);

  // 서류 관련 상태
  const [documents, setDocuments] = useState<ClubDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<ClubDocument[]>(
    []
  );
  const [docSearchTerm, setDocSearchTerm] = useState("");
  const [deleteDocTarget, setDeleteDocTarget] = useState<ClubDocument | null>(
    null
  );
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Drawer 상태
  const [selectedDocument, setSelectedDocument] = useState<ClubDocument | null>(
    null
  );

  // 다운로드 상태
  const [isDownloading, setIsDownloading] = useState(false);

  // 시나리오 관련 상태
  const [scenarioMap, setScenarioMap] = useState<Record<string, Scenario>>({});
  const [scenarioDocuments, setScenarioDocuments] = useState<
    Record<string, ClubScenarioDocument[]>
  >({});
  const [isLinking, setIsLinking] = useState<string | null>(null);

  // 고객 구비서류 관련 상태
  const [customerDocuments, setCustomerDocuments] = useState<CustomerDocument[]>([]);
  const [customerDocSearchTerm, setCustomerDocSearchTerm] = useState("");
  const [filteredCustomerDocuments, setFilteredCustomerDocuments] = useState<CustomerDocument[]>([]);
  const [showAddCustomerDocDrawer, setShowAddCustomerDocDrawer] = useState(false);
  const [selectedCustomerDocument, setSelectedCustomerDocument] = useState<CustomerDocument | null>(null);
  const [deleteCustomerDocTarget, setDeleteCustomerDocTarget] = useState<CustomerDocument | null>(null);
  const [isDeletingCustomerDoc, setIsDeletingCustomerDoc] = useState(false);
  const [isSavingCustomerDoc, setIsSavingCustomerDoc] = useState(false);

  // 고객 구비서류 추가 폼 상태
  const [newCustomerDocName, setNewCustomerDocName] = useState("");
  const [newCustomerDocDescription, setNewCustomerDocDescription] = useState("");

  // 고객 구비서류 수정 폼 상태
  const [editCustomerDocName, setEditCustomerDocName] = useState("");
  const [editCustomerDocDescription, setEditCustomerDocDescription] = useState("");

  // 회원권 관련 상태
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [expandedMembershipId, setExpandedMembershipId] = useState<string | null>(null);
  const [showAddMembershipForm, setShowAddMembershipForm] = useState(false);
  const [deleteMembershipTarget, setDeleteMembershipTarget] = useState<Membership | null>(null);
  const [isDeletingMembership, setIsDeletingMembership] = useState(false);
  const [isSavingMembership, setIsSavingMembership] = useState(false);

  // 탭 데이터 로딩 상태 (서류, 시나리오, 고객구비서류)
  const [isLoadingTabData, setIsLoadingTabData] = useState(false);

  // 기본정보 폼
  const {
    register: registerClubInfo,
    handleSubmit: handleSubmitClubInfo,
    reset: resetClubInfo,
    formState: { errors: clubInfoErrors, isDirty: isClubInfoDirty },
  } = useForm<ClubInfoFormData>({
    resolver: zodResolver(clubInfoSchema),
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
        memberCount: typeof club.memberCount === "number" ? String(club.memberCount) : club.memberCount || "",
        cityAccessibility: club.cityAccessibility || "",
        memo: club.memo || "",
        dealerMemo: club.dealerMemo || "",
        introduction: club.introduction || "",
        facilities: club.facilities || "",
        registrationFee: club.registrationFee || "",
        stampDuty: club.stampDuty || "",
        agencyFee: club.agencyFee || "",
        otherCosts: club.otherCosts || "",
        caddyFee: club.caddyFee,
        cartFee: club.cartFee,
      });
    }
  }, [club, resetClubInfo]);

  useEffect(() => {
    if (docSearchTerm) {
      setFilteredDocuments(
        documents.filter(
          (d) =>
            (d.cleanName || d.name || "")
              .toLowerCase()
              .includes(docSearchTerm.toLowerCase()) ||
            (d.docCode || d.code || "")
              .toLowerCase()
              .includes(docSearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredDocuments(documents);
    }
  }, [docSearchTerm, documents]);

  // 고객 구비서류 검색 필터링
  useEffect(() => {
    if (customerDocSearchTerm) {
      setFilteredCustomerDocuments(
        customerDocuments.filter(
          (d) =>
            (d.name || "").toLowerCase().includes(customerDocSearchTerm.toLowerCase()) ||
            (d.description || "").toLowerCase().includes(customerDocSearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredCustomerDocuments(customerDocuments);
    }
  }, [customerDocSearchTerm, customerDocuments]);

  // 선택된 고객 구비서류가 변경될 때 수정 폼 초기화
  useEffect(() => {
    if (selectedCustomerDocument) {
      setEditCustomerDocName(selectedCustomerDocument.name || "");
      setEditCustomerDocDescription(selectedCustomerDocument.description || "");
    }
  }, [selectedCustomerDocument]);

  // 탭 데이터 로드 (서류, 시나리오, 고객구비서류 — 병렬)
  const loadTabData = useCallback(async (clubId: string) => {
    setIsLoadingTabData(true);
    try {
      // 3개 API 병렬 호출
      const [docsResponse, customerDocsResponse, scenarioResponse] = await Promise.all([
        clubDocumentsAdmin.getByClub(clubId),
        customerDocumentsAdmin.getByClub(clubId),
        scenariosAdmin.getAll({ limit: 100 }),
      ]);

      // 서류
      if (docsResponse.success && docsResponse.data) {
        setDocuments(docsResponse.data.documents || []);
      } else {
        setDocuments([]);
      }

      // 고객 구비서류
      if (customerDocsResponse.success && customerDocsResponse.data) {
        setCustomerDocuments(customerDocsResponse.data.documents || []);
      } else {
        setCustomerDocuments([]);
      }

      // 시나리오 매핑 + 시나리오별 서류 (병렬)
      if (scenarioResponse.success && scenarioResponse.data) {
        const scenarios = scenarioResponse.data.scenarios || [];
        const map: Record<string, Scenario> = {};
        FIXED_SCENARIOS.forEach((fixed) => {
          const found = scenarios.find(
            (s) => (s.scenarioCode || s.code) === fixed.code
          );
          if (found) {
            map[fixed.code] = found;
          }
        });
        setScenarioMap(map);

        // 시나리오별 서류 병렬 조회 (기존: 순차 루프)
        const docMapEntries = await Promise.all(
          FIXED_SCENARIOS.map(async (fixed) => {
            const scenario = map[fixed.code];
            if (scenario?.id) {
              try {
                const res = await clubScenarioDocumentsAdmin.getByClubScenario(
                  clubId,
                  scenario.id
                );
                return [fixed.code, res.success && res.data ? res.data : [] as ClubScenarioDocument[]] as const;
              } catch {
                return [fixed.code, [] as ClubScenarioDocument[]] as const;
              }
            }
            return [fixed.code, [] as ClubScenarioDocument[]] as const;
          })
        );
        const docMap: Record<string, ClubScenarioDocument[]> = {};
        for (const [key, docs] of docMapEntries) {
          docMap[key] = docs;
        }
        setScenarioDocuments(docMap);
      }
    } catch (error) {
      console.error("Failed to load tab data:", error);
    }
    setIsLoadingTabData(false);
  }, []);

  // 기본 정보만 로드 (Phase 1) → 화면 즉시 표시 → 탭 데이터 백그라운드 로드
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const clubResponse = await clubsRepo.getOne(code);
      if (clubResponse.success && clubResponse.data) {
        setClub(clubResponse.data);
        setMemberships(clubResponse.data.memberships || []);
        setIsLoading(false); // 기본 정보 표시

        // 탭 데이터 백그라운드 로드
        const clubId = clubResponse.data.id;
        if (clubId) {
          loadTabData(clubId);
        }
      } else {
        setClub(null);
        setDocuments([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setClub(null);
      setDocuments([]);
      setIsLoading(false);
    }
  }, [code, loadTabData]);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 기본정보 인라인 저장
  const handleClubInfoSave = async (data: ClubInfoFormData) => {
    const clubId = club?.id;
    if (!clubId) {
      alert("골프장 ID가 없습니다.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await clubsAdmin.update(clubId, data);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDocumentSubmit = async (data: any) => {
    if (!selectedDocument) return;
    const clubId = club?.id || "";
    const docId = selectedDocument.id || "";
    if (!clubId || !docId) {
      console.error("Club ID or Document ID is missing");
      return;
    }
    setIsSaving(true);
    try {
      const response = await clubDocumentsAdmin.update(clubId, docId, data);
      if (response.success) {
        alert("서류가 수정되었습니다.");
        loadData();
      } else {
        alert("서류가 수정되었습니다. (POC)");
      }
    } catch {
      alert("서류가 수정되었습니다. (POC)");
    }
    setIsSaving(false);
  };

  const handleDeleteDocument = async () => {
    if (!deleteDocTarget) return;
    const clubId = club?.id || "";
    const docId = deleteDocTarget.id || "";
    if (!clubId || !docId) {
      console.error("Club ID or Document ID is missing");
      return;
    }
    setIsDeletingDoc(true);
    try {
      await clubDocumentsAdmin.delete(clubId, docId);
      setDocuments(documents.filter((d) => d.id !== deleteDocTarget.id));
    } catch {
      setDocuments(documents.filter((d) => d.id !== deleteDocTarget.id));
    }
    setIsDeletingDoc(false);
    setDeleteDocTarget(null);
  };

  // 파일 다운로드 처리
  const handleDownload = async (doc: ClubDocument) => {
    const clubId = club?.id;
    const docId = doc.id;

    if (!clubId || !docId) {
      alert("다운로드에 필요한 정보가 없습니다.");
      return;
    }

    setIsDownloading(true);

    try {
      const urlResponse = await clubDocumentsAdmin.getDownloadUrl(clubId, docId);

      if (!urlResponse.success || !urlResponse.data?.url) {
        throw new Error("다운로드 URL을 가져올 수 없습니다.");
      }

      const downloadUrl = urlResponse.data.url;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`다운로드 실패: ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = doc.fileName || doc.name || "document.pdf";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("다운로드 에러:", error);
      alert("다운로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDownloading(false);
    }
  };

  // 서류가 시나리오에 연결되어 있는지 확인
  const isDocumentLinkedToScenario = useCallback(
    (scenarioCode: string, docId: string) => {
      const docs = scenarioDocuments[scenarioCode] || [];
      return docs.some((d) => d.clubDocumentId === docId);
    },
    [scenarioDocuments]
  );

  // 시나리오-서류 연결/해제 토글
  const handleToggleScenarioDocument = async (
    scenarioCode: string,
    document: ClubDocument
  ) => {
    const clubId = club?.id || "";
    const scenario = scenarioMap[scenarioCode];
    const scenarioId = scenario?.id || "";
    const docId = document.id || "";

    if (!clubId || !scenarioId || !docId) {
      console.error("Missing IDs for linking");
      return;
    }

    const linkKey = `${scenarioCode}-${docId}`;
    setIsLinking(linkKey);

    try {
      if (isDocumentLinkedToScenario(scenarioCode, docId)) {
        // 연결 해제
        await clubScenarioDocumentsAdmin.unlink(clubId, scenarioId, docId);
        setScenarioDocuments((prev) => ({
          ...prev,
          [scenarioCode]: (prev[scenarioCode] || []).filter(
            (d) => d.clubDocumentId !== docId
          ),
        }));
      } else {
        // 연결
        await clubScenarioDocumentsAdmin.link(clubId, scenarioId, docId);
        // 연결 후 다시 조회
        const res = await clubScenarioDocumentsAdmin.getByClubScenario(
          clubId,
          scenarioId
        );
        if (res.success && res.data) {
          setScenarioDocuments((prev) => ({
            ...prev,
            [scenarioCode]: res.data || [],
          }));
        }
      }
    } catch (error) {
      console.error("Failed to toggle document link:", error);
      // POC: 에러가 나도 UI 업데이트
      if (isDocumentLinkedToScenario(scenarioCode, docId)) {
        setScenarioDocuments((prev) => ({
          ...prev,
          [scenarioCode]: (prev[scenarioCode] || []).filter(
            (d) => d.clubDocumentId !== docId
          ),
        }));
      }
    }

    setIsLinking(null);
  };

  // 고객 구비서류 추가
  const handleAddCustomerDocument = async () => {
    if (!newCustomerDocName.trim()) {
      alert("서류명을 입력해주세요.");
      return;
    }
    const clubId = club?.id;
    if (!clubId) {
      alert("골프장 ID가 없습니다.");
      return;
    }
    setIsSavingCustomerDoc(true);
    try {
      const response = await customerDocumentsAdmin.create(clubId, {
        name: newCustomerDocName,
        description: newCustomerDocDescription || undefined,
      });
      if (response.success) {
        alert("서류가 등록되었습니다.");
        setShowAddCustomerDocDrawer(false);
        setNewCustomerDocName("");
        setNewCustomerDocDescription("");
        // 목록 다시 조회
        const customerDocsResponse = await customerDocumentsAdmin.getByClub(clubId);
        if (customerDocsResponse.success && customerDocsResponse.data) {
          setCustomerDocuments(customerDocsResponse.data.documents || []);
        }
      } else {
        alert(response.error || "서류 등록에 실패했습니다.");
      }
    } catch {
      alert("서류 등록 중 오류가 발생했습니다.");
    }
    setIsSavingCustomerDoc(false);
  };

  // 고객 구비서류 수정
  const handleUpdateCustomerDocument = async () => {
    if (!selectedCustomerDocument?.id) return;
    if (!editCustomerDocName.trim()) {
      alert("서류명을 입력해주세요.");
      return;
    }
    const clubId = club?.id;
    if (!clubId) {
      alert("골프장 ID가 없습니다.");
      return;
    }
    setIsSavingCustomerDoc(true);
    try {
      const response = await customerDocumentsAdmin.update(
        clubId,
        selectedCustomerDocument.id,
        {
          name: editCustomerDocName,
          description: editCustomerDocDescription || undefined,
        }
      );
      if (response.success) {
        alert("서류가 수정되었습니다.");
        // 목록 다시 조회
        const customerDocsResponse = await customerDocumentsAdmin.getByClub(clubId);
        if (customerDocsResponse.success && customerDocsResponse.data) {
          setCustomerDocuments(customerDocsResponse.data.documents || []);
        }
        // 선택된 서류 정보 업데이트
        setSelectedCustomerDocument({
          ...selectedCustomerDocument,
          name: editCustomerDocName,
          description: editCustomerDocDescription,
        });
      } else {
        alert(response.error || "서류 수정에 실패했습니다.");
      }
    } catch {
      alert("서류 수정 중 오류가 발생했습니다.");
    }
    setIsSavingCustomerDoc(false);
  };

  // 고객 구비서류 삭제
  const handleDeleteCustomerDocument = async () => {
    if (!deleteCustomerDocTarget?.id) return;
    const clubId = club?.id;
    if (!clubId) {
      alert("골프장 ID가 없습니다.");
      return;
    }
    setIsDeletingCustomerDoc(true);
    try {
      const response = await customerDocumentsAdmin.delete(clubId, deleteCustomerDocTarget.id);
      if (response.success) {
        setCustomerDocuments(customerDocuments.filter((d) => d.id !== deleteCustomerDocTarget.id));
        if (selectedCustomerDocument?.id === deleteCustomerDocTarget.id) {
          setSelectedCustomerDocument(null);
        }
      } else {
        alert(response.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
    setIsDeletingCustomerDoc(false);
    setDeleteCustomerDocTarget(null);
  };

  // 회원권 추가
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddMembership = async (data: any) => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateMembership = async (membershipId: string, data: any) => {
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

  // 탭 목록 정의
  const tabs = [
    { id: "info", label: "기본 정보", icon: Building2 },
    { id: "memberships", label: "회원권", icon: CreditCard },
    { id: "scenarios", label: "시나리오", icon: Users },
    { id: "documents", label: "서류", icon: FolderOpen },
    { id: "personal-docs", label: "개인 구비서류", icon: User },
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

  // 골프장 정보 탭 콘텐츠 (인라인 편집)
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
        </CardContent>
      </Card>

      {/* 코스 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>코스 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="개장일"
              type="date"
              {...registerClubInfo("openingDate")}
            />
            <Input
              label="홀 구성"
              placeholder="36홀"
              {...registerClubInfo("holes")}
            />
            <Input
              label="회원 수"
              placeholder="1,979명"
              {...registerClubInfo("memberCount")}
            />
          </div>
          <Input
            label="도심 접근성"
            placeholder="서울에서 40분"
            {...registerClubInfo("cityAccessibility")}
          />
          {/* 코스명 표시 (읽기 전용) */}
          {club.courseNames && club.courseNames.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">코스명</label>
              <div className="flex flex-wrap gap-2">
                {club.courseNames.map((name, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">{name}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 연락처 */}
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
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
                    {contact.fax && (
                      <div>
                        <span className="text-gray-500">팩스: </span>
                        <span className="text-gray-900">{contact.fax}</span>
                      </div>
                    )}
                    {contact.department && (
                      <div>
                        <span className="text-gray-500">부서: </span>
                        <span className="text-gray-900">{contact.department}</span>
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

      {/* 계좌 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>계좌 정보</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {club.bankAccounts && club.bankAccounts.length > 0 ? (
            <div className="space-y-3">
              {club.bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    {account.bankName && (
                      <div>
                        <span className="text-gray-500">은행: </span>
                        <span className="text-gray-900">{account.bankName}</span>
                      </div>
                    )}
                    {account.accountNumber && (
                      <div>
                        <span className="text-gray-500">계좌번호: </span>
                        <span className="text-gray-900">{account.accountNumber}</span>
                      </div>
                    )}
                    {account.accountHolder && (
                      <div>
                        <span className="text-gray-500">예금주: </span>
                        <span className="text-gray-900">{account.accountHolder}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">등록된 계좌가 없습니다.</p>
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
              label="카트피"
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

      {/* 내부 메모 */}
      <Card>
        <CardHeader>
          <CardTitle>내부 메모</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="메모"
            minRows={3}
            placeholder="기타 참고사항"
            {...registerClubInfo("memo")}
          />
          <Textarea
            label="딜러 메모"
            minRows={3}
            placeholder="딜러 특이사항"
            {...registerClubInfo("dealerMemo")}
          />
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

  // 서류 목록 탭 콘텐츠
  const renderDocumentsTab = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>서류 ({documents.length})</CardTitle>
          <Link href={`/clubs/${code}/documents/new`}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              추가
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="서류 검색..."
              value={docSearchTerm}
              onChange={(e) => setDocSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2 ">
          {filteredDocuments.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              등록된 서류가 없습니다.
            </p>
          ) : (
            filteredDocuments.map((document) => (
              <div
                key={`${document.id}-${document.docCode || document.code}`}
                onClick={() => setSelectedDocument(document)}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {document.cleanName || document.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {document.fileDescription && `${document.fileDescription}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDocTarget(document);
                    }}
                    className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-error" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  // 시나리오 탭 콘텐츠
  const renderScenariosTab = () => {
    const currentScenario = FIXED_SCENARIOS.find((s) => s.code === activeScenario);
    const scenario = scenarioMap[activeScenario];
    const linkedDocs = scenarioDocuments[activeScenario] || [];

    return (
      <div className="space-y-6">
        {/* 시나리오 선택 버튼들 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FIXED_SCENARIOS.map((s) => {
            const isActive = activeScenario === s.code;

            // 각 시나리오별 상단 라인 색상
            const lineColorMap: Record<string, string> = {
              PS_BASIC: "border-t-orange-500", // 개인 양도: 주황
              PB_BASIC: "border-t-blue-500",   // 개인 양수: 파란색
              CS_BASIC: "border-t-green-500",  // 법인 양도: 초록
              CB_BASIC: "border-t-purple-500", // 법인 양수: 보라
            };
            const lineColor = lineColorMap[s.code] || "border-t-gray-500";

            return (
              <button
                key={s.code}
                onClick={() => setActiveScenario(s.code)}
                className={`p-4 rounded-lg border-2 border-t-4 text-left transition-all ${lineColor} ${
                  isActive
                    ? "border-gray-300 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isActive ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  {s.shortName}
                </span>
              </button>
            );
          })}
        </div>

        {/* 선택된 시나리오의 서류 연결 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{currentScenario?.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  이 시나리오에 필요한 서류를 선택하세요
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {linkedDocs.length}개 서류 연결됨
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!scenario ? (
              <div className="text-center py-8 text-gray-500">
                <p>시나리오를 찾을 수 없습니다.</p>
                <p className="text-sm mt-1">
                  시나리오 코드: {activeScenario}가 시스템에 등록되어 있는지 확인해주세요.
                </p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <p className="text-gray-500 mb-2">등록된 서류가 없습니다.</p>
                <Link
                  href={`/clubs/${code}/documents/new`}
                  className="text-primary hover:underline text-sm"
                >
                  서류 등록하기
                </Link>
              </div>
            ) : (
              <div className="space-y-2 ">
                {documents.map((document) => {
                  const docId = document.id || "";
                  const isLinked = isDocumentLinkedToScenario(activeScenario, docId);
                  const linkKey = `${activeScenario}-${docId}`;
                  const isProcessing = isLinking === linkKey;

                  return (
                    <div
                      key={docId}
                      onClick={() =>
                        !isProcessing &&
                        handleToggleScenarioDocument(activeScenario, document)
                      }
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                        isLinked
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      } ${isProcessing ? "opacity-50 cursor-wait" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isLinked
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isLinked ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {document.cleanName || document.name}
                          </div>
                          {document.fileDescription && (
                            <div className="text-xs text-gray-500">
                              {document.fileDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // 회원권 탭 콘텐츠 (아코디언 방식)
  const renderMembershipsTab = () => (
    <div className="space-y-4">
      {/* 헤더 */}
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

      {/* 새 회원권 추가 폼 */}
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

      {/* 회원권 목록 */}
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
                {/* 아코디언 헤더 */}
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
                          {[
                            membership.hasAssociateMember && "준회원",
                            membership.canDelegate && "위임가능",
                          ]
                            .filter(Boolean)
                            .join(" | ") || "-"}
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
                  {/* 접혀있을 때 요약 정보 */}
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
                          <span className="text-gray-500">체감 가격대: </span>
                          <span className="text-gray-900">{membership.dealerPriceRange}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* 펼쳐진 상태: 수정 폼 */}
                {isExpanded && (
                  <CardContent className="border-t">
                    <MembershipForm
                      initialData={membership}
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

  // 개인 구비서류 탭 콘텐츠
  const renderPersonalDocsTab = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>고객 구비서류</CardTitle>
            <Badge variant="default">{customerDocuments.length}개</Badge>
          </div>
          <Button size="sm" onClick={() => setShowAddCustomerDocDrawer(true)}>
            <Plus className="w-4 h-4 mr-1" />
            추가
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 검색 */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="서류명 또는 설명으로 검색..."
              value={customerDocSearchTerm}
              onChange={(e) => setCustomerDocSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 서류 목록 */}
        <div className="space-y-2 ">
          {filteredCustomerDocuments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">
                {customerDocSearchTerm ? "검색 결과가 없습니다" : "등록된 서류가 없습니다"}
              </p>
              {!customerDocSearchTerm && (
                <button
                  onClick={() => setShowAddCustomerDocDrawer(true)}
                  className="text-primary hover:underline text-sm"
                >
                  새 서류 등록하기
                </button>
              )}
            </div>
          ) : (
            filteredCustomerDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedCustomerDocument(doc)}
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    {doc.description && (
                      <div className="text-sm text-gray-500">{doc.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteCustomerDocTarget(doc);
                    }}
                    className="p-2 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-error" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{club.name}</h1>
        <p className="text-sm text-gray-500">{club.code}</p>
      </div>

      {/* 탭 네비게이션 */}
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

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === "info" && renderInfoTab()}
        {activeTab === "memberships" && renderMembershipsTab()}
        {activeTab === "scenarios" && (isLoadingTabData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-500">시나리오 데이터를 불러오는 중...</span>
          </div>
        ) : renderScenariosTab())}
        {activeTab === "documents" && (isLoadingTabData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-500">서류 데이터를 불러오는 중...</span>
          </div>
        ) : renderDocumentsTab())}
        {activeTab === "personal-docs" && (isLoadingTabData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-500">고객 구비서류를 불러오는 중...</span>
          </div>
        ) : renderPersonalDocsTab())}
      </div>

      {/* 서류 상세 Drawer */}
      <Drawer
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        title="서류 수정"
        width="lg"
      >
        {selectedDocument && (
          <div className="space-y-6">
            {selectedDocument.storageKey && (
              <Card>
                <CardHeader>
                  <CardTitle>첨부 파일</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedDocument.fileName || "첨부파일"}
                        </p>
                        {selectedDocument.fileDescription && (
                          <p className="text-sm text-gray-500">
                            {selectedDocument.fileDescription}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(selectedDocument)}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? "다운로드 중..." : "다운로드"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            <DocumentForm
              initialData={{
                id: selectedDocument.id,
                cleanName:
                  selectedDocument.name || selectedDocument.cleanName || "",
                name: selectedDocument.name,
                description: selectedDocument.fileDescription,
              }}
              onSubmit={handleDocumentSubmit}
              onCancel={() => setSelectedDocument(null)}
              isLoading={isSaving}
              enableFileUpload={false}
            />
          </div>
        )}
      </Drawer>

      <ConfirmModal
        isOpen={!!deleteDocTarget}
        onClose={() => setDeleteDocTarget(null)}
        onConfirm={handleDeleteDocument}
        title="서류 삭제"
        message={`"${
          deleteDocTarget?.cleanName || deleteDocTarget?.name
        }" 서류를 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeletingDoc}
      />

      {/* 고객 구비서류 추가 Drawer */}
      <Drawer
        isOpen={showAddCustomerDocDrawer}
        onClose={() => {
          setShowAddCustomerDocDrawer(false);
          setNewCustomerDocName("");
          setNewCustomerDocDescription("");
        }}
        title="고객 구비서류 추가"
        width="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-900">고객 구비서류 등록</p>
                <p className="text-sm text-purple-700 mt-1">
                  고객이 개별적으로 준비해야 하는 서류를 등록합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                서류명 <span className="text-red-500">*</span>
              </label>
              <Input
                value={newCustomerDocName}
                onChange={(e) => setNewCustomerDocName(e.target.value)}
                placeholder="예: 신분증 사본"
              />
            </div>

            <Textarea
              label="설명"
              value={newCustomerDocDescription}
              onChange={(e) => setNewCustomerDocDescription(e.target.value)}
              placeholder="서류에 대한 설명을 입력하세요"
              minRows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCustomerDocDrawer(false);
                setNewCustomerDocName("");
                setNewCustomerDocDescription("");
              }}
            >
              취소
            </Button>
            <Button onClick={handleAddCustomerDocument} disabled={isSavingCustomerDoc}>
              {isSavingCustomerDoc ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  등록 중...
                </>
              ) : (
                "등록"
              )}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 고객 구비서류 상세/수정 Drawer */}
      <Drawer
        isOpen={!!selectedCustomerDocument}
        onClose={() => setSelectedCustomerDocument(null)}
        title="고객 구비서류 수정"
        width="lg"
      >
        {selectedCustomerDocument && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>서류 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      서류명 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={editCustomerDocName}
                      onChange={(e) => setEditCustomerDocName(e.target.value)}
                      placeholder="서류명을 입력하세요"
                    />
                  </div>

                  <Textarea
                    label="설명"
                    value={editCustomerDocDescription}
                    onChange={(e) => setEditCustomerDocDescription(e.target.value)}
                    placeholder="서류에 대한 설명을 입력하세요"
                    minRows={3}
                  />

                  <div className="flex justify-end">
                    <Button
                      onClick={handleUpdateCustomerDocument}
                      disabled={isSavingCustomerDoc}
                    >
                      {isSavingCustomerDoc ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        "저장"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setDeleteCustomerDocTarget(selectedCustomerDocument)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedCustomerDocument(null)}
              >
                닫기
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 고객 구비서류 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!deleteCustomerDocTarget}
        onClose={() => setDeleteCustomerDocTarget(null)}
        onConfirm={handleDeleteCustomerDocument}
        title="서류 삭제"
        message={`"${deleteCustomerDocTarget?.name}" 서류를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeletingCustomerDoc}
      />

      {/* 회원권 삭제 확인 모달 */}
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
