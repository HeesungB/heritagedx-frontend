# Admin 회원권 거래 API

> spec: `v1.0.0+d8345ee2` · captured: `2026-04-22`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

> ↔ 공개 대응: [../membership-trades.md](../membership-trades.md)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/membership-trades` | [Admin] 회원권 거래 목록 조회 | 🔒 |
| `POST` | `/api/admin/membership-trades` | [Admin] 회원권 거래 등록 | 🔒 |
| `GET` | `/api/admin/membership-trades/{id}` | [Admin] 회원권 거래 상세 조회 | 🔒 |
| `PUT` | `/api/admin/membership-trades/{id}` | [Admin] 회원권 거래 수정 | 🔒 |
| `DELETE` | `/api/admin/membership-trades/{id}` | [Admin] 회원권 거래 삭제 | 🔒 |
| `PATCH` | `/api/admin/membership-trades/{id}/workflow-action` | [Admin] 거래 승인 액션 처리 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/membership-trades`

- **Summary**: [Admin] 회원권 거래 목록 조회
- **OperationId**: `AdminMembershipTradesController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

ORG_ADMIN은 소속 조직 + 익명 글로벌 데이터를 조회하고, SUPER_ADMIN은 organizationId 필터로 조직별 조회가 가능합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `organizationId` | string (uuid) |  | 조직 ID 필터 (관리자 경로에서 주로 사용) _예: `a0000000-0000-4000-a000-000000000001`_ |
| `query` | `page` | number |  | 페이지 번호 _예: `1`_ |
| `query` | `limit` | number |  | 페이지당 항목 수 _예: `20`_ |
| `query` | `search` | string |  | 검색어 (골프장명, 회원권명, 고객명, 연락처, 거래처) _예: `홍길동`_ |
| `query` | `tradeType` | `매도` \| `매수` |  | 거래 유형 필터 _예: `매수`_ |
| `query` | `customerId` | string (uuid) |  | 고객 UUID 필터 _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `query` | `sourceConsultationId` | string (uuid) |  | 원천 상담 UUID 필터 _예: `550e8400-e29b-41d4-a716-446655440001`_ |
| `query` | `workflowStatus` | `DRAFT` \| `PENDING_APPROVAL` \| `FIRST_APPROVED` \| `ON_HOLD` \| `REJECTED` |  | 거래 승인 상태 필터 _예: `PENDING_APPROVAL`_ |
| `query` | `sort` | `contractDate` \| `createdAt` \| `clubName` \| `membershipName` \| `amount` \| `tradeAmount` |  | 정렬 기준 _예: `contractDate`_ |
| `query` | `order` | `ASC` \| `DESC` |  | 정렬 방향 _예: `DESC`_ |

#### 응답

- `200` 목록 조회 성공 → [`MembershipTradeListResponseDto`](#membershiptradelistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/membership-trades?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": "6281908c-6c56-49cb-96c3-228580b749a2",
        "customerId": "d67d9d81-6dd1-4f2b-add9-207bf1d584c9",
        "sourceConsultationId": "e0d3555d-b476-4ebd-88a3-424492d913dc",
        "customerName": "prod-분기상담-hold_direct_approve-20260412034828",
        "contact": "010-****-****",
        "tradeType": "매수",
        "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
        "clubName": "가야",
        "membershipId": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
        "membershipName": "주중-법인",
        "contractDate": null,
        "workflowStatus": "DRAFT",
        "amount": 128000000,
        "depositAmount": 10000000,
        "tradingPartner": null,
        "tradeAmount": null,
        "commission": null,
        "marketProfit": null,
        "total": null,
        "expense": null,
        "description": "production branch consultation test",
        "netProfit": null,
        "balanceDate": null,
        "balanceCompleted": false,
        "manager": null,
        "taxTransfer": false,
        "taxAcquisition": false,
        "invoiceSales": null,
        "invoicePurchase": null,
        "remarks": "prod branch consultation test\n상담 희망가: 126000000",
        "actualTransactionDate": null,
        "submittedForFinalReviewAt": null,
        "finalApprovedAt": null,
        "finalRejectedAt": null,
        "finalRejectionReason": null,
        "createdByName": "Prod Workflow Editor",
        "createdAt": "2026-04-11T18:48:34.041Z",
        "updatedAt": "2026-04-11T18:48:34.041Z"
      },
      {
        "id": "d2082e8d-d96e-488c-b314-7df7a4b81a4c",
        "customerId": "dbcd3836-bd1c-4e02-93c9-4f304db71720",
        "sourceConsultationId": "ffcef5a7-7f4f-488d-92f9-78292cc6e5aa",
        "customerName": "prod-분기상담-hold_reapprove-20260412034828",
        "contact": "010-****-****",
        "tradeType": "매수",
        "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
        "clubName": "가야",
        "membershipId": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
        "membershipName": "주중-법인",
        "contractDate": null,
        "workflowStatus": "DRAFT",
        "amount": 128000000,
        "depositAmount": 10000000,
        "tradingPartner": null,
        "tradeAmount": null,
        "commission": null,
        "marketProfit": null,
        "total": null,
        "expense": null,
        "description": "production branch consultation test",
        "netProfit": null,
        "balanceDate": null,
        "balanceCompleted": false,
        "manager": null,
        "taxTransfer": false,
        "taxAcquisition": false,
        "invoiceSales": null,
        "invoicePurchase": null,
        "remarks": "prod branch consultation test\n상담 희망가: 126000000",
        "actualTransactionDate": null,
        "submittedForFinalReviewAt": null,
        "finalApprovedAt": null,
        "finalRejectedAt": null,
        "finalRejectionReason": null,
        "createdByName": "Prod Workflow Editor",
        "createdAt": "2026-04-11T18:48:30.571Z",
        "updatedAt": "2026-04-11T18:48:30.571Z"
      },
      {
        "id": "669987c9-e544-489a-a5df-6fbbcb930566",
        "customerId": "e18eb964-be92-49cc-86bb-ba75b06171f6",
        "sourceConsultationId": "4a720352-762f-414f-95b6-b206d9788360",
        "customerName": "prod-분기상담-invalid_draft_approve-20260412034828",
        "contact": "010-****-****",
        "tradeType": "매수",
        "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
        "clubName": "가야",
        "membershipId": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
        "membershipName": "주중-법인",
        "contractDate": null,
        "workflowStatus": "DRAFT",
        "amount": 128000000,
        "depositAmount": 10000000,
        "tradingPartner": null,
        "tradeAmount": null,
        "commission": null,
        "marketProfit": null,
        "total": null,
        "expense": null,
        "description": "production branch consultation test",
        "netProfit": null,
   
... (truncated)
```

