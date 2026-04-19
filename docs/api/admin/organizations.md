# Admin 조직 API

> spec: `v1.0.0+15ac42bd` · captured: `2026-04-17`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/organizations` | 조직 목록 조회 | 🔒 |
| `POST` | `/api/admin/organizations` | 조직 생성 | 🔒 |
| `GET` | `/api/admin/organizations/{id}` | 조직 상세 조회 | 🔒 |
| `PATCH` | `/api/admin/organizations/{id}` | 조직 정보 수정 | 🔒 |
| `DELETE` | `/api/admin/organizations/{id}` | 조직 비활성화 | 🔒 |
| `POST` | `/api/admin/organizations/{id}/logo` | 조직 로고 업로드 | 🔒 |
| `DELETE` | `/api/admin/organizations/{id}/logo` | 조직 로고 삭제 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/organizations`

- **Summary**: 조직 목록 조회
- **OperationId**: `OrganizationsController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

SUPER_ADMIN 전용. 모든 조직 목록 조회

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `page` | number |  | _예: `1`_ |
| `query` | `limit` | number |  | _예: `20`_ |
| `query` | `search` | string |  |  |

#### 응답

- `200` 조직 목록 조회 성공 → [`OrganizationListResponseDto`](#organizationlistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/organizations?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [
    {
      "id": "5fe3826f-68e3-4f6e-9163-a2c0c8cce0c8",
      "name": "DEMO조직",
      "slug": "demo-membership",
      "isActive": true,
      "registrationNumber": null,
      "representativeName": null,
      "businessName": null,
      "address": null,
      "businessType": null,
      "phoneNumber": null,
      "faxNumber": null,
      "depositAccount": null,
      "logoUrl": null,
      "userCount": 4,
      "createdAt": "2026-03-09T13:20:17.145Z",
      "updatedAt": "2026-03-09T13:20:17.145Z"
    },
    {
      "id": "cc665c1e-1e9c-4ef3-b7f0-b8b2de4db978",
      "name": "이름변경예정조직2",
      "slug": "pending-rename-org-2",
      "isActive": true,
      "registrationNumber": null,
      "representativeName": null,
      "businessName": null,
      "address": null,
      "businessType": null,
      "phoneNumber": null,
      "faxNumber": null,
      "depositAccount": null,
      "logoUrl": null,
      "userCount": 0,
      "createdAt": "2026-03-09T13:20:16.092Z",
      "updatedAt": "2026-03-09T13:20:16.092Z"
    },
    {
      "id": "28dd59e9-022d-43a5-ad56-bfc4d58b8a0d",
      "name": "이름변경예정조직1",
      "slug": "pending-rename-org-1",
      "isActive": true,
      "registrationNumber": null,
      "representativeName": null,
      "businessName": null,
      "address": null,
      "businessType": null,
      "phoneNumber": null,
      "faxNumber": null,
      "depositAccount": null,
      "logoUrl": null,
      "userCount": 0,
      "createdAt": "2026-03-09T13:20:15.289Z",
      "updatedAt": "2026-03-09T13:20:15.289Z"
    }
  ],
  "meta": {
    "total": 6,
    "page": 1,
    "limit": 3,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-04-17T11:38:14.647Z"
}
```

### `POST /api/admin/organizations`

