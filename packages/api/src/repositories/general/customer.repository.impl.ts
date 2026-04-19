import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  Customer,
  CustomerInput,
  CustomerUpdateInput,
  CustomersListData,
  CustomerHistory,
  CustomerHistorySummary,
  Pagination,
} from "@heritage-dx/types";
import type {
  ICustomerRepository,
  CustomerListParams,
} from "../../interfaces/general/customer.repository";

// 서버가 Customer 목록에 대해 legacy 키셋을 반환하므로 공용 Pagination 으로 정규화한다.
interface LegacyCustomerPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

function legacyToPagination(p: LegacyCustomerPagination): Pagination {
  return {
    page: p.currentPage,
    limit: p.itemsPerPage,
    total: p.totalItems,
    totalPages: p.totalPages,
    hasNext: p.currentPage < p.totalPages,
    hasPrev: p.currentPage > 1,
  };
}

export class CustomerRepository implements ICustomerRepository {
  constructor(private api: ApiClient) {}

  async getAll(
    params?: CustomerListParams,
  ): Promise<ApiResponse<CustomersListData>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.order) searchParams.append("order", params.order);
    const queryString = searchParams.toString();
    const endpoint = `/customers${queryString ? `?${queryString}` : ""}`;

    const response = await this.api.get<{
      customers: Customer[];
      pagination: LegacyCustomerPagination;
    }>(endpoint);

    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    return {
      success: true,
      data: {
        customers: response.data.customers,
        pagination: legacyToPagination(response.data.pagination),
      },
    };
  }

  async getOne(id: string): Promise<ApiResponse<Customer>> {
    return this.api.get<Customer>(`/customers/${id}`);
  }

  async create(data: CustomerInput): Promise<ApiResponse<Customer>> {
    return this.api.post<Customer>("/customers", data);
  }

  async update(
    id: string,
    data: CustomerUpdateInput,
  ): Promise<ApiResponse<Customer>> {
    return this.api.put<Customer>(`/customers/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/customers/${id}`);
  }

  async getHistory(id: string): Promise<ApiResponse<CustomerHistory>> {
    return this.api.get<CustomerHistory>(`/customers/${id}/history`);
  }

  async getHistorySummary(
    id: string,
  ): Promise<ApiResponse<CustomerHistorySummary>> {
    return this.api.get<CustomerHistorySummary>(
      `/customers/${id}/history/summary`,
    );
  }
}
