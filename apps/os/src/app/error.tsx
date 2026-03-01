"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center px-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          문제가 발생했습니다
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          페이지를 불러오는 중 오류가 발생했습니다.
          <br />
          새로고침하면 대부분 해결됩니다.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-5 py-2 text-sm font-medium"
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.reload()}
            className="border border-gray-300 hover:bg-gray-50 rounded-md px-5 py-2 text-sm font-medium"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
}
