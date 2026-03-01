"use client";

interface GreenFeeFieldProps {
  label: string;
  data?: number | Record<string, number>;
}

export default function GreenFeeField({ label, data }: GreenFeeFieldProps) {
  if (!data) {
    return (
      <div>
        <label className="block text-sm text-gray-500 mb-1">{label}</label>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
          -
        </div>
      </div>
    );
  }

  if (typeof data === "number") {
    return (
      <div>
        <label className="block text-sm text-gray-500 mb-1">{label}</label>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
          {data.toLocaleString()}원
        </div>
      </div>
    );
  }

  const entries = Object.entries(data);
  if (entries.length === 0) {
    return (
      <div>
        <label className="block text-sm text-gray-500 mb-1">{label}</label>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
          -
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
        <div className="space-y-1">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-gray-600">{key}</span>
              <span className="font-medium text-gray-900">
                {value.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
