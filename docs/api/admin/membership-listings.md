# Admin 매물 API

> spec: `v1.0.0+57563d32` · captured: `2026-05-12`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

> ↔ 공개 대응: [../membership-listings.md](../membership-listings.md)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/membership-listings` | [Admin] 매물 목록 조회 | 🔒 |
| `POST` | `/api/admin/membership-listings` | [Admin] 매물 단건 등록 | 🔒 |
| `POST` | `/api/admin/membership-listings/bulk` | [Admin] 매물 일괄 등록 (스크래핑 데이터) | 🔒 |
| `PATCH` | `/api/admin/membership-listings/{id}` | [Admin] 매물 수정 | 🔒 |
| `DELETE` | `/api/admin/membership-listings/{id}` | [Admin] 매물 삭제 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/membership-listings`

- **Summary**: [Admin] 매물 목록 조회
- **OperationId**: `AdminMembershipListingsController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `page` | number |  | 페이지 번호 |
| `query` | `limit` | number |  | 페이지당 항목 수 (최대 100) |
| `query` | `search` | string |  | 골프장명/회원권명/업체명 통합 검색 _예: `김포`_ |
| `query` | `clubId` | string (uuid) |  | 골프장 필터 _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `query` | `membershipId` | string (uuid) |  | 회원권 필터 _예: `550e8400-e29b-41d4-a716-446655440001`_ |
| `query` | `membershipType` | `개인` \| `법인` |  | 회원권 구분 필터 |
| `query` | `tradeType` | `매도` \| `매수` |  | 매수/매도 필터 |
| `query` | `agencyName` | string |  | 업체명 필터 _예: `한국골프거래소`_ |
| `query` | `startDate` | string |  | 등록일 범위 시작 (YYYY-MM-DD) _예: `2026-01-01`_ |
| `query` | `endDate` | string |  | 등록일 범위 끝 (YYYY-MM-DD) _예: `2026-03-31`_ |
| `query` | `sort` | `registeredAt` \| `priceValue` \| `clubName` \| `clubId` |  | 정렬 기준 |
| `query` | `order` | `ASC` \| `DESC` |  | 정렬 방향 |

#### 응답

- `200` 목록 조회 성공 → [`MembershipListingListResponseDto`](#membershiplistinglistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/membership-listings?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "listings": [
      {
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
      {
        "id": "15dcd81a-ec9e-4d70-9ec3-894a9675e2f7",
        "clubId": "3b65a46d-c67e-47ea-ae74-7ae7e0ce9abb",
        "clubName": "88CC",
        "membershipId": "d70f4358-c2e1-4e8b-a822-cfe0b0463ead",
        "membershipName": "개인-정회원",
        "tradeType": "매수",
        "priceValue": 402000000,
        "agencyName": "회원권박사",
        "registeredAt": "2026-03-20",
        "note": "가능 p",
        "createdAt": "2026-03-30T02:10:04.863Z",
        "updatedAt": "2026-03-30T02:10:04.863Z"
      },
      {
        "id": "1087f846-de25-4591-a131-7232da6fb048",
        "clubId": "3b65a46d-c67e-47ea-ae74-7ae7e0ce9abb",
        "clubName": "88CC",
        "membershipId": "d70f4358-c2e1-4e8b-a822-cfe0b0463ead",
        "membershipName": "개인-정회원",
        "tradeType": "매수",
        "priceValue": 387000000,
        "agencyName": "청우회원권",
        "registeredAt": "2026-03-20",
        "note": "가능",
        "createdAt": "2026-03-30T02:10:04.863Z",
        "updatedAt": "2026-03-30T02:10:04.863Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 12,
      "totalItems": 34,
      "itemsPerPage": 3
    }
  },
  "timestamp": "2026-04-17T11:38:12.891Z"
}
```

### `POST /api/admin/membership-listings`

