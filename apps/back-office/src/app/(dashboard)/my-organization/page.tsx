"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRepositories } from "@heritage-dx/api";
import { Organization } from "@/types";

export default function MyOrganizationPage() {
  const { organizations: organizationsAdmin } = useAdminRepositories();
  const { user } = useAuth();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ORG_ADMIN";

  useEffect(() => {
    if (user && !isAdmin) {
      router.replace("/");
      return;
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    async function fetchOrganization() {
      if (!isAdmin) return;

      if (!user?.organizationId) {
        setError("조직 정보가 없습니다.");
        setIsLoading(false);
        return;
      }

      const response = await organizationsAdmin.getOne(user.organizationId);
      if (response.success && response.data) {
        setOrganization(response.data);
      } else {
        setError(response.error || "조직 정보를 불러올 수 없습니다.");
      }
      setIsLoading(false);
    }

    fetchOrganization();
  }, [user?.organizationId, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!organization) return null;

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "조직명", value: organization.name },
    { label: "상호명", value: organization.businessName },
    { label: "대표자명", value: organization.representativeName },
    { label: "사업자등록번호", value: organization.registrationNumber },
    { label: "업종", value: organization.businessType },
    { label: "주소", value: organization.address },
    { label: "전화번호", value: organization.phoneNumber },
    { label: "팩스번호", value: organization.faxNumber },
    { label: "입금계좌", value: organization.depositAccount },
    { label: "사용자 수", value: `${organization.userCount}명` },
    {
      label: "상태",
      value: organization.isActive ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          활성
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          비활성
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">나의 조직</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {fields.map((field) => (
            <div key={field.label} className="flex px-6 py-4">
              <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">
                {field.label}
              </dt>
              <dd className="text-sm text-gray-900">
                {field.value || (
                  <span className="text-gray-300">-</span>
                )}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
