"use client";

import MembershipCalculator from "../MembershipCalculator";
import InfoField from "./InfoField";

interface CostCalculatorSectionProps {
  taxOfficial?: string;
  transferFee?: string;
  recentMarketPrice?: string;
  onShowTaxGuide: () => void;
}

export default function CostCalculatorSection({
  taxOfficial,
  transferFee,
  recentMarketPrice,
  onShowTaxGuide,
}: CostCalculatorSectionProps) {
  return (
    <div className="space-y-6">
      {/* 세무/행정 정보 */}
      <section>
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
          세무/행정 정보
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <InfoField
            label="관할 세무서"
            value={taxOfficial}
            fullWidth
          />
        </div>
      </section>

      {/* 취득세/양도세 산출 */}
      <section>
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
          취득세/양도세 산출
        </h3>
        <MembershipCalculator
          transferFee={transferFee}
          recentMarketPrice={recentMarketPrice}
          onShowTaxGuide={onShowTaxGuide}
        />
      </section>
    </div>
  );
}
