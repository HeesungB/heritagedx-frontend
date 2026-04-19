# Clubs (공개) API

> spec: `v1.0.0+15ac42bd` · captured: `2026-04-17`
> base URL: `https://api.heritage-dx.com`

> ↔ Admin 대응: [admin/clubs.md](admin/clubs.md)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/clubs` | 골프장 목록 조회 | 공개 |
| `GET` | `/api/clubs/memberships/{membershipId}/market-prices` | 회원권 시세 이력 조회 | 공개 |
| `GET` | `/api/clubs/{identifier}` | 골프장 상세 조회 | 공개 |

## 엔드포인트 상세

### `GET /api/clubs`

- **Summary**: 골프장 목록 조회
- **OperationId**: `ClubsController_findAll`
- **인증**: 실제로는 필요할 수 있음 (스펙상 optional, 실테스트 결과 /auth/me 등은 401 반환)

페이지네이션과 검색을 지원하는 골프장 목록 조회 API (운영 형식 필터는 operationType 사용, operationTypes는 하위호환용)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `page` | number |  | 페이지 번호 |
| `query` | `limit` | number |  | 페이지당 항목 수 (최대 100) |
| `query` | `search` | string |  | 검색어 (name, code, region, companyName 모두 검색) _예: `김포`_ |
| `query` | `region` | string |  | 지역 정확 필터 (예: 경기, 강원) _예: `경기`_ |
| `query` | `operationType` | `PUBLIC` \| `MEMBERSHIP` \| `CONDO` |  | 운영 형식 필터 (정확히 일치하는 값만 반환) _예: `MEMBERSHIP`_ |
| `query` | `operationTypes` | `PUBLIC` \| `MEMBERSHIP` \| `CONDO` |  | 운영 형식 필터 레거시 파라미터 (operationType과 동일, 하위호환용) _예: `MEMBERSHIP`_ |
| `query` | `sort` | `name` \| `code` \| `region` |  | 정렬 기준 |
| `query` | `order` | `asc` \| `desc` |  | 정렬 순서 |

#### 응답

- `200` 골프장 목록 조회 성공 → [`ClubListResponseDto`](#clublistresponsedto)
- `400` 잘못된 요청 파라미터 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/clubs?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "clubs": [
      {
        "id": "680fcded-07ec-4537-9dba-bb52d440ddfa",
        "code": "IMP_CLUB_20",
        "name": "가야",
        "companyName": "가야개발(주)",
        "region": "경남 김해시",
        "operationType": "MEMBERSHIP",
        "operationTypes": [
          "MEMBERSHIP"
        ],
        "holes": "45홀"
      },
      {
        "id": "7114bf33-8bdc-497f-8e55-7f9a29641944",
        "code": "IMP_CLUB",
        "name": "골드",
        "companyName": "기흥관광개발(주)",
        "region": "경기도 용인시",
        "operationType": "MEMBERSHIP",
        "operationTypes": [
          "MEMBERSHIP"
        ],
        "holes": "36홀"
      },
      {
        "id": "9ff17959-0ca3-477d-9416-1f924dbd780d",
        "code": "IMP_CLUB_2",
        "name": "광주",
        "companyName": "광주관광개발(주)",
        "region": "전남 곡성군",
        "operationType": "MEMBERSHIP",
        "operationTypes": [
          "MEMBERSHIP"
        ],
        "holes": "27홀"
      }
    ],
    "pagination": {
      "total": 160,
      "page": 1,
      "limit": 3,
      "totalPages": 54,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2026-04-17T11:38:11.162Z"
}
```

### `GET /api/clubs/memberships/{membershipId}/market-prices`

- **Summary**: 회원권 시세 이력 조회
- **OperationId**: `ClubsController_getMarketPrices`
- **인증**: 실제로는 필요할 수 있음 (스펙상 optional, 실테스트 결과 /auth/me 등은 401 반환)

특정 회원권의 날짜별 시세 이력을 조회합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `membershipId` | string | ✓ | 회원권 UUID |
| `query` | `from` | string |  | 조회 시작일 (YYYY-MM-DD) _예: `2025-10-14`_ |
| `query` | `to` | string |  | 조회 종료일 (YYYY-MM-DD) _예: `2026-02-23`_ |

#### 응답

