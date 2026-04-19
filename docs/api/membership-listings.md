# 매물/회원권 대표가 (공개) API

> spec: `v1.0.0+15ac42bd` · captured: `2026-04-17`
> base URL: `https://api.heritage-dx.com`

> ↔ Admin 대응: [admin/membership-listings.md](admin/membership-listings.md)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/membership-listings` | 회원권 대표가 목록 조회 | 공개 |
| `GET` | `/api/membership-listings/{id}` | 매물 상세 조회 | 공개 |

## 엔드포인트 상세

### `GET /api/membership-listings`

- **Summary**: 회원권 대표가 목록 조회
- **OperationId**: `MembershipListingsController_findAll`
- **인증**: 실제로는 필요할 수 있음 (스펙상 optional, 실테스트 결과 /auth/me 등은 401 반환)

공개 매물 데이터를 clubId + membershipId 기준으로 그룹핑해 매수/매도 대표가와 함께 조회합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `page` | number |  | 페이지 번호 |
| `query` | `limit` | number |  | 페이지당 항목 수 (최대 100) |
| `query` | `search` | string |  | 골프장명/회원권명 통합 검색 _예: `김포`_ |
| `query` | `clubId` | string (uuid) |  | 골프장 필터 _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `query` | `membershipId` | string (uuid) |  | 회원권 필터 _예: `550e8400-e29b-41d4-a716-446655440001`_ |
| `query` | `membershipType` | `개인` \| `법인` |  | 회원권 구분 필터 |
| `query` | `tradeType` | `매도` \| `매수` |  | 매수/매도 필터 |
| `query` | `agencyName` | string |  | 업체명 필터 _예: `한국골프거래소`_ |
| `query` | `startDate` | string |  | 등록일 범위 시작 (YYYY-MM-DD) _예: `2026-01-01`_ |
| `query` | `endDate` | string |  | 등록일 범위 끝 (YYYY-MM-DD) _예: `2026-03-31`_ |
| `query` | `sort` | `clubName` \| `buyRepresentativePrice` \| `sellRepresentativePrice` |  | 정렬 기준 |
| `query` | `order` | `ASC` \| `DESC` |  | 정렬 방향 |

#### 응답

- `200` 매물 목록 조회 성공 → [`MembershipListingPublicListResponseDto`](#membershiplistingpubliclistresponsedto)
- `400` 잘못된 요청 파라미터 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/membership-listings?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "clubId": "3b65a46d-c67e-47ea-ae74-7ae7e0ce9abb",
        "clubName": "88CC",
        "membershipId": "d70f4358-c2e1-4e8b-a822-cfe0b0463ead",
        "membershipName": "개인-정회원",
        "buyRepresentativePrice": 406447200,
        "sellRepresentativePrice": 434002000
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 3
    }
  },
  "timestamp": "2026-04-17T11:38:13.807Z"
}
```

### `GET /api/membership-listings/{id}`

- **Summary**: 매물 상세 조회
- **OperationId**: `MembershipListingsController_findOne`
- **인증**: 실제로는 필요할 수 있음 (스펙상 optional, 실테스트 결과 /auth/me 등은 401 반환)

UUID로 특정 매물 정보를 조회합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 매물 ID (UUID) |

#### 응답

- `200` 매물 상세 조회 성공 → [`MembershipListingDetailResponseDto`](#membershiplistingdetailresponsedto)
- `404` 매물을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/membership-listings/30703725-3edd-4374-83f0-8511aa3c3ae6
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "30703725-3edd-4374-83f0-8511aa3c3ae6",
    "clubId": "3b65a46d-c67e-47ea-ae74-7ae7e0ce9abb",
    "clubName": "88CC",
    "membershipId": "d70f4358-c2e1-4e8b-a822-cfe0b0463ead",
    "membershipName": "개인-정회원",
    "tradeType": "매수",
    "priceValue": 414000000,
    "agencyName": "스카이회원권",
    "registeredAt": "2026-03-20",
    "note": "가능",
    "createdAt": "2026-03-30T02:10:04.863Z",
    "updatedAt": "2026-03-30T02:10:04.863Z"
  },
  "timestamp": "2026-04-17T11:39:58.582Z"
}
```

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### MembershipListingDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2026-03-23T12:00:00Z`_ |

### MembershipListingGroupDto

| Field | Type | Required | Description |
|---|---|---|---|
| `clubId` | string | ✓ | 골프장 UUID |
| `clubName` | string | ✓ | 골프장명 |
| `membershipId` | string | ✓ | 회원권 UUID |
| `membershipName` | string | ✓ | 회원권명 |
| `buyRepresentativePrice` | number | ✓ | 매수 대표가 (원) _예: `150000000`_ |
| `sellRepresentativePrice` | number | ✓ | 매도 대표가 (원) _예: `160000000`_ |

### MembershipListingItemDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID (UUID) |
| `clubId` | string | ✓ | 골프장 UUID |
| `clubName` | string | ✓ | 골프장명 |
| `membershipId` | string | ✓ | 회원권 UUID |
| `membershipName` | string | ✓ | 회원권명 |
| `tradeType` | `매도` \| `매수` | ✓ | 매수/매도 구분 |
| `priceValue` | number | ✓ | 가격 (원) |
| `agencyName` | string | ✓ | 매물 등록 업체명 |
| `registeredAt` | string (date-time) | ✓ | 매물 등록일 |
| `note` | string |  | 비고 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### MembershipListingPaginationMetaDto

| Field | Type | Required | Description |
|---|---|---|---|
| `currentPage` | number | ✓ | 현재 페이지 _예: `1`_ |
| `totalPages` | number | ✓ | 전체 페이지 수 _예: `5`_ |
| `totalItems` | number | ✓ | 전체 항목 수 _예: `100`_ |
| `itemsPerPage` | number | ✓ | 페이지당 항목 수 _예: `20`_ |

### MembershipListingPublicListDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `listings` | Array&lt;[`MembershipListingGroupDto`](#membershiplistinggroupdto)&gt; | ✓ | 대표가 목록 |
| `pagination` | object | ✓ | 페이지네이션 정보 |

### MembershipListingPublicListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2026-03-23T12:00:00Z`_ |
