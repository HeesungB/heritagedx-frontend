import type { UserRole, ApprovalStatus } from "@heritage-dx/types";
import { APPROVAL_STATUS } from "@heritage-dx/types";

export type { UserRole };

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "최고 관리자",
  ORG_ADMIN: "관리자",
  EDITOR: "편집자",
};

export type RoleBadgeVariant = "default" | "success" | "info" | "warning";

export const ROLE_BADGE_VARIANTS: Record<UserRole, RoleBadgeVariant> = {
  SUPER_ADMIN: "default",
  ORG_ADMIN: "info",
  EDITOR: "warning",
};

type RoleHolder = { role: UserRole } | null | undefined;

export function canManageOrg(user: RoleHolder): boolean {
  return user?.role === "SUPER_ADMIN" || user?.role === "ORG_ADMIN";
}

export function canAccessUsersPage(user: RoleHolder): boolean {
  return !!user && user.role !== "EDITOR";
}

export interface AssignableRoleOption {
  value: UserRole;
  label: string;
}

export interface DeletableConsultation {
  approvalStatus: ApprovalStatus;
  linkedTradeId: string | null;
}

export function canDeleteConsultation(
  user: RoleHolder,
  cons: DeletableConsultation,
): boolean {
  if (!user) return false;
  const isConvertedOrApproved =
    cons.approvalStatus === APPROVAL_STATUS.DEPOSIT_APPROVED ||
    cons.approvalStatus === APPROVAL_STATUS.FIRST_APPROVED ||
    !!cons.linkedTradeId;
  if (isConvertedOrApproved) return canManageOrg(user);
  return true;
}

export function canDeleteTrade(user: RoleHolder): boolean {
  return canManageOrg(user);
}

export function getAssignableRoles(currentRole: UserRole): AssignableRoleOption[] {
  if (currentRole === "SUPER_ADMIN") {
    return (["EDITOR", "ORG_ADMIN", "SUPER_ADMIN"] as const).map((value) => ({
      value,
      label: ROLE_LABELS[value],
    }));
  }
  return [{ value: "EDITOR", label: ROLE_LABELS.EDITOR }];
}
