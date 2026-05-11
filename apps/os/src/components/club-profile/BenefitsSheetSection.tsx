"use client";

import { useState, useRef } from "react";
import { captureSheetAsJpeg, printSheetFitToPage } from "@/utils/sheet-print";
import { ClubDetail } from "@/types";
import MembershipInfoSheet from "../MembershipInfoSheet";
import SheetToolbar from "../sheet-common/SheetToolbar";
import PrintItemSelector, {
  type PrintSelectorGroup,
} from "../sheet-common/PrintItemSelector";
import sheetStyles from "../sheet-common/sheet.module.css";
import type { SheetCustomItemsMap } from "@/hooks/useSheetStorage";

interface BenefitsSheetSectionProps {
  detail: ClubDetail;
  selectedMembershipIndex: number;
  fieldOverrides: Record<string, string>;
  onFieldOverrideChange: (key: string, value: string) => void;
  hiddenSheetItems: Set<string>;
  onHiddenSheetItemsChange: (items: Set<string>) => void;
  customItems: SheetCustomItemsMap;
  onCustomItemsChange: (items: SheetCustomItemsMap) => void;
  customTemplates: string[];
  onCustomTemplatesChange: (templates: string[]) => void;
  defaultManagerName?: string;
}

export default function BenefitsSheetSection({
  detail,
  selectedMembershipIndex,
  fieldOverrides,
  onFieldOverrideChange,
  hiddenSheetItems,
  onHiddenSheetItemsChange,
  customItems,
  onCustomItemsChange,
  defaultManagerName,
}: BenefitsSheetSectionProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [jpegDownloading, setJpegDownloading] = useState(false);

  const membership = detail.memberships?.[selectedMembershipIndex];

  const handleJpegDownload = async () => {
    if (!sheetRef.current || !detail) return;
    setJpegDownloading(true);
    try {
      const blob = await captureSheetAsJpeg(sheetRef.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${detail.name}_혜택지.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("JPEG 다운로드 에러:", error);
      alert("JPEG 다운로드에 실패했습니다.");
    } finally {
      setJpegDownloading(false);
    }
  };

  const printGroups: PrintSelectorGroup[] = [
    {
      title: "골프장 정보",
      items: [
        { key: "clubName", label: "골프장명", hasData: !!detail.name },
        { key: "companyName", label: "회사명", hasData: !!detail.companyName },
        { key: "holes", label: "코스규모", hasData: !!detail.basicInfo.holes },
        { key: "memberCount", label: "회원수", hasData: detail.basicInfo.memberCount != null },
        { key: "address", label: "위치", hasData: !!(detail.address || detail.region) },
        { key: "phone", label: "전화번호", hasData: !!detail.contacts?.length },
        { key: "openingDate", label: "개장일", hasData: !!detail.basicInfo.openingDate },
        { key: "totalLength", label: "코스거리", hasData: !!detail.basicInfo.totalLength },
        { key: "facilities", label: "부대시설", hasData: !!detail.basicInfo.facilities },
        { key: "homepage", label: "홈페이지", hasData: !!detail.website },
      ],
    },
    {
      title: "회원권 정보",
      items: [
        {
          key: "membershipType",
          label: "회원권명",
          hasData: !!(membership?.membershipName || membership?.membershipType),
        },
        { key: "initialSalePrice", label: "분양가", hasData: !!membership?.initialSalePrice },
        { key: "memberComposition", label: "회원구성", hasData: !!detail.marketInfo?.membershipInfo },
        { key: "benefits", label: "회원 혜택" },
        {
          key: "reservation",
          label: "예약 안내",
          hasData: !!(membership?.reservationNotes || detail.registration.reservationNotes),
        },
        { key: "specialNotes", label: "특이사항", hasData: !!membership?.specialNotes },
        { key: "memo", label: "기타정보", hasData: !!detail.memo },
      ],
    },
    {
      title: "기타",
      items: [
        { key: "registrationFee", label: "명의개서료", hasData: !!detail.costs.registrationFee },
        { key: "stampDuty", label: "인지대", hasData: !!detail.costs.stampDuty },
        { key: "agencyFee", label: "대행수수료", hasData: !!detail.costs.agencyFee },
        { key: "otherCosts", label: "기타비용", hasData: !!detail.costs.otherCosts },
        { key: "greenFee", label: "그린피" },
        { key: "manager", label: "담당자 정보" },
      ],
    },
  ];

  return (
    <div className={sheetStyles.sheetStage}>
      <SheetToolbar
        title="혜택지"
        showEditBadge
        onPrint={() => sheetRef.current && printSheetFitToPage(sheetRef.current)}
        onJpeg={handleJpegDownload}
        jpegLoading={jpegDownloading}
      />
      <PrintItemSelector
        groups={printGroups}
        hidden={hiddenSheetItems}
        onChange={onHiddenSheetItemsChange}
      />
      <MembershipInfoSheet
        ref={sheetRef}
        detail={detail}
        selectedMembershipIndex={selectedMembershipIndex}
        hiddenItems={hiddenSheetItems}
        customItems={customItems}
        fieldOverrides={fieldOverrides}
        onFieldOverrideChange={onFieldOverrideChange}
        onHiddenItemsChange={onHiddenSheetItemsChange}
        onCustomItemsChange={onCustomItemsChange}
        defaultManagerName={defaultManagerName}
      />
    </div>
  );
}
