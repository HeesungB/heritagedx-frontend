import { Club, ClubDetail, Scenario } from "@/types";

interface HeaderProps {
  selectedClub: Club | null;
  clubDetail: ClubDetail | null;
  selectedScenario: Scenario | null;
}

export default function Header({ selectedClub, clubDetail, selectedScenario }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 px-8 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">HERITAGE OS (HDX)</h1>
        <p className="text-gray-600">회원권 명의개서 서류 처리</p>
      </div>
      <div className="text-right">
        {selectedClub && (
          <div>
            <span className="text-gray-600">대상 골프장: </span>
            <span className="font-bold">{clubDetail?.name || selectedClub.name}</span>
            <span className="text-gray-500 ml-2">({selectedClub.code})</span>
          </div>
        )}
        {selectedScenario && (
          <div className="text-sm mt-1">
            <span className="text-gray-600">거래 유형: </span>
            <span className="font-bold">{selectedScenario.scenarioCode}</span>
            <span className="text-gray-500 ml-2">— {selectedScenario.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
