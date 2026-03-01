"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          color: "#111827",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            문제가 발생했습니다
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
            페이지를 불러오는 중 오류가 발생했습니다.
            <br />
            새로고침하면 대부분 해결됩니다.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: "#111827",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              marginRight: "0.5rem",
            }}
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: "#ffffff",
              color: "#111827",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            새로고침
          </button>
        </div>
      </body>
    </html>
  );
}