### `POST /api/admin/membership-trades`

- **Summary**: [Admin] 회원권 거래 등록
- **OperationId**: `AdminMembershipTradesController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateMembershipTradeDto`](#createmembershiptradedto)

#### 응답

- `201` 등록 성공 → [`MembershipTradeDetailResponseDto`](#membershiptradedetailresponsedto)
- `404` 리소스를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/admin/membership-trades/{id}`

- **Summary**: [Admin] 회원권 거래 상세 조회
- **OperationId**: `AdminMembershipTradesController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ |  |

#### 응답

- `200` 상세 조회 성공 → [`MembershipTradeDetailResponseDto`](#membershiptradedetailresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/membership-trades/ff258bb6-d86b-4928-b767-8a5dd78b8242
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "ff258bb6-d86b-4928-b767-8a5dd78b8242",
    "customerId": "d61f14fa-0914-476f-87a0-b5fb23efcd1e",
    "sourceConsultationId": "1b493025-f943-4428-8efa-de00f4609722",
    "customerName": "pa-hold_reapprove-045835",
    "contact": "010-****-****",
    "tradeType": "매수",
    "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
    "clubName": "가야",
    "membershipId": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
    "membershipName": "주중-법인",
    "contractDate": null,
    "workflowStatus": "DRAFT",
    "amount": 128000000,
    "depositAmount": 10000000,
    "tradingPartner": null,
    "tradeAmount": null,
    "commission": null,
    "marketProfit": null,
    "total": null,
    "expense": null,
    "description": "prod action consultation test",
    "netProfit": null,
    "balanceDate": null,
    "balanceCompleted": false,
    "manager": null,
    "taxTransfer": false,
    "taxAcquisition": false,
    "invoiceSales": null,
    "invoicePurchase": null,
    "remarks": "prod action consultation test\n상담 희망가: 126000000",
    "actualTransactionDate": null,
    "submittedForFinalReviewAt": null,
    "finalApprovedAt": null,
    "finalRejectedAt": null,
    "finalRejectionReason": null,
    "createdByName": "Prod Workflow Editor",
    "createdAt": "2026-04-11T19:58:36.900Z",
    "updatedAt": "2026-04-11T19:58:36.900Z"
  },
  "timestamp": "2026-04-17T11:38:18.760Z"
}
```

### `PUT /api/admin/membership-trades/{id}`

- **Summary**: [Admin] 회원권 거래 수정
- **OperationId**: `AdminMembershipTradesController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ |  |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateMembershipTradeDto`](#updatemembershiptradedto)

#### 응답

- `200` 수정 성공 → [`MembershipTradeDetailResponseDto`](#membershiptradedetailresponsedto)

### `DELETE /api/admin/membership-trades/{id}`

- **Summary**: [Admin] 회원권 거래 삭제
- **OperationId**: `AdminMembershipTradesController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ |  |

#### 응답

- `200` 삭제 성공 → [`MembershipTradeDeleteResponseDto`](#membershiptradedeleteresponsedto)

### `PATCH /api/admin/membership-trades/{id}/workflow-action`

- **Summary**: [Admin] 거래 승인 액션 처리
- **OperationId**: `AdminMembershipTradesController_handleWorkflowAction`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ |  |

#### Request Body

- Content-Type: `application/json`
- Schema: [`MembershipTradeWorkflowActionDto`](#membershiptradeworkflowactiondto)

#### 응답

- `200` 액션 처리 성공 → [`MembershipTradeDetailResponseDto`](#membershiptradedetailresponsedto)

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### CreateMembershipTradeDto

| Field | Type | Required | Description |
|---|---|---|---|
| `customerId` | string (uuid) |  | 고객 UUID _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `customerName` | string | ✓ | 고객명 _예: `홍길동`_ |
| `contact` | string |  | 연락처 _예: `010-1234-5678`_ |
| `tradeType` | `매도` \| `매수` | ✓ | 거래 유형 (매도/매수) _예: `매수`_ |
| `clubId` | string (uuid) | ✓ | 골프장 UUID (clubs 테이블 참조) _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `membershipId` | string (uuid) | ✓ | 회원권 UUID (memberships 테이블 참조) _예: `550e8400-e29b-41d4-a716-446655440001`_ |
| `contractDate` | string |  | 계약일 (YYYY-MM-DD) _예: `2024-02-09`_ |
| `amount` | number |  | 금액 (원 단위) _예: `150000000`_ |
| `depositAmount` | number |  | 계약금 (원 단위) _예: `30000000`_ |
| `tradingPartner` | string |  | 거래처 _예: `한국골프`_ |
| `tradeAmount` | number |  | 거래금액 (원 단위) _예: `160000000`_ |
| `commission` | number |  | 수수료 (원 단위) _예: `2000000`_ |
| `marketProfit` | number |  | 시세차익 (원 단위, 음수 가능) _예: `5000000`_ |
| `expense` | number |  | 지출 (원 단위) _예: `1000000`_ |
| `description` | string |  | 내용 _예: `계약 진행 중`_ |
| `balanceDate` | string |  | 잔금 진행 일자 (YYYY-MM-DD) _예: `2024-03-15`_ |
| `balanceCompleted` | boolean |  | 잔금 진행 완료 여부 _예: `False`_ |
| `manager` | string |  | 담당자 _예: `김담당`_ |
| `taxTransfer` | boolean |  | 세무 양도 여부 _예: `False`_ |
| `taxAcquisition` | boolean |  | 세무 취득 여부 _예: `False`_ |
| `invoiceSales` | number |  | 계산서 매출 (원 단위) _예: `1000000`_ |
| `invoicePurchase` | number |  | 계산서 매입 (원 단위) _예: `500000`_ |
| `remarks` | string |  | 비고 _예: `특이사항 없음`_ |
| `actualTransactionDate` | string |  | 실거래 자료 (날짜 텍스트) _예: `12월 11일`_ |

### MembershipTradeDeleteResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `message` | string | ✓ | 삭제 결과 메시지 _예: `삭제되었습니다`_ |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### MembershipTradeDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### MembershipTradeListDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `trades` | Array&lt;[`MembershipTradeResponseDto`](#membershiptraderesponsedto)&gt; | ✓ | 거래 목록 |
| `pagination` | object | ✓ | 페이지네이션 정보 |

### MembershipTradeListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

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

### MembershipTradeWorkflowActionDto

| Field | Type | Required | Description |
|---|---|---|---|
| `action` | `REQUEST_APPROVAL` \| `APPROVE_FIRST` \| `HOLD` \| `REJECT` \| `REOPEN` | ✓ | 거래 승인 액션 _예: `REQUEST_APPROVAL`_ |
| `reason` | string |  | 처리 사유 (REJECT에서 사용) _예: `거래금액 증빙을 보완해 주세요.`_ |

### UpdateMembershipTradeDto

| Field | Type | Required | Description |
|---|---|---|---|
| `customerId` | string (uuid) |  | 고객 UUID _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `customerName` | string |  | 고객명 _예: `홍길동`_ |
| `contact` | string |  | 연락처 _예: `010-1234-5678`_ |
| `tradeType` | `매도` \| `매수` |  | 거래 유형 (매도/매수) _예: `매수`_ |
| `clubId` | string (uuid) |  | 골프장 UUID (clubs 테이블 참조) _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `membershipId` | string (uuid) |  | 회원권 UUID (memberships 테이블 참조) _예: `550e8400-e29b-41d4-a716-446655440001`_ |
| `contractDate` | string |  | 계약일 (YYYY-MM-DD) _예: `2024-02-09`_ |
| `amount` | number |  | 금액 (원 단위) _예: `150000000`_ |
| `depositAmount` | number |  | 계약금 (원 단위) _예: `30000000`_ |
| `tradingPartner` | string |  | 거래처 _예: `한국골프`_ |
| `tradeAmount` | number |  | 거래금액 (원 단위) _예: `160000000`_ |
| `commission` | number |  | 수수료 (원 단위) _예: `2000000`_ |
| `marketProfit` | number |  | 시세차익 (원 단위, 음수 가능) _예: `5000000`_ |
| `expense` | number |  | 지출 (원 단위) _예: `1000000`_ |
| `description` | string |  | 내용 _예: `계약 진행 중`_ |
| `balanceDate` | string |  | 잔금 진행 일자 (YYYY-MM-DD) _예: `2024-03-15`_ |
| `balanceCompleted` | boolean |  | 잔금 진행 완료 여부 _예: `False`_ |
| `manager` | string |  | 담당자 _예: `김담당`_ |
| `taxTransfer` | boolean |  | 세무 양도 여부 _예: `False`_ |
| `taxAcquisition` | boolean |  | 세무 취득 여부 _예: `False`_ |
| `invoiceSales` | number |  | 계산서 매출 (원 단위) _예: `1000000`_ |
| `invoicePurchase` | number |  | 계산서 매입 (원 단위) _예: `500000`_ |
| `remarks` | string |  | 비고 _예: `특이사항 없음`_ |
| `actualTransactionDate` | string |  | 실거래 자료 (날짜 텍스트) _예: `12월 11일`_ |
