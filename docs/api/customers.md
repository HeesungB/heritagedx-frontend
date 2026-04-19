# 고객 관리 API

> spec: `v1.0.0+15ac42bd` · captured: `2026-04-17`
> base URL: `https://api.heritage-dx.com`

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/customers` | 고객 목록 조회 | 🔒 |
| `POST` | `/api/customers` | 고객 등록 | 🔒 |
| `GET` | `/api/customers/{id}` | 고객 상세 조회 | 🔒 |
| `PUT` | `/api/customers/{id}` | 고객 수정 | 🔒 |
| `DELETE` | `/api/customers/{id}` | 고객 삭제 | 🔒 |
| `GET` | `/api/customers/{id}/history` | 고객 이력 상세 조회 | 🔒 |
| `GET` | `/api/customers/{id}/history/summary` | 고객 이력 간소화 조회 | 🔒 |

## 엔드포인트 상세

### `GET /api/customers`

- **Summary**: 고객 목록 조회
- **OperationId**: `CustomersController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

고객 목록을 페이지네이션, 검색, 필터링과 함께 조회합니다. SUPER_ADMIN이 아니면 현재 사용자의 조직 고객만 조회합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `organizationId` | string (uuid) |  | 조직 ID 필터 (SUPER_ADMIN 전용) _예: `a0000000-0000-4000-a000-000000000001`_ |
| `query` | `page` | number |  | 페이지 번호 _예: `1`_ |
| `query` | `limit` | number |  | 페이지당 항목 수 _예: `20`_ |
| `query` | `search` | string |  | 검색어 (고객명, 연락처, 메모) _예: `홍길동`_ |
| `query` | `sort` | `name` \| `contact` \| `createdAt` \| `updatedAt` |  | 정렬 기준 _예: `createdAt`_ |
| `query` | `order` | `ASC` \| `DESC` |  | 정렬 방향 _예: `DESC`_ |

#### 응답

- `200` 고객 목록 조회 성공 → [`CustomerListResponseDto`](#customerlistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/customers?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "985041f4-2e5e-4984-9e6e-a848b56a9c87",
        "organizationId": "a0000000-0000-4000-a000-000000000001",
        "createdByUserId": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
        "createdByName": "Super Admin",
        "name": "test",
        "contact": "010-****-****",
        "memo": null,
        "createdAt": "2026-04-14T12:18:52.591Z",
        "updatedAt": "2026-04-14T12:18:52.591Z"
      },
      {
        "id": "2e4988d9-fe88-4862-884e-722c330a3a88",
        "organizationId": "a0000000-0000-4000-a000-000000000001",
        "createdByUserId": "462f5763-498f-4d74-b716-d1b41798d3a4",
        "createdByName": "Prod Workflow Editor",
        "name": "prod-invalid-035212",
        "contact": "010-****-****",
        "memo": null,
        "createdAt": "2026-04-14T01:42:23.122Z",
        "updatedAt": "2026-04-14T01:42:23.122Z"
      },
      {
        "id": "2fb6a960-325d-47cf-bc79-78a6b76e56d8",
        "organizationId": "a0000000-0000-4000-a000-000000000001",
        "createdByUserId": "462f5763-498f-4d74-b716-d1b41798d3a4",
        "createdByName": "Prod Workflow Editor",
        "name": "pa-reject_reopen-045835",
        "contact": "010-****-****",
        "memo": null,
        "createdAt": "2026-04-14T01:42:23.122Z",
        "updatedAt": "2026-04-14T01:42:23.122Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 12,
      "totalItems": 34,
      "itemsPerPage": 3
    }
  },
  "timestamp": "2026-04-17T11:38:13.258Z"
}
```

### `POST /api/customers`

- **Summary**: 고객 등록
- **OperationId**: `CustomersController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

새 고객을 등록합니다. 고객은 현재 사용자의 조직에 생성되며, 같은 조직 안에서는 정규화된 연락처가 중복될 수 없습니다.

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateCustomerDto`](#createcustomerdto)

#### 응답

- `201` 고객 등록 성공 → [`CustomerDetailResponseDto`](#customerdetailresponsedto)
- `400` 잘못된 요청 → [`ErrorResponseDto`](#errorresponsedto)
- `409` 연락처 중복 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/customers/{id}`

