// 사용자 역할 (OpenAPI 스펙 enum)
export type UserRole = "SUPER_ADMIN" | "ORG_ADMIN" | "EDITOR";

// 사용자 (OpenAPI UserDto)
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName?: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 기존 AdminUser alias — UserDto 단일 DTO 로 통합 후 호환용
export type AdminUser = User;

// 사용자 생성 입력 (OpenAPI CreateUserDto)
export interface UserCreateInput {
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
}

// 사용자 수정 입력 (OpenAPI UpdateUserDto)
export interface UserUpdateInput {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

// 로그인 응답 (AuthSessionDataDto 중 user 부분)
export interface LoginResponse {
  user: User;
}
