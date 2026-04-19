import { z } from "zod";

// 빈 문자열/undefined/null을 undefined로 변환하고, 숫자 문자열은 number로 변환하는 헬퍼
export const optionalNumber = z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  },
  z.number().optional()
);
