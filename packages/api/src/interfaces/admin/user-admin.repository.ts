import type {
  ApiResponse,
  AdminUser,
  UserCreateInput,
  UserUpdateInput,
} from "@heritage-dx/types";
import type { ListParams, UsersResponse } from "../../types";

export interface IUserAdminRepository {
  getAll(params?: ListParams): Promise<ApiResponse<UsersResponse>>;
  create(data: UserCreateInput): Promise<ApiResponse<AdminUser>>;
  update(id: string, data: UserUpdateInput): Promise<ApiResponse<AdminUser>>;
  delete(id: string): Promise<ApiResponse<void>>;
  resetPassword(id: string): Promise<ApiResponse<void>>;
}
