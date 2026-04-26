# Heritage DX API 레퍼런스

> spec: `v1.0.0+d8345ee2` · captured: `2026-04-22` (다음 캡처에서 본 변경분 정식 반영 예정 — Phase B)
> 원본 스펙: <https://api.heritage-dx.com/api-docs-json> (Swagger UI: <https://api.heritage-dx.com/api-docs>)
> 총 엔드포인트: **113 operations / 68 unique paths**, DTO **149 개** (캡처 시점 기준 — 2026-04 변경 후 일부 축소·재정의)

이 폴더는 `https://api.heritage-dx.com` 의 REST API 레퍼런스다. 코드 변경 전 **항상 여기서 path / DTO / 인증 요구를 확인**한 뒤 `@heritage-dx/api` Repository / 훅을 작성한다.

## 2026-04 변경 요약 (캡처 갱신 전 임시 메모)

- **공개 거래 mutation 4개 엔드포인트 삭제** — `POST /membership-trades`, `PUT /membership-trades/:id`, `DELETE /membership-trades/:id`, `PATCH /membership-trades/:id/workflow-action`. 거래는 관리자가 상담의 `APPROVE_FIRST` 액션을 수행하면 백엔드가 자동 생성한다.
- **액션 enum 축소/재정의**:
  - `PATCH /api/consultations/:id/approval-action` (공개) → `REQUEST_APPROVAL` 만.
  - `PATCH /api/admin/consultations/:id/approval-action` (관리자) → `APPROVE_FIRST`, `REOPEN`.
  - `PATCH /api/admin/membership-trades/:id/workflow-action` (관리자) → `ADVANCE_TO_TAX_FILING`, `ADVANCE_TO_COMPLETED`, `REJECT`.
- **자동 사이드이펙트**:
  - 거래 생성 시 고객 등급 자동 `ACTIVE_DEAL`.
  - 거래 `REJECT` 또는 삭제 시 거래 레코드 물리 삭제 + 원천 상담 `DRAFT` 복귀 + `approvalRequestedAt/approvalRequestedByUserId` 초기화 + 다른 거래 없으면 고객 등급 `HIGH_INTENT` 자동 하향.
  - 완료 거래(및 그 거래에 연결된 상담)는 수정/삭제 차단.
- **고객 모델 신규 필드 5개**: `ageBracket`, `occupation`, `ownedMembershipSummary`, `customerGrade`(서버 자동 산정·읽기 전용), `residenceArea`.
- **상담 `approvalStatus` 명칭 변경**: 백엔드는 이제 `IN_CONSULTATION | PENDING_DEPOSIT | DEPOSIT_APPROVED` 만 허용한다.
  - `DRAFT` → `IN_CONSULTATION` (상담중, 디폴트)
  - `PENDING_APPROVAL` → `PENDING_DEPOSIT` (계약금 입/송금 대기)
  - `FIRST_APPROVED` → `DEPOSIT_APPROVED` (계약금 승인 완료, 거래내역 이관됨)
  - 구 값들은 클라이언트 호환 위해 enum 에 deprecated 로 남아 있음.

## 파일 구조

**public (`/api/*` 중 `/api/admin/` 을 제외한 경로 + `/auth/*`)**

| 파일 | 도메인 | 엔드포인트 수 |
|---|---|---|
| [`auth.md`](auth.md) | 로그인·토큰·내 정보·비밀번호 | 5 |
| [`clubs.md`](clubs.md) | 골프장 목록/상세/시세 이력 (공개) | 3 |
| [`consultations.md`](consultations.md) | 상담 기록 (인증 사용자) | 6 |
| [`customers.md`](customers.md) | 고객 CRUD·이력 | 7 |
| [`claims.md`](claims.md) | 클레임 접수 | 1 |
| [`membership-listings.md`](membership-listings.md) | 회원권 대표가 목록 (공개) | 2 |
| [`membership-trades.md`](membership-trades.md) | 회원권 거래 기록 (인증) | 6 |
| [`notices.md`](notices.md) | 공지사항 조회 (인증) | 2 |

**admin (`/api/admin/*`)** — [`admin/README.md`](admin/README.md) 참조. 14 파일 / 80 operations.

**헬스체크** — `GET /` (인증 불필요) : `{"hello":"world"}` 같은 문자열 반환. 실배포 확인용.

## 인증

### 로그인 (쿠키 기반)

**실제 구현은 쿠키 인증이다.** 스펙상 `JWT-auth` bearer 가 선언돼 있지만 `Authorization: Bearer <token>` 헤더 호출은 401 로 거부된다. 로그인 응답은 두 개의 HttpOnly 쿠키를 심는다:
- `hdx_access_token` (30분, Max-Age=1800)
- `hdx_refresh_token` (24시간, Max-Age=86400)

