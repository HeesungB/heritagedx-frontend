import StepItem from "./StepItem";
import { Step } from "@/types";

interface SidebarProps {
  currentStep: number;
}

const stepsData: Omit<Step, "active">[] = [
  { number: 1, title: "단계 1", description: "골프장 선택" },
  { number: 2, title: "단계 2", description: "거래 유형 입력" },
  { number: 3, title: "단계 3", description: "필수 서류 목록" },
  {
    number: 4,
    title: "단계 4",
    description: "서류 제출·검증\n핵심 자동화 (L1-L3)",
  },
  {
    number: 5,
    title: "단계 5",
    description: "최종 결과\n판정 및 리스크 평가 (L4-L5)",
  },
];

export default function Sidebar({ currentStep }: SidebarProps) {
  const steps: Step[] = stepsData.map((step) => ({
    ...step,
    active: step.number === currentStep,
  }));

  return (
    <aside className="w-64 border-r border-gray-200 p-4 bg-gray-50">
      <div className="text-sm text-gray-500 mb-4">핵심 자동화 엔진 (L1-L3)</div>
      <div className="space-y-2">
        {steps.slice(0, 3).map((step) => (
          <StepItem key={step.number} step={step} />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-300">
        <div className="text-sm text-gray-500 mb-2">서류 제출·검토</div>
        <div className="text-xs text-gray-400 mb-4">
          서류 적합성 검증 및 최종 판정 절차
        </div>
        <div className="space-y-2">
          {steps.slice(3).map((step) => (
            <StepItem key={step.number} step={step} />
          ))}
        </div>
      </div>
    </aside>
  );
}
