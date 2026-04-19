import type {
  ApiResponse,
  Customer,
  CustomerInput,
  CustomerUpdateInput,
  CustomersListData,
  CustomerHistory,
  CustomerHistorySummary,
} from "@heritage-dx/types";

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "ASC" | "DESC";
}

export interface ICustomerRepository {
  getAll(params?: CustomerListParams): Promise<ApiResponse<CustomersListData>>;
  getOne(id: string): Promise<ApiResponse<Customer>>;
  create(data: CustomerInput): Promise<ApiResponse<Customer>>;
  update(id: string, data: CustomerUpdateInput): Promise<ApiResponse<Customer>>;
  delete(id: string): Promise<ApiResponse<void>>;
  getHistory(id: string): Promise<ApiResponse<CustomerHistory>>;
  getHistorySummary(id: string): Promise<ApiResponse<CustomerHistorySummary>>;
}