- **Summary**: [Admin] 매물 단건 등록
- **OperationId**: `AdminMembershipListingsController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateMembershipListingDto`](#createmembershiplistingdto)

#### 응답

- `201` 등록 성공 → [`MembershipListingDetailResponseDto`](#membershiplistingdetailresponsedto)
- `400` 잘못된 요청 → [`ErrorResponseDto`](#errorresponsedto)

### `POST /api/admin/membership-listings/bulk`

- **Summary**: [Admin] 매물 일괄 등록 (스크래핑 데이터)
- **OperationId**: `AdminMembershipListingsController_createBulk`
- **인증**: 필요 (쿠키 `hdx_access_token`)

중복 데이터(club_id, membership_id, trade_type, agency_name, registered_at)는 자동으로 스킵됩니다.

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateMembershipListingBulkDto`](#createmembershiplistingbulkdto)

#### 응답

- `201` 일괄 등록 성공 → [`MembershipListingBulkResponseDto`](#membershiplistingbulkresponsedto)

### `PATCH /api/admin/membership-listings/{id}`

- **Summary**: [Admin] 매물 수정
- **OperationId**: `AdminMembershipListingsController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 매물 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateMembershipListingDto`](#updatemembershiplistingdto)

#### 응답

- `200` 수정 성공 → [`MembershipListingDetailResponseDto`](#membershiplistingdetailresponsedto)
- `404` 매물을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/admin/membership-listings/{id}`

- **Summary**: [Admin] 매물 삭제
- **OperationId**: `AdminMembershipListingsController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 매물 ID (UUID) |

#### 응답

- `200` 삭제 성공 → [`MembershipListingDeleteResponseDto`](#membershiplistingdeleteresponsedto)
- `404` 매물을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### CreateMembershipListingBulkDto

| Field | Type | Required | Description |
|---|---|---|---|
| `listings` | Array&lt;[`CreateMembershipListingDto`](#createmembershiplistingdto)&gt; | ✓ | 매물 목록 (스크래핑 데이터 일괄 등록) |

### CreateMembershipListingDto

| Field | Type | Required | Description |
|---|---|---|---|
| `clubId` | string (uuid) | ✓ | 골프장 UUID _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `membershipId` | string (uuid) | ✓ | 회원권 UUID (memberships 테이블 참조) _예: `550e8400-e29b-41d4-a716-446655440001`_ |
| `tradeType` | `매도` \| `매수` | ✓ | 매수/매도 구분 _예: `매도`_ |
| `priceValue` | number | ✓ | 가격 (원) _예: `150000000`_ |
| `agencyName` | string | ✓ | 매물 등록 업체명 _예: `한국골프거래소`_ |
| `registeredAt` | string | ✓ | 매물 등록일 (YYYY-MM-DD) _예: `2026-03-20`_ |
| `note` | string |  | 비고 _예: `특이사항 없음`_ |

### MembershipListingBulkDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `insertedCount` | number | ✓ | 등록된 건수 _예: `50`_ |
| `skippedCount` | number | ✓ | 중복 스킵 건수 _예: `3`_ |

### MembershipListingBulkResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2026-03-23T12:00:00Z`_ |

### MembershipListingDeleteResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `message` | string | ✓ | 삭제 결과 메시지 _예: `삭제되었습니다.`_ |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2026-03-23T12:00:00Z`_ |

### MembershipListingDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2026-03-23T12:00:00Z`_ |

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

### MembershipListingListDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `listings` | Array&lt;[`MembershipListingItemDto`](#membershiplistingitemdto)&gt; | ✓ | 매물 목록 |
| `pagination` | object | ✓ | 페이지네이션 정보 |

### MembershipListingListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2026-03-23T12:00:00Z`_ |

### MembershipListingPaginationMetaDto

| Field | Type | Required | Description |
|---|---|---|---|
| `currentPage` | number | ✓ | 현재 페이지 _예: `1`_ |
| `totalPages` | number | ✓ | 전체 페이지 수 _예: `5`_ |
| `totalItems` | number | ✓ | 전체 항목 수 _예: `100`_ |
| `itemsPerPage` | number | ✓ | 페이지당 항목 수 _예: `20`_ |

### UpdateMembershipListingDto

| Field | Type | Required | Description |
|---|---|---|---|
| `clubId` | string (uuid) |  | 골프장 UUID _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `membershipId` | string (uuid) |  | 회원권 UUID (memberships 테이블 참조) _예: `550e8400-e29b-41d4-a716-446655440001`_ |
| `tradeType` | `매도` \| `매수` |  | 매수/매도 구분 _예: `매도`_ |
| `priceValue` | number |  | 가격 (원) _예: `150000000`_ |
| `agencyName` | string |  | 매물 등록 업체명 _예: `한국골프거래소`_ |
| `registeredAt` | string |  | 매물 등록일 (YYYY-MM-DD) _예: `2026-03-20`_ |
| `note` | string |  | 비고 _예: `특이사항 없음`_ |
