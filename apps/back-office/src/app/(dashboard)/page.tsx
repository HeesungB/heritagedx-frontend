"use client";

import Link from "next/link";
import {
  Building2,
  FileText,
  MessageSquare,
  ArrowRightLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent } from "@heritage-dx/ui";
import KpiMiniDashboard from "@/components/kpi/KpiMiniDashboard";

interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  stat?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { clubs, isLoadingClubs } = useData();

  const quickLinks: QuickLink[] = [
    {
      title: "골프장 관리",
      description: "골프장 정보 조회 및 관리",
      href: "/clubs",
      icon: <Building2 className="w-6 h-6" />,
      stat: !isLoadingClubs ? `${clubs.length}개 등록` : undefined,
    },
    {
      title: "공통 서류함",
      description: "공용 서류 관리",
      href: "/common-documents",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: "상담일지",
      description: "상담일지 관리",
      href: "/trade-memos",
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      title: "거래 내역",
      description: "회원권 거래 내역 관리",
      href: "/trade-records",
      icon: <ArrowRightLeft className="w-6 h-6" />,
    },
  ];

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          안녕하세요, {user?.name ?? "관리자"}님
        </h1>
        <p className="text-gray-500 mb-8">Heritage 백오피스에 오신 것을 환영합니다.</p>

        <KpiMiniDashboard />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                <CardContent className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    {link.icon}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900">
                      {link.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {link.description}
                    </p>
                    {link.stat && (
                      <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {link.stat}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
