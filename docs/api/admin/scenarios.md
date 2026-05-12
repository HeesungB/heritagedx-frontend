# Admin 글로벌 시나리오 카탈로그 API

> spec: `v1.0.0+57563d32` · captured: `2026-05-12`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

> per-club 시나리오 (골프장별 시나리오 매핑) 는 `clubs.md` 의 `GET /api/admin/clubs/{clubId}/scenarios` 를 사용한다.
> 이 문서는 글로벌 시나리오 카탈로그 (read-only) 만 다룬다. 생성/수정/비활성/삭제 admin 엔드포인트는 스웨거에 노출되어 있지 않다.

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/scenarios` | 시나리오 목록 조회 | 🔒 |
| `GET` | `/api/admin/scenarios/{id}` | 시나리오 상세 조회 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/scenarios`

- **Summary**: 시나리오 목록 조회
- **OperationId**: `AdminScenariosController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `page` | number |  | 페이지 번호 (기본 1) |
| `query` | `limit` | number |  | 페이지당 항목 수 (기본 20, 최대 100) |
| `query` | `search` | string |  | 시나리오 이름/코드 부분 검색 |
| `query` | `side` | `Buyer` \| `Seller` |  | 매수/매도 측 필터 |
| `query` | `ownerType` | `Personal` \| `Corporate` \| `Family` \| `Special` \| `All` |  | 보유 주체 유형 필터 |
| `query` | `isActive` | boolean |  | 활성 여부 필터 |

#### 응답

- `200` 목록 조회 성공 → [`AdminScenarioListResponseDto`](#adminscenariolistresponsedto)

### `GET /api/admin/scenarios/{id}`

- **Summary**: 시나리오 상세 조회
- **OperationId**: `AdminScenariosController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string (uuid) | ✓ |  |

#### 응답

- `200` 상세 조회 성공 → [`AdminScenarioDetailResponseDto`](#adminscenariodetailresponsedto)

---

## DTO

### AdminScenarioDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string (uuid) | ✓ |  |
| `scenarioCode` | string | ✓ | 시나리오 코드 (도메인 키) |
| `name` | string | ✓ | 시나리오 이름 |
| `description` | string |  | 설명 |
| `side` | `Buyer` \| `Seller` | ✓ | 매수/매도 측 |
| `ownerType` | `Personal` \| `Corporate` \| `Family` \| `Special` \| `All` | ✓ | 보유 주체 유형 |
| `hasProxy` | boolean | ✓ | 대리인 여부 |
| `isCertificateLost` | boolean | ✓ | 명의증서 분실 여부 |
| `transferStructure` | `Withdraw` \| `Abandon` |  | 양도 구조 |
| `isFamily` | boolean | ✓ | 가족 거래 여부 |
| `requiresTaxInvoice` | boolean | ✓ | 세금계산서 발급 필요 여부 |
| `displayOrder` | number | ✓ | 노출 순서 |
| `isActive` | boolean | ✓ | 활성 여부 |
| `createdAt` | string (date-time) | ✓ |  |
| `updatedAt` | string (date-time) | ✓ |  |

### AdminScenarioListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ |  |
| `data` | Array&lt;[`AdminScenarioDto`](#adminscenariodto)&gt; | ✓ | 시나리오 배열 (data 가 객체가 아닌 배열) |
| `meta` | [`PaginationMetaDto`](../README.md) | ✓ | 페이지네이션 정보 |
| `timestamp` | string (date-time) | ✓ |  |

### AdminScenarioDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ |  |
| `data` | [`AdminScenarioDto`](#adminscenariodto) | ✓ |  |
| `timestamp` | string (date-time) | ✓ |  |
