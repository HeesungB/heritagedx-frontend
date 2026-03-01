"use client";

interface InfoFieldProps {
  label: string;
  value?: string | null;
  highlight?: boolean;
  fullWidth?: boolean;
  isPhone?: boolean;
  isEmail?: boolean;
}

export default function InfoField({
  label,
  value,
  highlight,
  fullWidth,
  isPhone,
  isEmail,
}: InfoFieldProps) {
  const safeValue =
    typeof value === "object" && value !== null ? JSON.stringify(value) : value;
  const displayValue = safeValue || "-";
  const hasValue = safeValue && safeValue !== "-";

  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <div
        className={`p-3 border rounded text-gray-900 ${
          highlight && hasValue
            ? "bg-green-50 border-green-200 font-semibold text-green-800"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        {isPhone && hasValue ? (
          <a
            href={`tel:${safeValue}`}
            className="text-blue-600 hover:underline"
          >
            {displayValue}
          </a>
        ) : isEmail && hasValue ? (
          <a
            href={`mailto:${safeValue}`}
            className="text-blue-600 hover:underline"
          >
            {displayValue}
          </a>
        ) : (
          displayValue
        )}
      </div>
    </div>
  );
}