- `200` 시세 이력 조회 성공 → [`MarketPriceHistoryResponseDto`](#marketpricehistoryresponsedto)
- `400` 잘못된 요청 파라미터 → [`ErrorResponseDto`](#errorresponsedto)
- `404` 회원권을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/clubs/memberships/d70f4358-c2e1-4e8b-a822-cfe0b0463ead/market-prices
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "membershipId": "d70f4358-c2e1-4e8b-a822-cfe0b0463ead",
    "prices": [
      {
        "date": "2025-10-14",
        "marketPrice": "340000000"
      },
      {
        "date": "2025-10-21",
        "marketPrice": "348000000"
      },
      {
        "date": "2025-10-27",
        "marketPrice": "348000000"
      },
      {
        "date": "2025-11-03",
        "marketPrice": "348000000"
      },
      {
        "date": "2025-11-10",
        "marketPrice": "349000000"
      },
      {
        "date": "2025-11-24",
        "marketPrice": "358000000"
      },
      {
        "date": "2025-12-08",
        "marketPrice": "361000000"
      },
      {
        "date": "2025-12-15",
        "marketPrice": "362500000"
      },
      {
        "date": "2025-12-22",
        "marketPrice": "366000000"
      },
      {
        "date": "2025-12-29",
        "marketPrice": "375000000"
      },
      {
        "date": "2026-01-12",
        "marketPrice": "387000000"
      },
      {
        "date": "2026-01-19",
        "marketPrice": "386000000"
      },
      {
        "date": "2026-01-28",
        "marketPrice": "405000000"
      },
      {
        "date": "2026-02-03",
        "marketPrice": "413000000"
      },
      {
        "date": "2026-02-09",
        "marketPrice": "430000000"
      },
      {
        "date": "2026-02-23",
        "marketPrice": "426000000"
      }
    ]
  },
  "timestamp": "2026-04-17T11:42:12.706Z"
}
```

### `GET /api/clubs/{identifier}`

- **Summary**: 골프장 상세 조회
- **OperationId**: `ClubsController_findByIdentifier`
- **인증**: 실제로는 필요할 수 있음 (스펙상 optional, 실테스트 결과 /auth/me 등은 401 반환)

골프장 코드 또는 UUID로 상세 정보를 조회합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `identifier` | string | ✓ | 골프장 코드 (예: G_E54) 또는 UUID _예: `G_E54`_ |

#### 응답

- `200` 골프장 상세 조회 성공 → [`ClubDetailResponseDto`](#clubdetailresponsedto)
- `404` 골프장을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/clubs/IMP_CLUB_20
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "680fcded-07ec-4537-9dba-bb52d440ddfa",
    "code": "IMP_CLUB_20",
    "name": "가야",
    "companyName": "가야개발(주)",
    "region": "경남 김해시",
    "address": "경남 김해시 삼방동 산1",
    "coordinates": "35.2739318, 128.8993664",
    "registrationFee": "개인 1,100,000 / 법인 1,100,000",
    "taxOfficial": null,
    "memo": null,
    "registrationHours": null,
    "documentLink": null,
    "registrationProcedure": null,
    "dealerMemo": null,
    "membershipInfo": "없음",
    "openingDate": "1984-02-18",
    "holes": "45홀",
    "totalLength": "14,192야드",
    "memberCount": "2058",
    "cityAccessibility": null,
    "courseNames": null,
    "courseComposition": null,
    "claimFrequency": null,
    "introduction": "회원제 45홀과 대중 골프장 9홀을 완공하여 총54홀 규모의 규모의 골프장을 갖추고 있으며, 기존의 유원시설인 가야랜드,청소년연수원,수영장,테니스장 외에 자연학습장,캠프장 등이 확충된다.",
    "website": "http://www.gayacc.com/",
    "admissionAge": null,
    "operationType": "MEMBERSHIP",
    "operationTypes": [
      "MEMBERSHIP"
    ],
    "facilities": "연습장 20타석, 수영장, 연수원, 축구장, 운동장, 가야랜드",
    "stampDuty": null,
    "agencyFee": null,
    "otherCosts": null,
    "caddyFee": 130000,
    "cartFee": 90000,
    "contacts": [],
    "bankAccounts": [],
    "memberships": [
      {
        "id": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
        "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
        "membershipType": "법인",
        "membershipName": "주중-법인",
        "weekdayGreenFee": null,
        "weekendGreenFee": null,
        "reservationNotes": null,
        "weekendReservationDifficulty": null,
        "memberDaySchedule": null,
        "recentMarketPrice": null,
        "recentPriceUpdateDate": null,
        "avgMarketPrice3y": null,
        "dealerPriceRange": null,
        "minTransactionUnit": null,
        "transactionTendency": null,
        "recentTransactionType": null,
        "tradableTypeSummary": null,
        "registrationDifficulty": null,
        "additionalDocumentFrequency": null,
        "balanceRisk": null,
        "transactionRiskMemo": null,
        "isActive": true,
        "displayOrder": 0,
        "registeredPersonCount": null,
        "initialSalePrice": null,
        "initialSaleYear": null,
        "initialSaleMethod": null,
        "estimatedSalePrice": null,
        "estimatedPriceDate": null,
        "memberBenefits": null,
        "specialNotes": null,
        "transferManagerName": null,
        "transferManagerPhone": null,
        "buyerDocuments": null,
        "sellerDocuments": null,
        "createdAt": "2026-04-09T01:15:45.187Z",
        "updatedAt": "2026-04-10T06:10:25.001Z",
        "documents": []
      },
      {
        "id": "6f39d229-de86-4e46-a123-a7b918c18238",
        "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
        "membershipType": "개인",
        "membershipName": "분담금",
        "weekdayGreenFee": null,
        "weekendGreenFee": null,
        "reservationNotes": null,
        "weekendReservationDifficulty": null,
        "memberDaySchedule": null,
        "recentMarketPrice": null,
        "recentPriceUpdateDate": null,
        "avgMarketPrice3y": null,
        "dealerPriceRange": null,
        "minTransactionUnit": null,
        "transactionTendency": null,
        "recentTransactionType": null,
        "tradableTypeSummary": null,
        "registrationDifficulty": null,
        "additionalDocumentFrequency": null,
        "balanceRisk": null,
        "transactionRiskMemo": null,
        "isActive": true,
        "displayOrder": 0,
        "registeredPersonCount": null,
        "initialSalePrice": null,
        "initialSaleYear": null,
        "initialSaleMethod": null,
        "estimatedSalePrice": null,
        "estimatedPriceDate": null,
        "memberBenefits": null,
        "specialNotes": null,
        "transferManagerName": null,
        "transferManagerPhone": null,
        "buyerDocuments": null,
        "sellerDocuments": null,
        "createdAt": "2026-04-09T01:15:45.187Z",
        "updatedAt": "
... (truncated)
```

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### ClubBankAccountDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 계좌 ID _예: `770e8400-e29b-41d4-a716-446655440002`_ |
| `bankName` | string |  | 은행명 _예: `국민은행`_ |
| `accountNumber` | string |  | 계좌번호 _예: `123-456-789012`_ |
| `accountHolder` | string |  | 예금주 _예: `김포시사이드골프클럽`_ |

### ClubContactDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 연락처 ID _예: `660e8400-e29b-41d4-a716-446655440001`_ |
| `phoneNumber` | string |  | 전화번호 _예: `031-1234-5678`_ |
| `fax` | string |  | 팩스 _예: `031-1234-5679`_ |
| `email` | string |  | 이메일 _예: `info@gimposeaside.com`_ |
| `contactPerson` | string |  | 담당자 _예: `대리 김수영`_ |
| `department` | string |  | 부서 _예: `고객지원팀`_ |
| `isPrimary` | boolean | ✓ | 주 연락처 여부 _예: `True`_ |

### ClubDetailDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 골프장 ID _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `code` | string | ✓ | 골프장 코드 _예: `G_E54`_ |
| `name` | string | ✓ | 골프장 이름 _예: `김포 시사이드`_ |
| `companyName` | string |  | 회사명 _예: `김포시사이드골프장(주)`_ |
| `region` | string |  | 지역 _예: `경기 김포시`_ |
| `address` | string |  | 전체 주소 _예: `경기도 김포시 월곶면 고막리 123-45`_ |
| `coordinates` | string |  | 좌표 (위도, 경도) _예: `37.5470126, 126.7963798`_ |
| `registrationFee` | string |  | 개서료 _예: `33만원`_ |
| `taxOfficial` | string |  | 세금 정보 _예: `취득세 4.6% + 재산세 연 0.5%`_ |
| `memo` | string |  | 메모 _예: `주중회원권 별도 문의`_ |
| `registrationHours` | string |  | 명의개서 가능 시간 _예: `평일 09:00-17:00`_ |
| `documentLink` | string |  | 서류 다운로드 URL 또는 경로 _예: `https://example.com/docs/club.pdf`_ |
| `registrationProcedure` | string |  | 명의개서 절차 상세 설명 |
| `dealerMemo` | string |  | 딜러 메모 및 특이사항 |
| `membershipInfo` | string |  | 회원권 유형 및 설명 |
| `openingDate` | string |  | 골프장 개장일 _예: `2005-04-15`_ |
| `holes` | string |  | 홀 구성 _예: `회원제 18홀 + 퍼블릭 18홀`_ |
| `totalLength` | string |  | 코스 총 연장 _예: `6,585m`_ |
| `memberCount` | string |  | 총 회원 수 _예: `600명`_ |
| `cityAccessibility` | string |  | 도심 접근성 _예: `강남 기준 60분`_ |
| `courseNames` | Array&lt;string&gt; |  | 코스명 목록 _예: `['동코스', '서코스']`_ |
| `courseComposition` | string |  | 코스 구성 설명 |
| `claimFrequency` | number |  | 클레임 발생 빈도 (1-5) _예: `2`_ |
| `introduction` | string |  | 골프장 소개 |
| `website` | string |  | 골프장 공식 홈페이지 URL _예: `www.88countryclub.co.kr`_ |
| `admissionAge` | number |  | 입회 가능 최소 나이 (만 나이 기준) _예: `35`_ |
| `operationType` | `PUBLIC` \| `MEMBERSHIP` \| `CONDO` |  | 운영 형식 _예: `MEMBERSHIP`_ |
| `operationTypes` | Array&lt;`PUBLIC` \| `MEMBERSHIP` \| `CONDO`&gt; |  | 운영 형식 (하위 호환용) _예: `['MEMBERSHIP']`_ |
| `facilities` | string |  | 부대시설 정보 _예: `클럽하우스, 사우나, 레스토랑, 골프연습장`_ |
| `stampDuty` | string |  | 인지대 _예: `15만원`_ |
| `agencyFee` | string |  | 대행수수료 _예: `50만원`_ |
| `otherCosts` | string |  | 기타비용 _예: `연회비 30만원`_ |
| `caddyFee` | number |  | 캐디피 _예: `150000`_ |
| `cartFee` | number |  | 카트피 _예: `100000`_ |
| `contacts` | Array&lt;[`ClubContactDto`](#clubcontactdto)&gt; | ✓ | 연락처 목록 |
| `bankAccounts` | Array&lt;[`ClubBankAccountDto`](#clubbankaccountdto)&gt; | ✓ | 계좌 목록 |
| `memberships` | Array&lt;[`MembershipResponseDto`](#membershipresponsedto)&gt; | ✓ | 회원권 목록 |
| `scenarios` | Array&lt;[`ScenarioDocumentsItemDto`](#scenariodocumentsitemdto)&gt; | ✓ | 시나리오별 필요 서류 목록 |
| `documentsGlobal` | Array&lt;[`GlobalDocumentItemDto`](#globaldocumentitemdto)&gt; | ✓ | 전역 서류 목록 |
| `documentsCustomer` | Array&lt;[`CustomerDocumentItemDto`](#customerdocumentitemdto)&gt; | ✓ | 고객 제출 서류 목록 |
| `createdAt` | string | ✓ | 생성일시 _예: `2024-01-01T00:00:00Z`_ |
| `updatedAt` | string | ✓ | 수정일시 _예: `2024-12-01T10:30:00Z`_ |

### ClubDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 요청 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 시간 _예: `2024-12-13T12:00:00Z`_ |

### ClubListDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `clubs` | Array&lt;[`ClubListItemDto`](#clublistitemdto)&gt; | ✓ | 골프장 목록 |
| `pagination` | object | ✓ | 페이지네이션 정보 |

### ClubListItemDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 골프장 ID (UUID) _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `code` | string | ✓ | 골프장 코드 _예: `G_E54`_ |
| `name` | string | ✓ | 골프장 이름 _예: `김포 시사이드`_ |
| `companyName` | string |  | 회사명 _예: `김포시사이드골프장(주)`_ |
| `region` | string |  | 지역 _예: `경기 김포시`_ |
| `operationType` | `PUBLIC` \| `MEMBERSHIP` \| `CONDO` |  | 운영 형식 _예: `MEMBERSHIP`_ |
| `operationTypes` | Array&lt;`PUBLIC` \| `MEMBERSHIP` \| `CONDO`&gt; |  | 운영 형식 (하위 호환용) _예: `['MEMBERSHIP']`_ |
| `holes` | string |  | 홀 구성 _예: `회원제 18홀 + 퍼블릭 18홀`_ |

### ClubListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 요청 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 시간 _예: `2024-12-13T12:00:00Z`_ |

### CustomerDocumentItemDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 문서 ID _예: `bb0e8400-e29b-41d4-a716-446655440022`_ |
| `name` | string | ✓ | 문서명 _예: `위임장`_ |
| `description` | string |  | 설명 _예: `고객이 작성해야 할 위임장입니다.`_ |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### DocumentItemDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 시나리오-문서 배치 ID _예: `aa0e8400-e29b-41d4-a716-446655440020`_ |
| `clubDocumentId` | string | ✓ | 클럽/전역 문서 ID _예: `aa0e8400-e29b-41d4-a716-446655440021`_ |
| `name` | string | ✓ | 표시용 문서명 _예: `양도양수승인신청서`_ |
| `fileName` | string | ✓ | 파일명 _예: `양도양수승인신청서.pdf`_ |
| `minCount` | number | ✓ | 최소 필요 개수 _예: `1`_ |
| `unit` | string | ✓ | 단위 _예: `부`_ |
| `isMandatory` | boolean | ✓ | 필수 여부 _예: `True`_ |
| `notes` | string |  | 비고 _예: `발급일로부터 3개월 이내`_ |
| `fileDescription` | string |  | 파일 설명 _예: `발급일로부터 3개월 이내`_ |
| `downloadUrl` | string | ✓ | 서명된 다운로드 URL _예: `https://storage.googleapis.com/bucket/clubId/file.pdf?X-Goog-Algorithm=GOOG4-RSA-SHA256`_ |
| `downloadUrlExpiresAt` | string | ✓ | 다운로드 URL 만료 시각 (ISO) _예: `2026-01-04T11:12:17.000Z`_ |
| `displayOrder` | number | ✓ | 표시 순서 _예: `1`_ |

### DocumentWarningDto

| Field | Type | Required | Description |
|---|---|---|---|
| `code` | string | ✓ | 경고 코드 _예: `STORAGE_KEY_MISSING`_ |
| `message` | string | ✓ | 경고 메시지 _예: `스토리지 키가 없어 다운로드 URL을 생성할 수 없습니다.`_ |
| `clubDocumentId` | string | ✓ | 클럽 문서 ID _예: `aa0e8400-e29b-41d4-a716-446655440021`_ |
| `clubScenarioDocumentId` | string | ✓ | 시나리오-문서 배치 ID _예: `aa0e8400-e29b-41d4-a716-446655440020`_ |

### DocumentsSummaryDto

| Field | Type | Required | Description |
|---|---|---|---|
| `totalDocuments` | number | ✓ | 전체 서류 수 _예: `5`_ |
| `mandatoryDocuments` | number | ✓ | 필수 서류 수 _예: `5`_ |
| `optionalDocuments` | number | ✓ | 선택 서류 수 _예: `0`_ |

### GlobalDocumentItemDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 문서 ID _예: `aa0e8400-e29b-41d4-a716-446655440021`_ |
| `name` | string | ✓ | 표시용 문서명 _예: `인감증명서`_ |
| `fileName` | string |  | 파일명 _예: `인감증명서.pdf`_ |
| `fileDescription` | string |  | 파일 설명 _예: `발급일로부터 3개월 이내`_ |
| `downloadUrl` | string | ✓ | 서명된 다운로드 URL _예: `https://storage.googleapis.com/bucket/global/file.pdf?X-Goog-Algorithm=GOOG4-RSA-SHA256`_ |
| `downloadUrlExpiresAt` | string | ✓ | 다운로드 URL 만료 시각 (ISO) _예: `2026-01-20T12:00:00.000Z`_ |

### MarketPriceHistoryDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `membershipId` | string | ✓ | 회원권 ID _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `from` | string |  | 조회 시작일 (YYYY-MM-DD) _예: `2025-10-14`_ |
| `to` | string |  | 조회 종료일 (YYYY-MM-DD) _예: `2026-02-23`_ |
| `prices` | Array&lt;[`MarketPricePointDto`](#marketpricepointdto)&gt; | ✓ | 시세 데이터 포인트 목록 |

### MarketPriceHistoryResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 요청 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 시간 _예: `2026-02-24T10:00:00.000Z`_ |

### MarketPricePointDto

| Field | Type | Required | Description |
|---|---|---|---|
| `date` | string | ✓ | 시세 기준일 _예: `2026-02-23`_ |
| `marketPrice` | string |  | 시세 _예: `345000000`_ |

### MembershipDocumentResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 문서 ID _예: `aa0e8400-e29b-41d4-a716-446655440020`_ |
| `membershipId` | string | ✓ | 회원권 ID _예: `aa0e8400-e29b-41d4-a716-446655440021`_ |
| `name` | string |  | 문서명 _예: `회원 가입 신청서`_ |
| `fileName` | string |  | 파일명 _예: `membership_form.pdf`_ |
| `fileDescription` | string |  | 파일 설명 _예: `발급일로부터 3개월 이내`_ |
| `downloadUrl` | string |  | 다운로드 URL (Signed URL) _예: `https://storage.googleapis.com/...`_ |
| `downloadUrlExpiresAt` | string |  | 다운로드 URL 만료 시간 _예: `2026-02-09T12:00:00.000Z`_ |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### MembershipResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 회원권 ID _예: `550e8400-e29b-41d4-a716-446655440000`_ |
| `clubId` | string | ✓ | 골프장 ID |
| `membershipType` | `개인` \| `법인` | ✓ | 회원권 구분 (개인/법인) _예: `개인`_ |
| `membershipName` | string | ✓ | 회원권 타입명 _예: `정회원`_ |
| `weekdayGreenFee` | object |  | 회원 등급별 주중 그린피 _예: `{'비회원': 210000, '정회원': 68000, '가족회원': 95000}`_ |
| `weekendGreenFee` | object |  | 회원 등급별 주말 그린피 _예: `{'비회원': 260000, '정회원': 73000, '가족회원': 260000}`_ |
| `reservationNotes` | string |  | 예약 유의사항 |
| `weekendReservationDifficulty` | number |  | 주말 예약 체감 난이도 (1-5) _예: `4`_ |
| `memberDaySchedule` | string |  | 회원의 날 운영 일정 _예: `매월 2, 4주 일요일, 3대 국경일`_ |
| `reservationSystem` | object |  | 예약 시스템 정보 |
| `recentMarketPrice` | string |  | 최근 시세 _예: `150000000`_ |
| `recentPriceUpdateDate` | string |  | 최근 시세 업데이트 일자 _예: `2024-12-01`_ |
| `avgMarketPrice3y` | string |  | 3년간 평균 시세 _예: `140000000`_ |
| `dealerPriceRange` | string |  | 딜러 체감 체결가 범위 _예: `1.5억 ~ 1.8억`_ |
| `minTransactionUnit` | string |  | 거래 최소 단위 체감 _예: `500만원`_ |
| `transactionTendency` | string |  | 체결 성향 _예: `보수적`_ |
| `recentTransactionType` | string |  | 최근 거래 형태 _예: `급매`_ |
| `tradableTypeSummary` | string |  | 거래 가능 유형 요약 |
| `registrationDifficulty` | number |  | 명의개서 난이도 (1-5) _예: `3`_ |
| `additionalDocumentFrequency` | number |  | 추가서류 발생 빈도 (1-5) _예: `2`_ |
| `balanceRisk` | number |  | 잔금 리스크 (1-5) _예: `3`_ |
| `transactionRiskMemo` | string |  | 거래 리스크 상세 메모 |
| `isActive` | boolean | ✓ | 활성화 여부 _예: `True`_ |
| `displayOrder` | number | ✓ | 표시 순서 _예: `0`_ |
| `registeredPersonCount` | number |  | 회원권당 등록 가능 인원 수 _예: `1`_ |
| `initialSalePrice` | string |  | 최초 분양가 _예: `1,950만원`_ |
| `initialSaleYear` | string |  | 분양 연도 _예: `1988`_ |
| `initialSaleMethod` | string |  | 분양 방식 _예: `기부금 형식으로 입회`_ |
| `estimatedSalePrice` | string |  | 매도/매수 예상 시세 범위 _예: `3억 4,000만원 ~ 3억 4,500만원`_ |
| `estimatedPriceDate` | string |  | 예상 시세 확인 시점 _예: `2025년 03월`_ |
| `memberBenefits` | string |  | 회원 혜택 _예: `동반 할인 30%, 우선 예약권`_ |
| `specialNotes` | string |  | 특이사항 _예: `법인 회원 양도 시 이사회 결의서 필요`_ |
| `transferManagerName` | string |  | 명의개서 담당자 이름 _예: `김수영`_ |
| `transferManagerPhone` | string |  | 명의개서 담당자 전화번호 _예: `031-1234-5678`_ |
| `buyerDocuments` | string |  | 매수 서류 _예: `인감증명서 1부, 주민등록등본 1부`_ |
| `sellerDocuments` | string |  | 매도 서류 _예: `인감증명서 1부, 회원증 원본`_ |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |
| `documents` | Array&lt;[`MembershipDocumentResponseDto`](#membershipdocumentresponsedto)&gt; |  | 회원권별 추가 서류 |

### ReservationSystemResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `membershipId` | string | ✓ | 회원권 ID |
| `weekdayMethod` | string |  | 주중 예약 가능 방법 _예: `인터넷, 모바일, 전화 예약`_ |
| `weekdayAdvanceDays` | number |  | 주중 사전 예약 가능 일수 _예: `14`_ |
| `weekdayStartTime` | string |  | 주중 예약 시작 시간 _예: `09:00`_ |
| `weekdayMonthlyLimit` | number |  | 주중 월간 예약 가능 횟수 _예: `4`_ |
| `weekdaySeasonalRules` | string |  | 주중 계절별 예약 규정 |
| `weekdayNote` | string |  | 주중 예약 추가 비고 |
| `weekendMethod` | string |  | 주말 예약 가능 방법 _예: `연간 주말, 공휴일 예약일정표에 의해 인터넷 예약`_ |
| `weekendAdvanceDays` | number |  | 주말 사전 예약 가능 일수 _예: `14`_ |
| `weekendStartTime` | string |  | 주말 예약 시작 시간 _예: `09:00`_ |
| `weekendMonthlyLimit` | number |  | 주말 월간 예약 가능 횟수 _예: `1`_ |
| `weekendNote` | string |  | 주말 예약 추가 비고 |
| `memberDayMethod` | string |  | 회원의 날 예약 방법 _예: `2주 전 월요일 09시 인터넷 예약`_ |
| `memberDayAdvanceDays` | number |  | 회원의 날 사전 예약 가능 일수 _예: `14`_ |
| `memberDayStartTime` | string |  | 회원의 날 예약 시작 시간 _예: `09:00`_ |
| `memberDayWalkInHoles` | number |  | 회원의 날 도착순 운영 홀 수 _예: `18`_ |
| `memberDayNote` | string |  | 회원의 날 운영 상세 정보 |
| `prioritySystemRules` | string |  | 예약 배정 우선순위 규칙 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### ScenarioDocumentsItemDto

| Field | Type | Required | Description |
|---|---|---|---|
| `scenario` | object | ✓ | 시나리오 정보 |
| `documentsLocal` | Array&lt;[`DocumentItemDto`](#documentitemdto)&gt; | ✓ | 클럽 업로드 서류 목록 |
| `summary` | object | ✓ | 서류 요약 |
| `warnings` | Array&lt;[`DocumentWarningDto`](#documentwarningdto)&gt; |  | 다운로드 URL 생성 경고 |

### ScenarioInfoDto

| Field | Type | Required | Description |
|---|---|---|---|
| `scenarioCode` | string | ✓ | 시나리오 코드 _예: `PS_PROXY`_ |
| `name` | string | ✓ | 시나리오 이름 _예: `개인 양도자 - 대리인`_ |
| `description` | string |  | 설명 _예: `개인이 대리인을 통해 회원권을 양도하는 경우`_ |
