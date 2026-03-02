"use client";

interface ClubBasicInfoTableProps {
  companyName?: string;
  openingDate?: string;
  holes?: string;
  memberCount?: string;
  address?: string;
  region?: string;
  memberDaySchedule?: string;
  phoneNumber?: string;
  totalLength?: string;
  courseNames?: string[];
  introduction?: string;
  facilities?: string;
}

export default function ClubBasicInfoTable({
  companyName,
  openingDate,
  holes,
  memberCount,
  address,
  region,
  memberDaySchedule,
  phoneNumber,
  totalLength,
  courseNames,
  introduction,
  facilities,
}: ClubBasicInfoTableProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50">
        <span className="text-sm font-semibold text-gray-800">골프장 정보</span>
      </div>
    <table className="w-full border-collapse table-fixed">
      <colgroup>
        <col className="w-24" />
        <col />
        <col className="w-24" />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
            회 사 명
          </td>
          <td className="border border-gray-300 px-3 py-2 text-sm">
            {companyName || "-"}
          </td>
          <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
            개 장 일
          </td>
          <td className="border border-gray-300 px-3 py-2 text-sm">
            {openingDate ? formatDate(openingDate) : "-"}
          </td>
        </tr>
        <tr>
          <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
            코스규모
          </td>
          <td colSpan={memberCount ? 1 : 3} className="border border-gray-300 px-3 py-2 text-sm">
            {holes || "-"}
          </td>
          {memberCount && (
            <>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                회 원 수
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm">
                {memberCount}
              </td>
            </>
          )}
        </tr>
        {(address || region || memberDaySchedule) && (
          <tr>
            {(address || region) ? (
              <>
                <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                  위 치
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {address || region}
                </td>
              </>
            ) : (
              <>
                <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                  회원의 날
                </td>
                <td colSpan={3} className="border border-gray-300 px-3 py-2 text-sm">
                  {memberDaySchedule || "-"}
                </td>
              </>
            )}
            {(address || region) && (
              <>
                <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                  회원의 날
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {memberDaySchedule || "-"}
                </td>
              </>
            )}
          </tr>
        )}
        <tr>
          <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
            전화번호
          </td>
          <td className="border border-gray-300 px-3 py-2 text-sm">
            {phoneNumber || "-"}
          </td>
          <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
            코스거리
          </td>
          <td className="border border-gray-300 px-3 py-2 text-sm">
            {totalLength || "-"}
          </td>
        </tr>
        {(courseNames && courseNames.length > 0 || facilities) && (
          <tr>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
              코스명
            </td>
            <td className="border border-gray-300 px-3 py-2 text-sm">
              {courseNames && courseNames.length > 0 ? courseNames.join(", ") : "-"}
            </td>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
              부대시설
            </td>
            <td className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap">
              {facilities || "-"}
            </td>
          </tr>
        )}
        {introduction && (
          <tr>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
              소 개
            </td>
            <td colSpan={3} className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap">
              {introduction}
            </td>
          </tr>
        )}
      </tbody>
    </table>
    </div>
  );
}
