// 사용자 역할
export type UserRole = "SUPER_ADMIN" | "ORG_ADMIN" | "EDITOR";

// 사용자
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  mustChangePassword?: boolean;
}

// 관리자용 사용자 (목록 조회)
export interface AdminUser extends User {
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

// 사용자 생성 입력
export interface UserCreateInput {
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
}

// 사용자 수정 입력
export interface UserUpdateInput {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

// 로그인 응답
export interface LoginResponse {
  user: User;
}
