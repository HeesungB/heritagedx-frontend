import type { UserRole } from "@heritage-dx/types";
export type { UserRole };

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  mustChangePassword?: boolean;
}

export interface AdminUserEntity extends UserEntity {
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}
