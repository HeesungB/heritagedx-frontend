export default function ClubsLoading() {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="border-b border-gray-200 px-4 lg:px-8 py-4 bg-white">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="flex-1 flex">
        <div className="w-72 border-r border-gray-200 bg-white p-3 space-y-3 hidden lg:block">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