- **Summary**: 조직 생성
- **OperationId**: `OrganizationsController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

SUPER_ADMIN 전용. 새로운 조직 생성

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateOrganizationDto`](#createorganizationdto)

#### 응답

- `201` 조직 생성 성공 → [`OrganizationDetailResponseDto`](#organizationdetailresponsedto)
- `409` slug 중복 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/admin/organizations/{id}`

- **Summary**: 조직 상세 조회
- **OperationId**: `OrganizationsController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

SUPER_ADMIN은 모든 조직 조회 가능, ORG_ADMIN은 본인 조직만 조회 가능

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 조직 ID (UUID) |

#### 응답

- `200` 조직 상세 조회 성공 → [`OrganizationDetailResponseDto`](#organizationdetailresponsedto)
- `404` 조직을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/organizations/5fe3826f-68e3-4f6e-9163-a2c0c8cce0c8
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "5fe3826f-68e3-4f6e-9163-a2c0c8cce0c8",
    "name": "DEMO조직",
    "slug": "demo-membership",
    "isActive": true,
    "registrationNumber": null,
    "representativeName": null,
    "businessName": null,
    "address": null,
    "businessType": null,
    "phoneNumber": null,
    "faxNumber": null,
    "depositAccount": null,
    "logoUrl": null,
    "userCount": 4,
    "createdAt": "2026-03-09T13:20:17.145Z",
    "updatedAt": "2026-03-09T13:20:17.145Z"
  },
  "timestamp": "2026-04-17T11:38:22.098Z"
}
```

### `PATCH /api/admin/organizations/{id}`

- **Summary**: 조직 정보 수정
- **OperationId**: `OrganizationsController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

SUPER_ADMIN은 모든 조직 수정 가능, ORG_ADMIN은 본인 조직의 일반 정보만 수정 가능

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 조직 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateOrganizationDto`](#updateorganizationdto)

#### 응답

- `200` 조직 수정 성공 → [`OrganizationDetailResponseDto`](#organizationdetailresponsedto)
- `404` 조직을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/admin/organizations/{id}`

- **Summary**: 조직 비활성화
- **OperationId**: `OrganizationsController_deactivate`
- **인증**: 필요 (쿠키 `hdx_access_token`)

SUPER_ADMIN 전용. 조직 비활성화 (소속 모든 사용자도 함께 비활성화됨)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 조직 ID (UUID) |

#### 응답

- `200` 조직 비활성화 성공 → [`OrganizationMessageResponseDto`](#organizationmessageresponsedto)
- `400` 기본 조직은 비활성화 불가 → [`ErrorResponseDto`](#errorresponsedto)
- `404` 조직을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `POST /api/admin/organizations/{id}/logo`

- **Summary**: 조직 로고 업로드
- **OperationId**: `OrganizationsController_uploadLogo`
- **인증**: 필요 (쿠키 `hdx_access_token`)

SUPER_ADMIN은 모든 조직 업로드 가능, ORG_ADMIN은 본인 조직 로고만 업로드 가능 (기존 로고는 교체됨)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 조직 ID (UUID) |

#### Request Body

- Content-Type: `multipart/form-data`
- Schema: object

#### 응답

- `200` 로고 업로드 성공 → [`OrganizationDetailResponseDto`](#organizationdetailresponsedto)
- `201`  → [`OrganizationDetailResponseDto`](#organizationdetailresponsedto)
- `400` 잘못된 파일 형식 → [`ErrorResponseDto`](#errorresponsedto)
- `404` 조직을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/admin/organizations/{id}/logo`

- **Summary**: 조직 로고 삭제
- **OperationId**: `OrganizationsController_deleteLogo`
- **인증**: 필요 (쿠키 `hdx_access_token`)

SUPER_ADMIN은 모든 조직 삭제 가능, ORG_ADMIN은 본인 조직 로고만 삭제 가능

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 조직 ID (UUID) |

#### 응답

- `200` 로고 삭제 성공 → [`OrganizationDetailResponseDto`](#organizationdetailresponsedto)
- `404` 조직을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### CreateOrganizationDto

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✓ | 조직명 _예: `테스트 조직`_ |
| `slug` | string | ✓ | URL 식별자 (영문 소문자, 숫자, 하이픈만 허용) _예: `test-org`_ |
| `registrationNumber` | string |  | 사업자등록번호 _예: `123-45-67890`_ |
| `representativeName` | string |  | 대표이사 _예: `홍길동`_ |
| `businessName` | string |  | 상호 (사업체명) _예: `(주)헤리티지DX`_ |
| `address` | string |  | 주소 _예: `서울시 강남구 테헤란로 123`_ |
| `businessType` | string |  | 업종/종목 _예: `소프트웨어 개발업`_ |
| `phoneNumber` | string |  | 전화번호 _예: `02-1234-5678`_ |
| `faxNumber` | string |  | FAX 번호 _예: `02-1234-5679`_ |
| `depositAccount` | string |  | 입금 계좌 정보 _예: `국민은행 123-456-789 홍길동`_ |

### OrganizationDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 |
| `data` | object | ✓ | 조직 정보 |
| `timestamp` | string | ✓ | 응답 시간 |

### OrganizationDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 조직 ID |
| `name` | string | ✓ | 조직명 |
| `slug` | string | ✓ | URL 식별자 |
| `isActive` | boolean | ✓ | 활성화 여부 |
| `registrationNumber` | string |  | 사업자등록번호 |
| `representativeName` | string |  | 대표이사 |
| `businessName` | string |  | 상호 (사업체명) |
| `address` | string |  | 주소 |
| `businessType` | string |  | 업종/종목 |
| `phoneNumber` | string |  | 전화번호 |
| `faxNumber` | string |  | FAX 번호 |
| `depositAccount` | string |  | 입금 계좌 정보 |
| `logoUrl` | string |  | 로고 이미지 URL (서명된 URL) |
| `userCount` | number |  | 소속 사용자 수 |
| `createdAt` | string | ✓ | 생성일시 |
| `updatedAt` | string | ✓ | 수정일시 |

### OrganizationListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 |
| `data` | Array&lt;[`OrganizationDto`](#organizationdto)&gt; | ✓ | 조직 목록 |
| `meta` | object | ✓ |  |
| `timestamp` | string | ✓ | 응답 시간 |

### OrganizationMessageResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 |
| `message` | string | ✓ | 메시지 |
| `timestamp` | string | ✓ | 응답 시간 |

### UpdateOrganizationDto

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string |  | 조직명 _예: `테스트 조직`_ |
| `slug` | string |  | URL 식별자 (영문 소문자, 숫자, 하이픈만 허용) _예: `test-org`_ |
| `isActive` | boolean |  | 활성화 여부 _예: `True`_ |
| `registrationNumber` | string |  | 사업자등록번호 _예: `123-45-67890`_ |
| `representativeName` | string |  | 대표이사 _예: `홍길동`_ |
| `businessName` | string |  | 상호 (사업체명) _예: `(주)헤리티지DX`_ |
| `address` | string |  | 주소 _예: `서울시 강남구 테헤란로 123`_ |
| `businessType` | string |  | 업종/종목 _예: `소프트웨어 개발업`_ |
| `phoneNumber` | string |  | 전화번호 _예: `02-1234-5678`_ |
| `faxNumber` | string |  | FAX 번호 _예: `02-1234-5679`_ |
| `depositAccount` | string |  | 입금 계좌 정보 _예: `국민은행 123-456-789 홍길동`_ |
