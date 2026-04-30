// AI 자연어 → 상담일지 초안 (POST /api/consultations/ai)
//
// AI 응답은 일회성 추론 결과이므로 entity/mapper 가 따로 필요 없다.
// 뷰가 `@heritage-dx/types` 를 직접 import 하지 않도록 도메인 패키지에서 re-export 한다.

export type {
  ConsultationAiInput,
  ConsultationAiDraft,
  ConsultationAiCandidate,
  ConsultationAiMatchInfo,
  ConsultationAiMissingField,
  ConsultationAiResponse,
} from "@heritage-dx/types";
