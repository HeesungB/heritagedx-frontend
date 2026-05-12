# Heritage DX Admin API 레퍼런스

> spec: `v1.0.0+57563d32` · captured: `2026-05-12`
> 범위: `https://api.heritage-dx.com/api/admin/*` — 관리자 전용 엔드포인트 **83 operations / 16 파일** (캡처 시점 기준).

공개 API 는 [`../README.md`](../README.md) 참조. 인증·응답 envelope·에러·페이지네이션 규칙은 전부 공통이다.

## 2026-05 변경 요약

- **상담 응답 스키마 정리**
  - 신규 `progressStatus` 필드 추가 (`IN_CONSULTATION | PENDING_DEPOSIT | DOCUMENT_AND_BALANCE | TAX_FILING | COMPLETED`) — 상담↔거래 통합 진행 상태.
  - `isDone`, `holdReason`, `rejectionReason` 응답에서 제거. 완료 판별은 `progressStatus === "COMPLETED"`.
  - `approvalStatus` enum 이 `IN_CONSULTATION | PENDING_DEPOSIT | DEPOSIT_APPROVED` 3 값으로 축소 (구 `DRAFT/PENDING_APPROVAL/FIRST_APPROVED/ON_HOLD/REJECTED` 는 도달 불가).
- **거래 workflowStatus enum 확정**: `DOCUMENT_AND_BALANCE | TAX_FILING | COMPLETED | REJECTED`.
- **거래 응답에 `settlementId` 신규**. 구 필드 `submittedForFinalReviewAt / finalRejectedAt / finalRejectionReason` 는 제거. `finalApprovedAt` 만 유지.
- **상담 admin 액션 DTO 명칭 변경**: `ConsultationApprovalActionDto` → `ConsultationAdminApprovalActionDto` (`action: APPROVE_FIRST | REOPEN`. `reason` 필드는 서버 DTO 에 없음 — UI 의 사유 모달은 클라이언트 UX 전용).
- **거래 admin 워크플로우 액션**: `ADVANCE_TO_TAX_FILING | ADVANCE_TO_COMPLETED | REJECT`. `REJECT` 는 거래 레코드를 *물리 삭제*하고 원천 상담을 `IN_CONSULTATION` 으로 복귀시키며, 응답 형태가 `MembershipTradeDeleteResponseDto` 로 분기 (`oneOf [Detail | Delete]`).
- **신규 admin 도메인 2개**
  - `GET /api/admin/scenarios`, `GET /api/admin/scenarios/{id}` — 글로벌 시나리오 카탈로그 (per-club 은 `clubs.md` 의 `/api/admin/clubs/{clubId}/scenarios` 별도).
  - `GET /api/admin/settlements`, `GET /api/admin/settlements/{id}`, `PUT /api/admin/settlements/{id}` — admin 입출금표 목록/상세/수정 (general 의 consultationId-keyed 경로와 별개).
- **신규 club 하위 리소스**: `GET/POST /api/admin/clubs/{clubId}/customer-documents`, `GET/PUT/DELETE /api/admin/clubs/{clubId}/customer-documents/{id}`.
- **완료 거래 락**: COMPLETED 거래와 그 거래에 연결된 상담은 수정/삭제가 서버에서 거부된다.

## 인증 / 권한

- 모든 admin 엔드포인트는 쿠키 `hdx_access_token` 필수.
- 스펙상 역할: `SUPER_ADMIN`, `ORG_ADMIN`, `EDITOR`. 개별 엔드포인트가 요구하는 최소 역할은 스펙에 명시되어 있지 않음 — 403 응답 여부로 런타임 판별.

## 파일 구조

| 파일 | 도메인 | 엔드포인트 수 |
|---|---|---|
| [`clubs.md`](clubs.md) | 골프장 CRUD + 클럽 하위 시나리오 조회 | 4 |
| [`documents.md`](documents.md) | Club / Global / Customer / Membership 문서 CRUD · 다운로드 URL | 24 |
| [`memberships.md`](memberships.md) | 회원권 CRUD | 5 |
| [`membership-listings.md`](membership-listings.md) | 매물 CRUD · 벌크 등록 | 5 |
| [`market-prices.md`](market-prices.md) | 시세 XLSX 임포트 | 1 |
| [`consultations.md`](consultations.md) | 상담 CRUD · 승인 액션 | 6 |
| [`membership-trades.md`](membership-trades.md) | 거래 CRUD · 워크플로 액션 | 6 |
| [`notices.md`](notices.md) | 공지 CRUD · 첨부파일 삭제 | 6 |
| [`kpi.md`](kpi.md) | 거래·상담 KPI | 2 |
| [`employees.md`](employees.md) | 조직원 목록 | 1 |
| [`organizations.md`](organizations.md) | 조직 CRUD · 로고 업로드 | 7 |
| [`users.md`](users.md) | 사용자 CRUD · 비밀번호 초기화 | 6 |
| [`audit-logs.md`](audit-logs.md) | 감사 로그 조회 | 1 |
| [`scenarios.md`](scenarios.md) | 글로벌 시나리오 카탈로그 (read-only) | 2 |
| [`settlements.md`](settlements.md) | 입출금표 목록·상세·수정 | 3 |

문서 별 op 수 합 = 79 (clubs 의 하위 리소스 일부 → documents.md 로 묶음 포함 시 83).

## 하위 경로 id 매핑 메모

Club 하위 리소스(`/api/admin/clubs/{clubId}/...`)는 `GET /api/clubs` 의 `data.clubs[].id` 를 재사용한다. 별도의 `GET /api/admin/clubs` 목록 엔드포인트는 존재하지 않는다.

- `clubId` ← `GET /api/clubs` → `data.clubs[0].id`
- `scenarioId` ← `GET /api/admin/clubs/{clubId}/scenarios` → 첫 항목의 `id`
- `membershipId` (admin) ← `GET /api/admin/clubs/{clubId}/memberships` → 첫 항목의 `id`
- `settlementId` (admin) ← `GET /api/admin/settlements` → 첫 항목의 `id` (general 의 consultationId-keyed 경로와 키가 다름)

이 매핑은 수집 스크립트 `/tmp/collect-samples*.py` 에 구현되어 있다.
