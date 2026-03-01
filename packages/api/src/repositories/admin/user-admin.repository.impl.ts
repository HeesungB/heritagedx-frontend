import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  AdminUser,
  UserCreateInput,
  UserUpdateInput,
} from "@heritage-dx/types";
import type { IUserAdminRepository } from "../../interfaces/admin/user-admin.repository";
import type { ListParams, UsersResponse } from "../../types";
import { normalizeListResponse } from "../../normalizers/normalize-list";

export class UserAdminRepository implements IUserAdminRepository {
  constructor(private api: ApiClient) {}

  async getAll(params?: ListParams): Promise<ApiResponse<UsersResponse>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.api.get<any>("/admin/users", params);
    if (response.success && response.data) {
      const { items, pagination } = normalizeListResponse<AdminUser>(
        response.data,
        "users",
      );
      return {
        success: true,
        data: { users: items, pagination },
      };
    }
    return response as ApiResponse<UsersResponse>;
  }

  async create(data: UserCreateInput): Promise<ApiResponse<AdminUser>> {
    return this.api.post<AdminUser>("/admin/users", data);
  }

  async update(
    id: string,
    data: UserUpdateInput,
  ): Promise<ApiResponse<AdminUser>> {
    return this.api.put<AdminUser>(`/admin/users/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/admin/users/${id}`);
  }

  async resetPassword(id: string): Promise<ApiResponse<void>> {
    return this.api.post(`/admin/users/${id}/reset-password`);
  }
}