```bash
curl -c /tmp/cookies.txt -X POST https://api.heritage-dx.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@example.com","password":"SuperAdmin123!"}'
```

응답 본문은 accessToken **문자열을 포함하지 않는다** (쿠키로만 전달):

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "SUPER_ADMIN", "organizationId": "...", "mustChangePassword": false },
    "accessTokenExpiresAt": "...",
    "refreshTokenExpiresAt": "..."
  },
  "timestamp": "..."
}
```

### 인증 호출

쿠키 jar 만 재사용하면 됨:

```bash
curl -b /tmp/cookies.txt https://api.heritage-dx.com/api/customers
```

### 토큰 갱신

`hdx_access_token` 만료 시 `POST /auth/refresh` 를 호출하면 서버가 새 access 쿠키를 심는다. 브라우저에서는 `credentials: 'include'` 필요.

### 프런트엔드에서 주의

- `@heritage-dx/api` 의 `fetch` 호출은 `credentials: 'include'` 가 필수다 (브라우저가 HttpOnly 쿠키를 자동 동봉하려면).
- CORS 응답에 `access-control-allow-credentials: true` 포함. Origin 기반 허용.

## 공통 응답 포맷 (`ApiResponseDto`)

모든 성공 응답은 다음 envelope 을 따른다:

```json
{ "success": true, "data": <T>, "timestamp": "ISO-8601" }
```

| Field | Type | 설명 |
|---|---|---|
| `success` | `boolean` | 항상 `true` (성공 시) |
| `data` | 제네릭 | 엔드포인트별 payload |
| `timestamp` | `string` | 서버 처리 시각 (ISO-8601) |

## 공통 에러 포맷 (`ErrorResponseDto` / `ErrorDto`)

```json
{ "success": false, "error": { "code": "...", "message": "...", "details": {} }, "timestamp": "..." }
```

| Field | Type | 설명 |
|---|---|---|
| `error.code` | `string` | 에러 코드 (예: `SCENARIO_NOT_FOUND`, `VALIDATION_FAILED`) |
| `error.message` | `string` | 사용자 표시용 메시지 |
| `error.details` | `object` | 디버깅용 추가 정보 (nullable) |

> 실제 일부 에러(예: Nest 기본 400 validation)는 envelope 없이 `{"message": [...], "error": "Bad Request", "statusCode": 400}` 로 내려온다. 호출측 에러 핸들러는 양쪽 모두 방어해야 한다.

## 공통 페이지네이션 (`PaginationMetaDto`)

목록 응답의 `data` 는 대체로 `{ <collection>: [...], pagination: PaginationMetaDto }` 모양이다.

| Field | Type | 설명 |
|---|---|---|
| `page` | `number` | 현재 페이지 (1-indexed) |
| `limit` | `number` | 페이지당 항목 수 (≤ 100) |
| `total` | `number` | 전체 항목 수 |
| `totalPages` | `number` | 총 페이지 수 |

> 일부 엔드포인트는 `data` 를 **바로 배열로** 반환한다 (예: `/api/admin/organizations`, `/api/admin/scenarios`). 각 도메인 파일의 실호출 샘플에서 확인할 것.

## 재생성 방법

```bash
# 1) 스펙 재다운로드
curl -s https://api.heritage-dx.com/api-docs-json -o /tmp/heritage-openapi.json

# 2) superadmin 로그인 (쿠키 jar 보관)
curl -c /tmp/heritage-cookies.txt -X POST https://api.heritage-dx.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@example.com","password":"SuperAdmin123!"}'

# 3) 수집 스크립트 실행 (이 문서 최초 생성 시 사용)
python3 /tmp/collect-samples.py
python3 /tmp/collect-samples-v2.py
python3 /tmp/collect-samples-v3.py

# 4) Markdown 렌더링
python3 /tmp/render-docs.py
```

> build hash 가 바뀌면(현재 `1.0.0+15ac42bd`) 본 문서는 stale. 스펙 파일을 diff 해 재생성 범위를 판단.

## 검증 규칙

- 실호출 샘플은 **GET 만**. POST/PUT/PATCH/DELETE 는 스펙의 `requestBody.schema` + `responses[2xx]` 만 인용 (프로덕션 데이터 보호).
- 샘플 본문의 이메일·전화·주민등록번호는 `***` / `010-****-****` / `******-*******` 로 마스킹.
- 큰 응답은 4KB 에서 잘리며 `... (truncated)` 표기.
