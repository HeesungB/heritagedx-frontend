import { Step } from "@/types";

interface StepItemProps {
  step: Step;
}

export default function StepItem({ step }: StepItemProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded ${
        step.active ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      <div
        className={`w-8 h-8 flex items-center justify-center border-2 text-sm font-bold shrink-0 ${
          step.active
            ? "border-white text-white"
            : "border-gray-900 text-gray-900"
        }`}
      >
        {step.number}
      </div>
      <div>
        <div className="font-semibold">{step.title}</div>
        <div
          className={`text-sm ${step.active ? "text-gray-300" : "text-gray-500"}`}
        >
          {step.description}
        </div>
      </div>
    </div>
  );
}
