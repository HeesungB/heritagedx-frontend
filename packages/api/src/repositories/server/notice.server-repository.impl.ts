import type { ApiResponse, Notice, NoticeInput, NoticesData } from "@heritage-dx/types";
import type {
  INoticeRepository,
  NoticeListParams,
} from "../../interfaces/general/notice.repository";

interface ServerRepoConfig {
  baseUrl: string;
  revalidate?: number;
}

const DEFAULT_TTL = 1800;
const CACHE_TAG = "notices";

export class NoticeServerRepository implements INoticeRepository {
  constructor(private config: ServerRepoConfig) {}

  async list(params?: NoticeListParams): Promise<ApiResponse<NoticesData>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.order) sp.set("order", params.order);
    if (params?.search) sp.set("search", params.search);

    const query = sp.toString();
    const res = await fetch(
      `${this.config.baseUrl}/notices${query ? `?${query}` : ""}`,
      {
        next: {
          revalidate: this.config.revalidate ?? DEFAULT_TTL,
          tags: [CACHE_TAG],
        },
      },
    );

    if (!res.ok) {
      return { success: false, error: "공지사항을 불러오는데 실패했습니다." };
    }

    const data = await res.json();
    return { success: true, data: data.data || data };
  }

  async create(_input: NoticeInput): Promise<ApiResponse<Notice>> {
    return { success: false, error: "쓰기 작업은 서버 리포지토리에서 지원하지 않습니다." };
  }

  async update(_id: string, _input: NoticeInput): Promise<ApiResponse<Notice>> {
    return { success: false, error: "쓰기 작업은 서버 리포지토리에서 지원하지 않습니다." };
  }

  async delete(_id: string): Promise<ApiResponse<void>> {
    return { success: false, error: "쓰기 작업은 서버 리포지토리에서 지원하지 않습니다." };
  }
}
