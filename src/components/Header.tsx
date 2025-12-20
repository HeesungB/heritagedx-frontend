interface HeaderProps {
  clubName: string | null;
}

export default function Header({ clubName }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 px-4 lg:px-8 py-4 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">HERITAGE OS (HDX)</h1>
          <p className="text-sm text-gray-600 hidden sm:block">회원권 딜러 실무 정보 허브</p>
        </div>
        {clubName && (
          <div className="text-right hidden sm:block">
            <span className="text-sm text-gray-500">선택된 골프장</span>
            <p className="font-semibold text-gray-900">{clubName}</p>
          </div>
        )}
      </div>
    </header>
  );
}
