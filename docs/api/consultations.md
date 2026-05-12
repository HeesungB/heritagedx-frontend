# 상담 기록 API

> spec: `v1.0.0+d8345ee2` · captured: `2026-04-22`
> base URL: `https://api.heritage-dx.com`

> ↔ Admin 대응: [admin/consultations.md](admin/consultations.md)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/consultations` | 상담 기록 목록 조회 | 🔒 |
| `POST` | `/api/consultations` | 상담 기록 등록 | 🔒 |
| `GET` | `/api/consultations/{id}` | 상담 기록 상세 조회 | 🔒 |
| `PUT` | `/api/consultations/{id}` | 상담 기록 수정 | 🔒 |
| `DELETE` | `/api/consultations/{id}` | 상담 기록 삭제 | 🔒 |
| `PATCH` | `/api/consultations/{id}/approval-action` | 상담 승인 액션 처리 | 🔒 |

## 엔드포인트 상세

### `GET /api/consultations`

- **Summary**: 상담 기록 목록 조회
- **OperationId**: `ConsultationsController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

상담 기록 목록을 페이지네이션, 검색, 필터링과 함께 조회합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `organizationId` | string (uuid) |  | 조직 ID 필터 (관리자 경로에서 주로 사용) _예: `a0000000-0000-4000-a000-000000000001`_ |
| `query` | `page` | number |  | 페이지 번호 _예: `1`_ |
| `query` | `limit` | number |  | 페이지당 항목 수 _예: `20`_ |
| `query` | `search` | string |  | 검색어 (골프장명, 회원권명, 고객명, 연락처) _예: `골든비치`_ |
| `query` | `tradeType` | `매도` \| `매수` |  | 거래 유형 필터 _예: `매수`_ |
| `query` | `approvalStatus` | `DRAFT` \| `PENDING_APPROVAL` \| `FIRST_APPROVED` \| `ON_HOLD` \| `REJECTED` |  | 상담 승인 상태 필터 _예: `PENDING_APPROVAL`_ |
| `query` | `customerId` | string (uuid) |  | 고객 UUID 필터 _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `query` | `linkedTradeId` | string (uuid) |  | 연결된 거래 UUID 필터 _예: `550e8400-e29b-41d4-a716-446655440001`_ |
| `query` | `isConverted` | boolean |  | 거래 초안 생성 여부 필터 _예: `True`_ |
| `query` | `isDone` | boolean |  | 거래 완료 여부 필터 |
| `query` | `isShared` | boolean |  | 공유 여부 필터 _예: `True`_ |
| `query` | `sort` | `registrationDate` \| `createdAt` \| `clubName` \| `membershipName` \| `offerPrice` \| `desiredPrice` |  | 정렬 기준 _예: `registrationDate`_ |
| `query` | `order` | `ASC` \| `DESC` |  | 정렬 방향 _예: `DESC`_ |

#### 응답

