"use client";

interface MobileNavigationProps {
  currentView: "clubs" | "profile" | "transaction";
  onViewChange: (view: "clubs" | "profile" | "transaction") => void;
  hasSelectedClub: boolean;
}

export default function MobileNavigation({
  currentView,
  onViewChange,
  hasSelectedClub,
}: MobileNavigationProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        <button
          onClick={() => onViewChange("clubs")}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            currentView === "clubs"
              ? "text-gray-900 bg-gray-100"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <svg
            className="w-5 h-5 mx-auto mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          골프장
        </button>

        <button
          onClick={() => hasSelectedClub && onViewChange("profile")}
          disabled={!hasSelectedClub}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            currentView === "profile"
              ? "text-gray-900 bg-gray-100"
              : hasSelectedClub
              ? "text-gray-500 hover:bg-gray-50"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <svg
            className="w-5 h-5 mx-auto mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          프로필
        </button>

        <button
          onClick={() => hasSelectedClub && onViewChange("transaction")}
          disabled={!hasSelectedClub}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            currentView === "transaction"
              ? "text-gray-900 bg-gray-100"
              : hasSelectedClub
              ? "text-gray-500 hover:bg-gray-50"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <svg
            className="w-5 h-5 mx-auto mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          서류
        </button>
      </div>
    </nav>
  );
}
