import { render, act, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "../AuthContext";
import type { AuthApi } from "../auth-api";

// next/navigation mock
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// @heritage-dx/api-client mock
vi.mock("@heritage-dx/api-client", () => ({
  setAuthExpiredHandler: vi.fn(),
}));

function createMockAuthApi(overrides?: Partial<AuthApi>): AuthApi {
  return {
    login: vi.fn().mockResolvedValue({ success: true, data: { user: mockUser } }),
    logout: vi.fn().mockResolvedValue({ success: true }),
    me: vi.fn().mockResolvedValue({ success: true, data: mockUser }),
    refresh: vi.fn().mockResolvedValue(true),
    changePassword: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
}

const mockUser = {
  id: "1",
  email: "test@test.com",
  name: "Test User",
  role: "SUPER_ADMIN" as const,
};

// Helper component to read auth context
function AuthStatus() {
  const { user } = useAuth();
  return <div data-testid="user">{user ? user.name : "null"}</div>;
}

describe("AuthProvider — visibilitychange token refresh", () => {
  let authApi: AuthApi;

  beforeEach(() => {
    vi.useFakeTimers();
    authApi = createMockAuthApi();
    mockReplace.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function renderWithAuth(api?: AuthApi) {
    const usedApi = api ?? authApi;
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <AuthProvider authApi={usedApi} loginPath="/login">
          <AuthStatus />
        </AuthProvider>,
      );
    });
    return result!;
  }

  function fireVisibilityChange(state: "visible" | "hidden") {
    Object.defineProperty(document, "visibilityState", {
      value: state,
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }

  it("calls refresh when tab becomes visible", async () => {
    await renderWithAuth();
    expect(screen.getByTestId("user").textContent).toBe("Test User");

    await act(async () => {
      fireVisibilityChange("visible");
    });

    expect(authApi.refresh).toHaveBeenCalled();
  });

  it("does not call refresh when tab becomes hidden", async () => {
    await renderWithAuth();

    // Clear any calls from initial render
    (authApi.refresh as ReturnType<typeof vi.fn>).mockClear();

    await act(async () => {
      fireVisibilityChange("hidden");
    });

    expect(authApi.refresh).not.toHaveBeenCalled();
  });

  it("logs out when refresh fails on visibility change", async () => {
    await renderWithAuth();

    (authApi.refresh as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    await act(async () => {
      fireVisibilityChange("visible");
    });

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("does not register listener when user is null", async () => {
    const noUserApi = createMockAuthApi({
      me: vi.fn().mockResolvedValue({ success: false }),
    });

    await renderWithAuth(noUserApi);
    expect(screen.getByTestId("user").textContent).toBe("null");

    (noUserApi.refresh as ReturnType<typeof vi.fn>).mockClear();

    await act(async () => {
      fireVisibilityChange("visible");
    });

    expect(noUserApi.refresh).not.toHaveBeenCalled();
  });

  it("removes listener on unmount", async () => {
    const { unmount } = await renderWithAuth();

    (authApi.refresh as ReturnType<typeof vi.fn>).mockClear();

    unmount();

    await act(async () => {
      fireVisibilityChange("visible");
    });

    expect(authApi.refresh).not.toHaveBeenCalled();
  });

  it("calls refresh on 14-minute interval", async () => {
    await renderWithAuth();

    (authApi.refresh as ReturnType<typeof vi.fn>).mockClear();

    await act(async () => {
      vi.advanceTimersByTime(14 * 60 * 1000);
    });

    expect(authApi.refresh).toHaveBeenCalledTimes(1);
  });
});
