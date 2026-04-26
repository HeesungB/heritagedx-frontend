# Heritage DX Admin API 레퍼런스

> spec: `v1.0.0+d8345ee2` · captured: `2026-04-22` (다음 캡처에서 본 변경분 정식 반영 예정 — Phase B)
> 범위: `https://api.heritage-dx.com/api/admin/*` — 관리자 전용 엔드포인트 **80 operations / 14 파일** (캡처 시점 기준).

공개 API 는 [`../README.md`](../README.md) 참조. 인증·응답 envelope·에러·페이지네이션 규칙은 전부 공통이다.

## 2026-04 변경 요약 (캡처 갱신 전 임시 메모)

- `PATCH /api/admin/consultations/:id/approval-action` 의 `action` enum이 **`APPROVE_FIRST | REOPEN`** 으로 축소됨. (`REQUEST_APPROVAL` / `HOLD` / `REJECT` 불가)
- `PATCH /api/admin/membership-trades/:id/workflow-action` 의 `action` enum이 **`ADVANCE_TO_TAX_FILING | ADVANCE_TO_COMPLETED | REJECT`** 로 재정의됨. REJECT 는 거래 레코드를 *물리 삭제*하고 원천 상담을 `DRAFT` 로 복귀시키며 다른 거래가 없으면 고객 등급을 `HIGH_INTENT` 로 자동 하향한다.
- 거래 모델 워크플로우 상태에 단계 전환 상태(예: `TAX_FILING`, `COMPLETED`)가 추가됨 — 정확한 enum 이름은 신규 스펙 캡처 후 확정.
- 완료 거래(및 거래에 연결된 상담)는 수정/삭제가 서버에서 거부된다.

## 인증 / 권한

- 모든 admin 엔드포인트는 쿠키 `hdx_access_token` 필수.
- 스펙상 역할: `SUPER_ADMIN`, `ORG_ADMIN`, `EDITOR`. 개별 엔드포인트가 요구하는 최소 역할은 스펙에 명시되어 있지 않음 — 403 응답 여부로 런타임 판별.

## 파일 구조

| 파일 | 도메인 | 엔드포인트 수 |
|---|---|---|
| [`clubs.md`](clubs.md) | 골프장 CRUD + 클럽 하위 시나리오 조회 | 10 |
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

## 하위 경로 id 매핑 메모

Club 하위 리소스(`/api/admin/clubs/{clubId}/...`)는 `GET /api/clubs` 의 `data.clubs[].id` 를 재사용한다. 별도의 `GET /api/admin/clubs` 목록 엔드포인트는 존재하지 않는다.

- `clubId` ← `GET /api/clubs` → `data.clubs[0].id`
- `scenarioId` ← `GET /api/admin/clubs/{clubId}/scenarios` → 첫 항목의 `id`
- `membershipId` (admin) ← `GET /api/admin/clubs/{clubId}/memberships` → 첫 항목의 `id`

이 매핑은 수집 스크립트 `/tmp/collect-samples*.py` 에 구현되어 있다.
