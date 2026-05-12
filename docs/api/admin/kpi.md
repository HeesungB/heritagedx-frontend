# Admin KPI API

> spec: `v1.0.0+57563d32` · captured: `2026-05-12`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/kpi/consultations` | [Admin] 상담 KPI | 🔒 |
| `GET` | `/api/admin/kpi/trades` | [Admin] 거래 KPI | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/kpi/consultations`

- **Summary**: [Admin] 상담 KPI
- **OperationId**: `AdminKpiController_getConsultationKpi`
- **인증**: 필요 (쿠키 `hdx_access_token`)

기간 내 상담 생성, 승인 요청, 계약금 기준 1차 승인, 거래내역 전환, 최종 완료 건수를 조회합니다. userId를 지정하면 해당 직원 기준으로 필터링합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `startDate` | string | ✓ | 시작일 (YYYY-MM-DD) _예: `2025-01-01`_ |
| `query` | `endDate` | string | ✓ | 종료일 (YYYY-MM-DD) _예: `2025-12-31`_ |
| `query` | `dateField` | `registrationDate` \| `createdAt` |  | 날짜 필터 기준 (기본: registrationDate) |
| `query` | `userId` | string (uuid) |  | 직원 UUID (미입력 시 전체 조회) _예: `550e8400-e29b-41d4-a716-446655440000`_ |

#### 응답

- `200`  → [`ConsultationKpiResponseDto`](#consultationkpiresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/kpi/consultations?startDate=2026-01-01&endDate=2026-04-17
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "totalCount": 10,
    "consultationCreatedCount": 10,
    "approvalRequestedCount": 8,
    "depositBasedFirstApprovedCount": 4,
    "tradeConvertedCount": 4,
    "finalCompletedCount": 2
  },
  "timestamp": "2026-04-17T11:39:59.504Z"
}
```

### `GET /api/admin/kpi/trades`

- **Summary**: [Admin] 거래 KPI
- **OperationId**: `AdminKpiController_getTradeKpi`
- **인증**: 필요 (쿠키 `hdx_access_token`)

기간 내 거래 건수 및 순이익 합계를 조회합니다. employeeField를 지정하면 해당 직원 기준으로 필터링합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `startDate` | string | ✓ | 시작일 (YYYY-MM-DD) _예: `2025-01-01`_ |
| `query` | `endDate` | string | ✓ | 종료일 (YYYY-MM-DD) _예: `2025-12-31`_ |
| `query` | `employeeField` | `createdByUserId` \| `manager` |  | 직원 필터 기준. 미입력 시 전체 조회. createdByUserId → userId 필수, manager → managerName 필수 |
| `query` | `userId` | string (uuid) |  | 직원 UUID (employeeField=createdByUserId일 때 필수) _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `query` | `managerName` | string |  | 담당자 이름 (employeeField=manager일 때 필수) _예: `김담당`_ |

#### 응답

- `200`  → [`TradeKpiResponseDto`](#tradekpiresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/kpi/trades?startDate=2026-01-01&endDate=2026-04-17
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "totalCount": 2,
    "totalNetProfit": 9000000
  },
  "timestamp": "2026-04-17T11:39:59.316Z"
}
```

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### ConsultationKpiDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `totalCount` | number | ✓ | 기존 상담 KPI 합계 (dateField 기준) _예: `120`_ |
| `consultationCreatedCount` | number | ✓ | 상담 생성 수 (createdAt 기준) _예: `120`_ |
| `approvalRequestedCount` | number | ✓ | 승인 요청 수 (approvalRequestedAt 기준) _예: `80`_ |
| `depositBasedFirstApprovedCount` | number | ✓ | 계약금이 입력된 1차 승인 수 (firstApprovedAt 기준) _예: `50`_ |
| `tradeConvertedCount` | number | ✓ | 상담에서 거래내역으로 전환된 수 (firstApprovedAt 기준) _예: `50`_ |
| `finalCompletedCount` | number | ✓ | 거래 최종 완료 수 (finalApprovedAt 기준) _예: `35`_ |
| `userId` | string |  | 직원 UUID (필터 적용 시) |

### ConsultationKpiResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 요청 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 시간 _예: `2024-12-13T12:00:00Z`_ |

### TradeKpiDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `totalCount` | number | ✓ | 예: `42` |
| `totalNetProfit` | number | ✓ | 예: `125000000` |
| `userId` | string |  | 직원 UUID (필터 적용 시) |
| `managerName` | string |  | 담당자 이름 (필터 적용 시) |

### TradeKpiResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 요청 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 시간 _예: `2024-12-13T12:00:00Z`_ |