- **Summary**: 고객 상세 조회
- **OperationId**: `CustomersController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 고객 ID (UUID) |

#### 응답

- `200` 고객 상세 조회 성공 → [`CustomerDetailResponseDto`](#customerdetailresponsedto)
- `404` 고객을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/customers/985041f4-2e5e-4984-9e6e-a848b56a9c87
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "985041f4-2e5e-4984-9e6e-a848b56a9c87",
    "organizationId": "a0000000-0000-4000-a000-000000000001",
    "createdByUserId": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
    "createdByName": "Super Admin",
    "name": "test",
    "contact": "010-****-****",
    "memo": null,
    "createdAt": "2026-04-14T12:18:52.591Z",
    "updatedAt": "2026-04-14T12:18:52.591Z"
  },
  "timestamp": "2026-04-17T11:38:20.255Z"
}
```

### `PUT /api/customers/{id}`

- **Summary**: 고객 수정
- **OperationId**: `CustomersController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 고객 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateCustomerDto`](#updatecustomerdto)

#### 응답

- `200` 고객 수정 성공 → [`CustomerDetailResponseDto`](#customerdetailresponsedto)
- `404` 고객을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)
- `409` 연락처 중복 → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/customers/{id}`

- **Summary**: 고객 삭제
- **OperationId**: `CustomersController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 고객 ID (UUID) |

#### 응답

- `200` 고객 삭제 성공 → [`CustomerDeleteResponseDto`](#customerdeleteresponsedto)
- `404` 고객을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/customers/{id}/history`

- **Summary**: 고객 이력 상세 조회
- **OperationId**: `CustomersController_findHistory`
- **인증**: 필요 (쿠키 `hdx_access_token`)

고객의 상담/거래 이력을 한 응답 안에서 각각 독립 페이지네이션으로 조회합니다. 추가 필터 없이 기존 목록 API의 정렬 옵션만 지원합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 고객 ID (UUID) |
| `query` | `consultationPage` | number |  | 상담 이력 페이지 번호 _예: `1`_ |
| `query` | `consultationLimit` | number |  | 상담 이력 페이지당 항목 수 _예: `20`_ |
| `query` | `consultationSort` | `registrationDate` \| `createdAt` \| `clubName` \| `membershipName` \| `offerPrice` \| `desiredPrice` |  | 상담 이력 정렬 기준 |
| `query` | `consultationOrder` | `ASC` \| `DESC` |  | 상담 이력 정렬 방향 |
| `query` | `tradePage` | number |  | 거래 이력 페이지 번호 _예: `1`_ |
| `query` | `tradeLimit` | number |  | 거래 이력 페이지당 항목 수 _예: `20`_ |
| `query` | `tradeSort` | `contractDate` \| `createdAt` \| `clubName` \| `membershipName` \| `amount` \| `tradeAmount` |  | 거래 이력 정렬 기준 |
| `query` | `tradeOrder` | `ASC` \| `DESC` |  | 거래 이력 정렬 방향 |

#### 응답

- `200` 고객 이력 상세 조회 성공 → [`CustomerHistoryResponseDto`](#customerhistoryresponsedto)
- `404` 고객을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/customers/985041f4-2e5e-4984-9e6e-a848b56a9c87/history
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "985041f4-2e5e-4984-9e6e-a848b56a9c87",
      "organizationId": "a0000000-0000-4000-a000-000000000001",
      "createdByUserId": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
      "createdByName": "Super Admin",
      "name": "test",
      "contact": "010-****-****",
      "memo": null,
      "createdAt": "2026-04-14T12:18:52.591Z",
      "updatedAt": "2026-04-14T12:18:52.591Z"
    },
    "summary": {
      "consultationCount": 0,
      "membershipTradeCount": 0
    },
    "consultations": {
      "items": [],
      "pagination": {
        "currentPage": 1,
        "totalPages": 0,
        "totalItems": 0,
        "itemsPerPage": 20
      }
    },
    "membershipTrades": {
      "items": [],
      "pagination": {
        "currentPage": 1,
        "totalPages": 0,
        "totalItems": 0,
        "itemsPerPage": 20
      }
    }
  },
  "timestamp": "2026-04-17T11:38:20.067Z"
}
```

### `GET /api/customers/{id}/history/summary`

- **Summary**: 고객 이력 간소화 조회
- **OperationId**: `CustomersController_findHistorySummary`
- **인증**: 필요 (쿠키 `hdx_access_token`)

고객의 상담/거래 이력 수와 최근 이력을 분리해서 조회합니다. 상담/거래 조회 권한은 기존 목록 API와 동일하게 적용됩니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 고객 ID (UUID) |
| `query` | `consultationLimit` | number |  | 최근 상담 이력 개수 _예: `5`_ |
| `query` | `consultationSort` | `registrationDate` \| `createdAt` \| `clubName` \| `membershipName` \| `offerPrice` \| `desiredPrice` |  | 상담 이력 정렬 기준 |
| `query` | `consultationOrder` | `ASC` \| `DESC` |  | 상담 이력 정렬 방향 |
| `query` | `tradeLimit` | number |  | 최근 거래 이력 개수 _예: `5`_ |
| `query` | `tradeSort` | `contractDate` \| `createdAt` \| `clubName` \| `membershipName` \| `amount` \| `tradeAmount` |  | 거래 이력 정렬 기준 |
| `query` | `tradeOrder` | `ASC` \| `DESC` |  | 거래 이력 정렬 방향 |

#### 응답

- `200` 고객 이력 간소화 조회 성공 → [`CustomerHistorySummaryResponseDto`](#customerhistorysummaryresponsedto)
- `404` 고객을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/customers/985041f4-2e5e-4984-9e6e-a848b56a9c87/history/summary
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "customerId": "985041f4-2e5e-4984-9e6e-a848b56a9c87",
    "summary": {
      "consultationCount": 0,
      "membershipTradeCount": 0
    },
    "recentConsultations": [],
    "recentMembershipTrades": []
  },
  "timestamp": "2026-04-17T11:38:19.877Z"
}
```

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### ConsultationPaginationMetaDto

| Field | Type | Required | Description |
|---|---|---|---|
| `currentPage` | number | ✓ | 현재 페이지 _예: `1`_ |
| `totalPages` | number | ✓ | 전체 페이지 수 _예: `5`_ |
| `totalItems` | number | ✓ | 전체 항목 수 _예: `100`_ |
| `itemsPerPage` | number | ✓ | 페이지당 항목 수 _예: `20`_ |

### ConsultationResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID (UUID) |
| `customerId` | string |  | 고객 UUID |
| `clubId` | string |  | 골프장 UUID (ID 모드일 때) |
| `clubName` | string | ✓ | 골프장명 _예: `강남골프클럽`_ |
| `membershipId` | string |  | 회원권 UUID (ID 모드일 때) |
| `membershipName` | string | ✓ | 회원권명 _예: `개인정회원`_ |
| `tradeType` | `매도` \| `매수` | ✓ | 거래 유형 |
| `customerName` | string | ✓ | 고객명 |
| `contact` | string | ✓ | 연락처 |
| `offerPrice` | number |  | 제시가 (원 단위) |
| `offerPriceNote` | string |  | 제시가 메모 |
| `desiredPrice` | number |  | 희망가 (원 단위) |
| `desiredPriceNote` | string |  | 희망가 메모 |
| `depositAmount` | number |  | 계약금 (원 단위) |
| `customFields` | object | ✓ | 상담별 자유형 커스텀 필드 _예: `{'희망지역': '제주', 'VIP': True}`_ |
| `notes` | string |  | 특기사항 |
| `registrationDate` | string (date-time) |  | 등록일자 |
| `tradeDate` | string (date-time) |  | 거래일 |
| `remarks` | string |  | 비고 |
| `isDone` | boolean | ✓ | 거래 완료 여부 |
| `isShared` | boolean | ✓ | 공유 여부 _예: `False`_ |
| `approvalStatus` | `DRAFT` \| `PENDING_APPROVAL` \| `FIRST_APPROVED` \| `ON_HOLD` \| `REJECTED` | ✓ | 상담 승인 상태 |
| `approvalRequestedAt` | string (date-time) |  | 승인 요청 일시 |
| `firstApprovedAt` | string (date-time) |  | 1차 승인 일시 |
| `holdReason` | string |  | 보류 사유 |
| `rejectionReason` | string |  | 반려 사유 |
| `linkedTradeId` | string |  | 연결된 거래 UUID |
| `createdByName` | string | ✓ | 작성자 이름 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### CreateCustomerDto

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✓ | 고객명 _예: `홍길동`_ |
| `contact` | string | ✓ | 연락처 _예: `010-1234-5678`_ |
| `memo` | string |  | 고객 메모 _예: `오전 통화 선호`_ |

### CustomerDeleteResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `message` | string | ✓ | 삭제 결과 메시지 _예: `고객이 삭제되었습니다.`_ |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### CustomerDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### CustomerHistoryConsultationPageDto

| Field | Type | Required | Description |
|---|---|---|---|
| `items` | Array&lt;[`ConsultationResponseDto`](#consultationresponsedto)&gt; | ✓ | 상담 이력 목록 |
| `pagination` | object | ✓ | 상담 이력 페이지네이션 정보 |

### CustomerHistoryDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `customer` | object | ✓ | 고객 정보 |
| `summary` | object | ✓ | 이력 요약 |
| `consultations` | object | ✓ | 상담 이력 |
| `membershipTrades` | object | ✓ | 거래 이력 |

### CustomerHistoryMembershipTradePageDto

| Field | Type | Required | Description |
|---|---|---|---|
| `items` | Array&lt;[`MembershipTradeResponseDto`](#membershiptraderesponsedto)&gt; | ✓ | 거래 이력 목록 |
| `pagination` | object | ✓ | 거래 이력 페이지네이션 정보 |

### CustomerHistoryRecentConsultationDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 상담 UUID |
| `registrationDate` | string (date-time) |  | 상담 등록일자 |
| `clubName` | string | ✓ | 골프장명 |
| `membershipName` | string | ✓ | 회원권명 |
| `tradeType` | `매도` \| `매수` | ✓ | 거래 유형 |
| `approvalStatus` | `DRAFT` \| `PENDING_APPROVAL` \| `FIRST_APPROVED` \| `ON_HOLD` \| `REJECTED` | ✓ | 상담 승인 상태 |
| `isDone` | boolean | ✓ | 상담 완료 여부 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |

### CustomerHistoryRecentMembershipTradeDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 거래 UUID |
| `contractDate` | string (date-time) |  | 계약일 |
| `clubName` | string | ✓ | 골프장명 |
| `membershipName` | string | ✓ | 회원권명 |
| `tradeType` | `매도` \| `매수` | ✓ | 거래 유형 |
| `workflowStatus` | `DRAFT` \| `PENDING_APPROVAL` \| `FIRST_APPROVED` \| `ON_HOLD` \| `REJECTED` | ✓ | 거래 승인 상태 |
| `amount` | number |  | 금액 (원 단위) |
| `createdAt` | string (date-time) | ✓ | 생성일시 |

### CustomerHistoryResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### CustomerHistorySummaryDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `customerId` | string | ✓ | 고객 UUID |
| `summary` | object | ✓ | 이력 요약 |
| `recentConsultations` | Array&lt;[`CustomerHistoryRecentConsultationDto`](#customerhistoryrecentconsultationdto)&gt; | ✓ | 최근 상담 이력 |
| `recentMembershipTrades` | Array&lt;[`CustomerHistoryRecentMembershipTradeDto`](#customerhistoryrecentmembershiptradedto)&gt; | ✓ | 최근 거래 이력 |

### CustomerHistorySummaryDto

| Field | Type | Required | Description |
|---|---|---|---|
| `consultationCount` | number | ✓ | 조회 권한이 적용된 상담 이력 수 _예: `12`_ |
| `membershipTradeCount` | number | ✓ | 조회 권한이 적용된 거래 이력 수 _예: `3`_ |

### CustomerHistorySummaryResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### CustomerListDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `customers` | Array&lt;[`CustomerResponseDto`](#customerresponsedto)&gt; | ✓ | 고객 목록 |
| `pagination` | object | ✓ | 페이지네이션 정보 |

### CustomerListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### CustomerPaginationMetaDto

| Field | Type | Required | Description |
|---|---|---|---|
| `currentPage` | number | ✓ | 현재 페이지 _예: `1`_ |
| `totalPages` | number | ✓ | 전체 페이지 수 _예: `5`_ |
| `totalItems` | number | ✓ | 전체 항목 수 _예: `100`_ |
| `itemsPerPage` | number | ✓ | 페이지당 항목 수 _예: `20`_ |

### CustomerResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 고객 UUID |
| `organizationId` | string | ✓ | 조직 UUID |
| `createdByUserId` | string | ✓ | 작성자 UUID |
| `createdByName` | string | ✓ | 작성자 이름 |
| `name` | string | ✓ | 고객명 |
| `contact` | string | ✓ | 연락처 |
| `memo` | string |  | 고객 메모 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### MembershipTradePaginationMetaDto

| Field | Type | Required | Description |
|---|---|---|---|
| `currentPage` | number | ✓ | 현재 페이지 _예: `1`_ |
| `totalPages` | number | ✓ | 전체 페이지 수 _예: `5`_ |
| `totalItems` | number | ✓ | 전체 항목 수 _예: `100`_ |
| `itemsPerPage` | number | ✓ | 페이지당 항목 수 _예: `20`_ |

### MembershipTradeResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID (UUID) |
| `customerId` | string |  | 고객 UUID |
| `sourceConsultationId` | string |  | 원천 상담 UUID |
| `customerName` | string | ✓ | 고객명 |
| `contact` | string |  | 연락처 |
| `tradeType` | `매도` \| `매수` | ✓ | 거래 유형 (매도/매수) |
| `clubId` | string | ✓ | 골프장 UUID |
| `clubName` | string | ✓ | 골프장명 |
| `membershipId` | string | ✓ | 회원권 UUID |
| `membershipName` | string | ✓ | 회원권명 |
| `contractDate` | string (date-time) |  | 계약일 |
| `workflowStatus` | `DRAFT` \| `PENDING_APPROVAL` \| `FIRST_APPROVED` \| `ON_HOLD` \| `REJECTED` | ✓ | 거래 승인 상태 |
| `amount` | number |  | 금액 (원 단위) |
| `depositAmount` | number |  | 계약금 (원 단위) |
| `tradingPartner` | string |  | 거래처 |
| `tradeAmount` | number |  | 거래금액 (원 단위) |
| `commission` | number |  | 수수료 (원 단위) |
| `marketProfit` | number |  | 시세차익 (원 단위) |
| `total` | number |  | 합계 (수수료 + 시세차익, 자동 계산) |
| `expense` | number |  | 지출 (원 단위) |
| `description` | string |  | 내용 |
| `netProfit` | number |  | 순이익 (합계 - 지출, 자동 계산) |
| `balanceDate` | string (date-time) |  | 잔금 진행 일자 |
| `balanceCompleted` | boolean | ✓ | 잔금 진행 완료 여부 |
| `manager` | string |  | 담당자 |
| `taxTransfer` | boolean | ✓ | 세무 양도 여부 |
| `taxAcquisition` | boolean | ✓ | 세무 취득 여부 |
| `invoiceSales` | number |  | 계산서 매출 (원 단위) |
| `invoicePurchase` | number |  | 계산서 매입 (원 단위) |
| `remarks` | string |  | 비고 |
| `actualTransactionDate` | string |  | 실거래 자료 (날짜 텍스트) |
| `submittedForFinalReviewAt` | string (date-time) |  | 승인 요청 일시 |
| `finalApprovedAt` | string (date-time) |  | 승인 완료 일시 |
| `finalRejectedAt` | string (date-time) |  | 반려 일시 |
| `finalRejectionReason` | string |  | 반려 사유 |
| `createdByName` | string | ✓ | 작성자 이름 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### UpdateCustomerDto

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string |  | 고객명 _예: `홍길동`_ |
| `contact` | string |  | 연락처 _예: `010-1234-5678`_ |
| `memo` | string |  | 고객 메모 _예: `오전 통화 선호`_ |