- `200` 목록 조회 성공 → [`ConsultationListResponseDto`](#consultationlistresponsedto)
- `401` 유효하지 않은 인증 토큰 → -

#### 실호출 샘플 (2026-04-17)

```http
GET /api/consultations?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": "4a720352-762f-414f-95b6-b206d9788360",
        "customerId": "e18eb964-be92-49cc-86bb-ba75b06171f6",
        "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
        "clubName": "가야",
        "membershipId": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
        "membershipName": "주중-법인",
        "tradeType": "매수",
        "customerName": "prod-분기상담-invalid_draft_approve-20260412034828",
        "contact": "010-****-****",
        "offerPrice": "128000000",
        "offerPriceNote": null,
        "desiredPrice": "126000000",
        "desiredPriceNote": null,
        "depositAmount": 10000000,
        "customFields": {},
        "notes": "production branch consultation test",
        "registrationDate": "2026-04-12",
        "tradeDate": null,
        "remarks": "prod branch consultation test",
        "isDone": false,
        "isShared": false,
        "approvalStatus": "FIRST_APPROVED",
        "approvalRequestedAt": "2026-04-15T12:07:39.229Z",
        "firstApprovedAt": "2026-04-15T12:09:00.256Z",
        "holdReason": null,
        "rejectionReason": null,
        "linkedTradeId": "669987c9-e544-489a-a5df-6fbbcb930566",
        "createdByName": "Prod Workflow Editor",
        "createdAt": "2026-04-11T18:48:35.935Z",
        "updatedAt": "2026-04-15T12:09:00.226Z"
      },
      {
        "id": "4566daeb-cee5-444f-8312-575be7d9025d",
        "customerId": "b796c696-b148-46c9-beb5-f8b36876a6b0",
        "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
        "clubName": "가야",
        "membershipId": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
        "membershipName": "주중-법인",
        "tradeType": "매수",
        "customerName": "prod-분기상담-pending_edit_block-20260412034828",
        "contact": "010-****-****",
        "offerPrice": "128000000",
        "offerPriceNote": null,
        "desiredPrice": "126000000",
        "desiredPriceNote": null,
        "depositAmount": 10000000,
        "customFields": {},
        "notes": "production branch consultation test",
        "registrationDate": "2026-04-12",
        "tradeDate": null,
        "remarks": "prod branch consultation test",
        "isDone": false,
        "isShared": false,
        "approvalStatus": "PENDING_APPROVAL",
        "approvalRequestedAt": "2026-04-11T18:48:36.888Z",
        "firstApprovedAt": null,
        "holdReason": null,
        "rejectionReason": null,
        "linkedTradeId": null,
        "createdByName": "Prod Workflow Editor",
        "createdAt": "2026-04-11T18:48:36.494Z",
        "updatedAt": "2026-04-11T18:48:36.892Z"
      },
      {
        "id": "1b493025-f943-4428-8efa-de00f4609722",
        "customerId": "d61f14fa-0914-476f-87a0-b5fb23efcd1e",
        "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
        "clubName": "가야",
        "membershipId": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
        "membershipName": "주중-법인",
        "tradeType": "매수",
        "customerName": "pa-hold_reapprove-045835",
        "contact": "010-****-****",
        "offerPrice": "128000000",
        "offerPriceNote": null,
        "desiredPrice": "126000000",
        "desiredPriceNote": null,
        "depositAmount": 10000000,
        "customFields": {},
        "notes": "prod action consultation test",
        "registrationDate": "2026-04-12",
        "tradeDate": null,
        "remarks": "prod action consultation test",
        "isDone": false,
        "isShared": false,
        "approvalStatus": "FIRST_APPROVED",
        "approvalRequestedAt": "2026-04-11T19:58:36.531Z",
        "firstApprovedAt": "2026-04-11T19:58:36.917Z",
        "holdReason": null,
        "rejectionReason": null,
        "linkedTradeId": "ff258bb6-d86b-4928-b767-8a5dd78b8242",
        "createdByName": "Prod Workflow Editor",
        "createdAt": "2026-04-11T19:58:35.479Z",
        "updatedAt": "2026-04-11T19:58:36.900Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalItems": 23,

... (truncated)
```

### `POST /api/consultations`

- **Summary**: 상담 기록 등록
- **OperationId**: `ConsultationsController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

새로운 상담 기록을 등록합니다. club/membership은 UUID(기존 데이터 참조) 또는 텍스트(직접 입력) 모드로 모두 지원하며, 완료 판별은 응답의 `progressStatus === "COMPLETED"` 로 한다.

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateConsultationDto`](#createconsultationdto)

#### 응답

- `201` 상담 기록 등록 성공 → [`ConsultationDetailResponseDto`](#consultationdetailresponsedto)
- `400` 잘못된 요청 → [`ErrorResponseDto`](#errorresponsedto)
- `401` 유효하지 않은 인증 토큰 → -
- `404` UUID 모드에서 골프장 또는 회원권을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/consultations/{id}`

- **Summary**: 상담 기록 상세 조회
- **OperationId**: `ConsultationsController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

UUID로 특정 상담 기록을 조회합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 상담 기록 ID (UUID) _예: `550e8400-e29b-41d4-a716-446655440000`_ |

#### 응답

- `200` 조회 성공 → [`ConsultationDetailResponseDto`](#consultationdetailresponsedto)
- `401` 유효하지 않은 인증 토큰 → -
- `404` 상담 기록을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/consultations/4a720352-762f-414f-95b6-b206d9788360
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "4a720352-762f-414f-95b6-b206d9788360",
    "customerId": "e18eb964-be92-49cc-86bb-ba75b06171f6",
    "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
    "clubName": "가야",
    "membershipId": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
    "membershipName": "주중-법인",
    "tradeType": "매수",
    "customerName": "prod-분기상담-invalid_draft_approve-20260412034828",
    "contact": "010-****-****",
    "offerPrice": "128000000",
    "offerPriceNote": null,
    "desiredPrice": "126000000",
    "desiredPriceNote": null,
    "depositAmount": 10000000,
    "customFields": {},
    "notes": "production branch consultation test",
    "registrationDate": "2026-04-12",
    "tradeDate": null,
    "remarks": "prod branch consultation test",
    "isDone": false,
    "isShared": false,
    "approvalStatus": "FIRST_APPROVED",
    "approvalRequestedAt": "2026-04-15T12:07:39.229Z",
    "firstApprovedAt": "2026-04-15T12:09:00.256Z",
    "holdReason": null,
    "rejectionReason": null,
    "linkedTradeId": "669987c9-e544-489a-a5df-6fbbcb930566",
    "createdByName": "Prod Workflow Editor",
    "createdAt": "2026-04-11T18:48:35.935Z",
    "updatedAt": "2026-04-15T12:09:00.226Z"
  },
  "timestamp": "2026-04-17T11:38:19.497Z"
}
```

### `PUT /api/consultations/{id}`

- **Summary**: 상담 기록 수정
- **OperationId**: `ConsultationsController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

기존 상담 기록을 부분 수정합니다. club/membership을 함께 보내면 UUID 또는 텍스트 모드로 갱신되며, 완료 단계 전환은 admin 워크플로우 액션을 통해서만 가능하다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 상담 기록 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateConsultationDto`](#updateconsultationdto)

#### 응답

- `200` 수정 성공 → [`ConsultationDetailResponseDto`](#consultationdetailresponsedto)
- `401` 유효하지 않은 인증 토큰 → -
- `404` 상담 기록 또는 골프장을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/consultations/{id}`

- **Summary**: 상담 기록 삭제
- **OperationId**: `ConsultationsController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

상담 기록을 삭제합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 상담 기록 ID (UUID) |

#### 응답

- `200` 삭제 성공 → [`ConsultationDeleteResponseDto`](#consultationdeleteresponsedto)
- `401` 유효하지 않은 인증 토큰 → -
- `404` 상담 기록을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `PATCH /api/consultations/{id}/approval-action`

- **Summary**: 상담 승인 액션 처리
- **OperationId**: `ConsultationsController_handleApprovalAction`
- **인증**: 필요 (쿠키 `hdx_access_token`)

상담 승인 워크플로우 액션을 처리합니다. 일반 상담 경로에서는 REQUEST_APPROVAL만 지원합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 상담 기록 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`ConsultationApprovalActionDto`](#consultationapprovalactiondto)

#### 응답

- `200` 액션 처리 성공 → [`ConsultationDetailResponseDto`](#consultationdetailresponsedto)

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### ConsultationApprovalActionDto

| Field | Type | Required | Description |
|---|---|---|---|
| `action` | `REQUEST_APPROVAL` \| `APPROVE_FIRST` \| `HOLD` \| `REJECT` \| `REOPEN` | ✓ | 상담 승인 액션 _예: `REQUEST_APPROVAL`_ |
| `reason` | string |  | 처리 사유 (HOLD, REJECT에서 사용) _예: `계약금 확인 후 재요청 바랍니다.`_ |

### ConsultationDeleteResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `message` | string | ✓ | 삭제 결과 메시지 _예: `삭제되었습니다`_ |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### ConsultationDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### ConsultationListDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `trades` | Array&lt;[`ConsultationResponseDto`](#consultationresponsedto)&gt; | ✓ | 상담 기록 목록 |
| `pagination` | object | ✓ | 페이지네이션 정보 |

### ConsultationListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

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
| `accountNumber` | string |  | 계좌번호 |
| `customFields` | object | ✓ | 상담별 자유형 커스텀 필드 _예: `{'희망지역': '제주', 'VIP': True}`_ |
| `notes` | string |  | 특기사항 |
| `registrationDate` | string (date-time) |  | 등록일자 |
| `tradeDate` | string (date-time) |  | 거래일 |
| `remarks` | string |  | 비고 |
| `isShared` | boolean | ✓ | 공유 여부 _예: `False`_ |
| `approvalStatus` | `IN_CONSULTATION` \| `PENDING_DEPOSIT` \| `DEPOSIT_APPROVED` | ✓ | 상담 승인 상태 |
| `progressStatus` | `IN_CONSULTATION` \| `PENDING_DEPOSIT` \| `DOCUMENT_AND_BALANCE` \| `TAX_FILING` \| `COMPLETED` | ✓ | 상담↔거래 통합 진행 상태 (2026-05 신규). 완료 판별은 `progressStatus === "COMPLETED"`. |
| `approvalRequestedAt` | string (date-time) |  | 승인 요청 일시 |
| `firstApprovedAt` | string (date-time) |  | 1차 승인 일시 |
| `linkedTradeId` | string |  | 연결된 거래 UUID |
| `settlementId` | string |  | 연결된 입출금표 UUID (nullable) |
| `settlementDocumentGenerated` | boolean | ✓ | 입출금표 문서 생성 완료 여부 |
| `settlementDocumentGeneratedAt` | string (date-time) |  | 문서 생성 완료 시각 |
| `createdByName` | string | ✓ | 작성자 이름 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### CreateConsultationDto

| Field | Type | Required | Description |
|---|---|---|---|
| `club` | string | ✓ | 골프장 (UUID 또는 텍스트) _예: `550e8400-e29b-41d4-a716-446655440000 또는 강남골프클럽`_ |
| `membership` | string | ✓ | 회원권 (UUID 또는 텍스트) _예: `550e8400-e29b-41d4-a716-446655440001 또는 개인정회원`_ |
| `tradeType` | `매도` \| `매수` | ✓ | 거래 유형 _예: `매수`_ |
| `customerName` | string | ✓ | 고객명 _예: `홍길동`_ |
| `contact` | string | ✓ | 연락처 _예: `010-1234-5678`_ |
| `offerPrice` | number |  | 제시가 (원 단위) _예: `150000000`_ |
| `offerPriceNote` | string |  | 제시가 메모 _예: `협의 가능`_ |
| `desiredPrice` | number |  | 희망가 (원 단위) _예: `180000000`_ |
| `desiredPriceNote` | string |  | 희망가 메모 _예: `급매`_ |
| `depositAmount` | number |  | 계약금 (원 단위) _예: `30000000`_ |
| `accountNumber` | string |  | 계좌번호 _예: `110-123-456789`_ |
| `customFields` | object |  | 상담별 자유형 커스텀 필드. 최상위는 객체여야 하며 내부 값은 모든 JSON 값을 허용합니다. _예: `{'희망지역': '제주', 'VIP': True, '예산': 300000000, '태그': ['급매', '재상담'], '메모': None}`_ |
| `notes` | string |  | 특기사항 _예: `타회원권 교환 희망`_ |
| `registrationDate` | string |  | 등록일자 (YYYY-MM-DD) _예: `2024-02-09`_ |
| `tradeDate` | string |  | 거래일 (YYYY-MM-DD) _예: `2024-02-15`_ |
| `remarks` | string |  | 비고 _예: `계약금 입금 완료`_ |
| `isShared` | boolean |  | 공유 여부 (같은 조직의 다른 에디터에게 조회 허용) _예: `False`_ |

### UpdateConsultationDto

| Field | Type | Required | Description |
|---|---|---|---|
| `club` | string |  | 골프장 (UUID 또는 텍스트) _예: `550e8400-e29b-41d4-a716-446655440000 또는 강남골프클럽`_ |
| `membership` | string |  | 회원권 (UUID 또는 텍스트) _예: `550e8400-e29b-41d4-a716-446655440001 또는 개인정회원`_ |
| `tradeType` | `매도` \| `매수` |  | 거래 유형 _예: `매수`_ |
| `customerName` | string |  | 고객명 _예: `홍길동`_ |
| `contact` | string |  | 연락처 _예: `010-1234-5678`_ |
| `offerPrice` | number |  | 제시가 (원 단위) _예: `150000000`_ |
| `offerPriceNote` | string |  | 제시가 메모 _예: `협의 가능`_ |
| `desiredPrice` | number |  | 희망가 (원 단위) _예: `180000000`_ |
| `desiredPriceNote` | string |  | 희망가 메모 _예: `급매`_ |
| `depositAmount` | number |  | 계약금 (원 단위) _예: `30000000`_ |
| `accountNumber` | string |  | 계좌번호 _예: `110-123-456789`_ |
| `notes` | string |  | 특기사항 _예: `타회원권 교환 희망`_ |
| `registrationDate` | string |  | 등록일자 (YYYY-MM-DD) _예: `2024-02-09`_ |
| `tradeDate` | string |  | 거래일 (YYYY-MM-DD) _예: `2024-02-15`_ |
| `remarks` | string |  | 비고 _예: `계약금 입금 완료`_ |
| `isShared` | boolean |  | 공유 여부 (같은 조직의 다른 에디터에게 조회 허용) _예: `False`_ |
| `customFields` | object |  | 상담별 자유형 커스텀 필드. 전송하면 기존 객체를 전체 교체하고, 생략하면 기존 값을 유지합니다. _예: `{'VIP': False}`_ |
