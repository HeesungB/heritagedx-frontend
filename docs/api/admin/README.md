# Heritage DX Admin API 레퍼런스

> spec: `v1.0.0+d8345ee2` · captured: `2026-04-22`
> 범위: `https://api.heritage-dx.com/api/admin/*` — 관리자 전용 엔드포인트 **80 operations / 14 파일**.

공개 API 는 [`../README.md`](../README.md) 참조. 인증·응답 envelope·에러·페이지네이션 규칙은 전부 공통이다.

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
