"use client";

import { Club } from "@/types";

interface GolfClubTableProps {
  clubs: Club[];
  selectedCode: string | null;
  onSelect: (club: Club) => void;
}

export default function GolfClubTable({ clubs, selectedCode, onSelect }: GolfClubTableProps) {
  return (
    <div className="border border-gray-300 rounded overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300">
            <th className="text-left px-4 py-3 font-semibold">골프장명</th>
            <th className="text-left px-4 py-3 font-semibold">코드</th>
            <th className="text-left px-4 py-3 font-semibold">지역</th>
            <th className="text-left px-4 py-3 font-semibold">연락처</th>
            <th className="text-center px-4 py-3 font-semibold bg-gray-900 text-white">
              선택
            </th>
          </tr>
        </thead>
        <tbody>
          {clubs.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-500">
                검색 결과가 없습니다.
              </td>
            </tr>
          ) : (
            clubs.map((club) => {
              const isSelected = selectedCode === club.code;
              return (
                <tr
                  key={club.code}
                  className={`border-b border-gray-200 last:border-b-0 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-gray-900 text-white"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => onSelect(club)}
                >
                  <td className={`px-4 py-4 ${isSelected ? "font-semibold" : ""}`}>
                    {club.name || "-"}
                  </td>
                  <td className="px-4 py-4">{club.code}</td>
                  <td className="px-4 py-4">{club.region || "-"}</td>
                  <td className="px-4 py-4">{club.contact || "-"}</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(club);
                      }}
                      className={`px-4 py-2 border transition-colors ${
                        isSelected
                          ? "bg-white text-gray-900 border-white font-semibold"
                          : "border-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {isSelected ? "선택됨" : "선택"}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
