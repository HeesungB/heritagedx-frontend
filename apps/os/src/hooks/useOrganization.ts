"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/authApi";
import { OrganizationEntity } from "@/types/organization";

export function useOrganization() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationEntity | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.organizationId) {
      setOrganization(null);
      return;
    }

    let cancelled = false;

    const fetchOrg = async () => {
      setLoading(true);
      const result = await authApi.getOrganization(user.organizationId!);
      if (!cancelled && result.success && result.data) {
        setOrganization(result.data);
      }
      if (!cancelled) setLoading(false);
    };

    fetchOrg();

    return () => {
      cancelled = true;
    };
  }, [user?.organizationId]);

  return { organization, loading };
}
