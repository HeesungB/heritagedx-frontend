# Admin 골프장/시나리오 API

> spec: `v1.0.0+15ac42bd` · captured: `2026-04-17`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

> ↔ 공개 대응: [../clubs.md](../clubs.md)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `POST` | `/api/admin/clubs` | 골프장 생성 | 🔒 |
| `GET` | `/api/admin/clubs/{clubId}/scenarios` | 골프장의 시나리오 목록 조회 | 🔒 |
| `GET` | `/api/admin/clubs/{clubId}/scenarios/{scenarioId}/documents` | 골프장-시나리오별 필요서류 목록 | 🔒 |
| `POST` | `/api/admin/clubs/{clubId}/scenarios/{scenarioId}/documents` | 골프장-시나리오에 필요서류 추가 | 🔒 |
| `PUT` | `/api/admin/clubs/{clubId}/scenarios/{scenarioId}/documents/{clubDocumentId}` | 골프장-시나리오 필요서류 설정 수정 | 🔒 |
| `DELETE` | `/api/admin/clubs/{clubId}/scenarios/{scenarioId}/documents/{clubDocumentId}` | 골프장-시나리오 필요서류 제거 | 🔒 |
| `PUT` | `/api/admin/clubs/{id}` | 골프장 수정 | 🔒 |
| `DELETE` | `/api/admin/clubs/{id}` | 골프장 삭제 | 🔒 |
| `GET` | `/api/admin/scenarios` | 시나리오 목록 조회 | 🔒 |
| `GET` | `/api/admin/scenarios/{id}` | 시나리오 상세 조회 | 🔒 |

## 엔드포인트 상세

### `POST /api/admin/clubs`

- **Summary**: 골프장 생성
- **OperationId**: `AdminClubsController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

새로운 골프장 등록

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateClubDto`](#createclubdto)

#### 응답

- `201` 골프장 생성 성공 → [`AdminClubDetailResponseDto`](#adminclubdetailresponsedto)
- `400` 잘못된 요청 (중복 코드 등) → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/admin/clubs/{clubId}/scenarios`

- **Summary**: 골프장의 시나리오 목록 조회
- **OperationId**: `AdminClubsController_findClubScenarios`
- **인증**: 필요 (쿠키 `hdx_access_token`)

특정 골프장에 연결된 시나리오 목록

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |

#### 응답

- `200` 시나리오 목록 조회 성공 → -

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/clubs/680fcded-07ec-4537-9dba-bb52d440ddfa/scenarios
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [],
  "timestamp": "2026-04-17T11:39:57.853Z"
}
```

### `GET /api/admin/clubs/{clubId}/scenarios/{scenarioId}/documents`

- **Summary**: 골프장-시나리오별 필요서류 목록
- **OperationId**: `AdminClubsController_findClubScenarioDocuments`
- **인증**: 필요 (쿠키 `hdx_access_token`)

특정 골프장-시나리오 조합에 필요한 서류 목록

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `scenarioId` | string | ✓ | 시나리오 ID (UUID) |

#### 응답

- `200` 필요서류 목록 조회 성공 → [`AdminClubScenarioDocumentListResponseDto`](#adminclubscenariodocumentlistresponsedto)

> 실호출 샘플 없음 (데이터 부재 또는 권한 문제로 수집 불가). 스펙 스키마 참고.

### `POST /api/admin/clubs/{clubId}/scenarios/{scenarioId}/documents`

- **Summary**: 골프장-시나리오에 필요서류 추가
- **OperationId**: `AdminClubsController_createClubScenarioDocument`
- **인증**: 필요 (쿠키 `hdx_access_token`)

특정 골프장-시나리오 조합에 필요한 서류 추가

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `scenarioId` | string | ✓ | 시나리오 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateClubScenarioDocumentDto`](#createclubscenariodocumentdto)

#### 응답

- `201` 필요서류 추가 성공 → -

### `PUT /api/admin/clubs/{clubId}/scenarios/{scenarioId}/documents/{clubDocumentId}`

- **Summary**: 골프장-시나리오 필요서류 설정 수정
- **OperationId**: `AdminClubsController_updateClubScenarioDocument`
- **인증**: 필요 (쿠키 `hdx_access_token`)

필요서류 설정 수정 (개수, 필수 여부, 비고 등)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `scenarioId` | string | ✓ | 시나리오 ID (UUID) |
| `path` | `clubDocumentId` | string | ✓ | 클럽 문서 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateClubScenarioDocumentDto`](#updateclubscenariodocumentdto)

#### 응답

- `200` 설정 수정 성공 → -

### `DELETE /api/admin/clubs/{clubId}/scenarios/{scenarioId}/documents/{clubDocumentId}`

- **Summary**: 골프장-시나리오 필요서류 제거
- **OperationId**: `AdminClubsController_removeClubScenarioDocument`
- **인증**: 필요 (쿠키 `hdx_access_token`)

필요서류 목록에서 제거

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `scenarioId` | string | ✓ | 시나리오 ID (UUID) |
| `path` | `clubDocumentId` | string | ✓ | 클럽 문서 ID (UUID) |

#### 응답

- `200` 필요서류 제거 성공 → -

### `PUT /api/admin/clubs/{id}`

- **Summary**: 골프장 수정
- **OperationId**: `AdminClubsController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

골프장 정보 수정

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 골프장 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateClubDto`](#updateclubdto)

#### 응답

- `200` 골프장 수정 성공 → [`AdminClubDetailResponseDto`](#adminclubdetailresponsedto)
- `404` 골프장을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/admin/clubs/{id}`

- **Summary**: 골프장 삭제
- **OperationId**: `AdminClubsController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

골프장 삭제 (연관된 연락처, 계좌, 시나리오 연결도 함께 삭제)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 골프장 ID (UUID) |

#### 응답

- `200` 골프장 삭제 성공 → -
- `404` 골프장을 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)
- `409` 연관된 데이터로 인해 골프장을 삭제할 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/admin/scenarios`

- **Summary**: 시나리오 목록 조회
- **OperationId**: `AdminScenariosController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

페이지네이션과 필터를 지원하는 시나리오 목록 조회

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `page` | number |  | 페이지 번호 |
| `query` | `limit` | number |  | 페이지당 항목 수 (최대 100) |
| `query` | `search` | string |  | 검색어 (시나리오명, 코드) |
| `query` | `side` | `Buyer` \| `Seller` |  | Side 필터 (Buyer/Seller) |
| `query` | `ownerType` | `Personal` \| `Corporate` \| `Family` \| `Special` \| `All` |  | 소유자 유형 필터 |
| `query` | `isActive` | boolean |  | 활성화 상태 필터 |

#### 응답

- `200` 시나리오 목록 조회 성공 → [`AdminScenarioListResponseDto`](#adminscenariolistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/scenarios?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [
    {
      "id": "d10148e2-85d6-4d1f-889f-bc3edcda2096",
      "scenarioCode": "PS_BASIC",
      "name": "개인 양도자 - 기본",
      "description": "",
      "side": "Seller",
      "ownerType": "Personal",
      "hasProxy": false,
      "isCertificateLost": false,
      "isFamily": false,
      "requiresTaxInvoice": false,
      "displayOrder": 1,
      "isActive": true,
      "createdAt": "2025-12-18T18:45:52.896Z",
      "updatedAt": "2026-02-16T02:33:59.445Z"
    },
    {
      "id": "b3cc663e-c928-43ac-98cc-4dea3a441704",
      "scenarioCode": "PB_BASIC",
      "name": "개인 양수자 - 기본",
      "description": "",
      "side": "Buyer",
      "ownerType": "Personal",
      "hasProxy": false,
      "isCertificateLost": false,
      "isFamily": false,
      "requiresTaxInvoice": false,
      "displayOrder": 9,
      "isActive": true,
      "createdAt": "2025-12-18T18:45:52.896Z",
      "updatedAt": "2026-02-16T02:33:59.445Z"
    },
    {
      "id": "2daff0c3-b9ff-4da1-a89a-51389162eaa5",
      "scenarioCode": "CS_BASIC",
      "name": "법인 양도자 - 기본",
      "description": "",
      "side": "Seller",
      "ownerType": "Corporate",
      "hasProxy": false,
      "isCertificateLost": false,
      "isFamily": false,
      "requiresTaxInvoice": false,
      "displayOrder": 17,
      "isActive": true,
      "createdAt": "2025-12-18T18:45:52.896Z",
      "updatedAt": "2026-02-16T02:33:59.445Z"
    }
  ],
  "meta": {
    "total": 4,
    "page": 1,
    "limit": 3,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-04-17T11:38:11.333Z"
}
```

### `GET /api/admin/scenarios/{id}`

- **Summary**: 시나리오 상세 조회
- **OperationId**: `AdminScenariosController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

시나리오 ID로 상세 정보 조회

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 시나리오 ID (UUID) |

#### 응답

- `200` 시나리오 상세 조회 성공 → [`AdminScenarioDetailResponseDto`](#adminscenariodetailresponsedto)
- `404` 시나리오를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/scenarios/d10148e2-85d6-4d1f-889f-bc3edcda2096
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "d10148e2-85d6-4d1f-889f-bc3edcda2096",
    "scenarioCode": "PS_BASIC",
    "name": "개인 양도자 - 기본",
    "description": "",
    "side": "Seller",
    "ownerType": "Personal",
    "hasProxy": false,
    "isCertificateLost": false,
    "isFamily": false,
    "requiresTaxInvoice": false,
    "displayOrder": 1,
    "isActive": true,
    "createdAt": "2025-12-18T18:45:52.896Z",
    "updatedAt": "2026-02-16T02:33:59.445Z"
  },
  "timestamp": "2026-04-17T11:38:16.667Z"
}
```

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### AdminClubBankAccountDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `bankName` | string |  | 은행명 _예: `국민은행`_ |
| `accountNumber` | string |  | 계좌번호 _예: `123-456-789012`_ |
| `accountHolder` | string |  | 예금주 _예: `골프클럽`_ |
| `rawInfo` | string |  | 원본 정보 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### AdminClubContactDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `phoneNumber` | string |  | 전화번호 _예: `031-1234-5678`_ |
| `fax` | string |  | 팩스 _예: `031-1234-5679`_ |
| `email` | string |  | 이메일 _예: `info@golf.com`_ |
| `contactPerson` | string |  | 담당자 _예: `대리 김수영`_ |
| `department` | string |  | 부서 _예: `고객지원팀`_ |
| `isPrimary` | boolean | ✓ | 주 연락처 여부 _예: `True`_ |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### AdminClubDetailDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `code` | string | ✓ | 골프장 코드 _예: `G_E54`_ |
| `name` | string | ✓ | 골프장 이름 _예: `김포 시사이드`_ |
| `region` | string |  | 지역 _예: `경기 김포시`_ |
| `address` | string |  | 전체 주소 |
| `coordinates` | string |  | 좌표 (위도, 경도) _예: `37.5470126, 126.7963798`_ |
| `registrationFee` | string |  | 개서료 _예: `33만원`_ |
| `taxOfficialRaw` | string |  | 세금 정보 (원본) |
| `memo` | string |  | 메모 |
| `registrationHours` | string |  | 명의개서 가능 시간 _예: `평일 09:00-17:00`_ |
| `documentLink` | string |  | 서류 다운로드 URL 또는 경로 _예: `https://example.com/docs/club.pdf`_ |
| `registrationProcedure` | string |  | 명의개서 절차 상세 설명 |
| `dealerMemo` | string |  | 딜러 메모 및 특이사항 |
| `membershipInfo` | string |  | 회원권 유형 및 설명 |
| `openingDate` | string (date-time) |  | 골프장 개장일 _예: `2005-04-15`_ |
| `holes` | string |  | 홀 구성 _예: `회원제 18홀 + 퍼블릭 18홀`_ |
| `totalLength` | string |  | 코스 총 연장 _예: `6,585m`_ |
| `memberCount` | string |  | 총 회원 수 _예: `600명`_ |
| `cityAccessibility` | string |  | 도심 접근성 _예: `강남 기준 60분`_ |
| `courseNames` | Array&lt;string&gt; |  | 코스명 목록 _예: `['동코스', '서코스']`_ |
| `courseComposition` | string |  | 코스 구성 설명 |
| `claimFrequency` | number |  | 클레임 발생 빈도 (1-5) _예: `2`_ |
| `website` | string |  | 골프장 공식 홈페이지 URL _예: `www.88countryclub.co.kr`_ |
| `operatorCompany` | string |  | 골프장 운영 회사명 _예: `88관광개발`_ |
| `admissionAge` | number |  | 입회 가능 최소 나이 (만 나이 기준) _예: `35`_ |
| `introduction` | string |  | 골프장 소개 |
| `caddyFee` | number |  | 캐디피 _예: `150000`_ |
| `cartFee` | number |  | 카트피 _예: `100000`_ |
| `facilities` | string |  | 부대시설 정보 _예: `클럽하우스, 사우나, 레스토랑, 골프연습장`_ |
| `operationType` | `PUBLIC` \| `MEMBERSHIP` \| `CONDO` |  | 운영 형식 _예: `MEMBERSHIP`_ |
| `operationTypes` | Array&lt;`PUBLIC` \| `MEMBERSHIP` \| `CONDO`&gt; |  | 운영 형식 (하위 호환용) _예: `['MEMBERSHIP']`_ |
| `stampDuty` | string |  | 인지대 _예: `15만원`_ |
| `agencyFee` | string |  | 대행수수료 _예: `50만원`_ |
| `otherCosts` | string |  | 기타비용 _예: `연회비 30만원`_ |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |
| `contacts` | Array&lt;[`AdminClubContactDto`](#adminclubcontactdto)&gt; | ✓ | 연락처 목록 |
| `bankAccounts` | Array&lt;[`AdminClubBankAccountDto`](#adminclubbankaccountdto)&gt; | ✓ | 계좌 목록 |
| `memberships` | Array&lt;[`AdminMembershipDto`](#adminmembershipdto)&gt; | ✓ | 회원권 목록 |

### AdminClubDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 골프장 상세 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminClubScenarioDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `clubId` | string | ✓ | 골프장 ID |
| `scenarioId` | string | ✓ | 시나리오 ID |
| `clubDocumentId` | string | ✓ | 클럽 문서 ID |
| `name` | string |  | 표시용 문서명 _예: `양도양수승인신청서`_ |
| `fileName` | string |  | 파일명 _예: `양도양수승인신청서.pdf`_ |
| `fileDescription` | string |  | 파일 설명 _예: `발급일로부터 3개월 이내`_ |
| `minCount` | number | ✓ | 최소 필요 개수 _예: `1`_ |
| `unit` | `부` \| `매` \| `통` | ✓ | 단위 _예: `부`_ |
| `isMandatory` | boolean | ✓ | 필수 여부 _예: `True`_ |
| `notes` | string |  | 비고 _예: `발급일로부터 3개월 이내`_ |
| `displayOrder` | number | ✓ | 표시 순서 _예: `1`_ |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### AdminClubScenarioDocumentListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | Array&lt;[`AdminClubScenarioDocumentDto`](#adminclubscenariodocumentdto)&gt; | ✓ | 필요서류 목록 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminMembershipDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `clubId` | string | ✓ | 골프장 ID |
| `membershipType` | `개인` \| `법인` | ✓ | 회원권 구분 (개인/법인) _예: `개인`_ |
| `membershipName` | string | ✓ | 회원권 타입명 (정회원, 평일회원 등) _예: `정회원`_ |
| `weekdayGreenFee` | object |  | 회원 등급별 주중 그린피 _예: `{'member': 120000, 'guest': 200000}`_ |
| `weekendGreenFee` | object |  | 회원 등급별 주말 그린피 _예: `{'member': 180000, 'guest': 280000}`_ |
| `reservationNotes` | string |  | 예약 유의사항 |
| `weekendReservationDifficulty` | number |  | 주말 예약 체감 난이도 (1-5) _예: `4`_ |
| `memberDaySchedule` | string |  | 회원의 날 운영 일정 _예: `매월 2, 4주 일요일, 3대 국경일`_ |
| `reservationSystem` | object |  | 예약 시스템 정보 |
| `recentMarketPrice` | string |  | 최근 시세 _예: `150000000`_ |
| `recentPriceUpdateDate` | string (date-time) |  | 최근 시세 업데이트 일자 _예: `2024-12-01`_ |
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

### AdminScenarioDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 시나리오 상세 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminScenarioDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `scenarioCode` | string | ✓ | 시나리오 코드 _예: `PS_BASIC`_ |
| `name` | string | ✓ | 시나리오 이름 _예: `개인 양도자 - 기본`_ |
| `description` | string |  | 설명 |
| `side` | `Buyer` \| `Seller` | ✓ | Side _예: `Seller`_ |
| `ownerType` | `Personal` \| `Corporate` \| `Family` \| `Special` \| `All` | ✓ | 소유자 유형 _예: `Personal`_ |
| `hasProxy` | boolean | ✓ | 대리인 사용 여부 _예: `False`_ |
| `isCertificateLost` | boolean | ✓ | 회원증 분실 여부 _예: `False`_ |
| `transferStructure` | `Withdraw` \| `Abandon` |  | 양도 구조 |
| `isFamily` | boolean | ✓ | 가족 간 양도 여부 _예: `False`_ |
| `requiresTaxInvoice` | boolean | ✓ | 세금계산서 발행 필요 여부 _예: `False`_ |
| `displayOrder` | number | ✓ | 표시 순서 _예: `1`_ |
| `isActive` | boolean | ✓ | 활성화 여부 _예: `True`_ |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### AdminScenarioListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | Array&lt;[`AdminScenarioDto`](#adminscenariodto)&gt; | ✓ | 시나리오 목록 |
| `meta` | object | ✓ | 페이지네이션 정보 |
| `timestamp` | string | ✓ | 응답 시간 |

### CreateClubDto

| Field | Type | Required | Description |
|---|---|---|---|
| `code` | string | ✓ | 골프장 코드 _예: `G_NEW01`_ |
| `name` | string | ✓ | 골프장 이름 _예: `신규 골프장`_ |
| `companyName` | string |  | 회사명 _예: `신규골프장(주)`_ |
| `region` | string |  | 지역 _예: `경기 김포시`_ |
| `address` | string |  | 전체 주소 _예: `경기도 김포시 월곶면 고막리 123-45`_ |
| `coordinates` | string |  | 좌표 (위도, 경도) _예: `37.5470126, 126.7963798`_ |
| `registrationFee` | string |  | 개서료 _예: `33만원`_ |
| `taxOfficialRaw` | string |  | 세금 정보 (원본) _예: `취득세 4.6% + 재산세 연 0.5%`_ |
| `memo` | string |  | 메모 |
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
| `website` | string |  | 골프장 공식 홈페이지 URL _예: `www.88countryclub.co.kr`_ |
| `operatorCompany` | string |  | 골프장 운영 회사명 _예: `88관광개발`_ |
| `admissionAge` | number |  | 입회 가능 최소 나이 (만 나이 기준) _예: `35`_ |
| `introduction` | string |  | 골프장 소개 |
| `facilities` | string |  | 부대시설 정보 _예: `클럽하우스, 사우나, 레스토랑, 골프연습장`_ |
| `operationTypes` | `PUBLIC` \| `MEMBERSHIP` \| `CONDO` |  | 운영 형식 _예: `MEMBERSHIP`_ |
| `stampDuty` | string |  | 인지대 _예: `15만원`_ |
| `agencyFee` | string |  | 대행수수료 _예: `50만원`_ |
| `otherCosts` | string |  | 기타비용 _예: `연회비 30만원`_ |
| `caddyFee` | number |  | 캐디피 _예: `150000`_ |
| `cartFee` | number |  | 카트피 _예: `100000`_ |

### CreateClubScenarioDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `clubDocumentId` | string (uuid) | ✓ | 클럽 문서 ID |
| `minCount` | number |  | 최소 필요 개수 _예: `1`_ |
| `unit` | `부` \| `매` \| `통` |  | 단위 _예: `부`_ |
| `isMandatory` | boolean |  | 필수 여부 _예: `True`_ |
| `notes` | string |  | 비고 _예: `발급일로부터 3개월 이내`_ |
| `displayOrder` | number |  | 표시 순서 _예: `0`_ |

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

### UpdateClubDto

| Field | Type | Required | Description |
|---|---|---|---|
| `code` | string |  | 골프장 코드 _예: `G_NEW01`_ |
| `name` | string |  | 골프장 이름 _예: `신규 골프장`_ |
| `companyName` | string |  | 회사명 _예: `신규골프장(주)`_ |
| `region` | string |  | 지역 _예: `경기 김포시`_ |
| `address` | string |  | 전체 주소 _예: `경기도 김포시 월곶면 고막리 123-45`_ |
| `coordinates` | string |  | 좌표 (위도, 경도) _예: `37.5470126, 126.7963798`_ |
| `registrationFee` | string |  | 개서료 _예: `33만원`_ |
| `taxOfficialRaw` | string |  | 세금 정보 (원본) _예: `취득세 4.6% + 재산세 연 0.5%`_ |
| `memo` | string |  | 메모 |
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
| `website` | string |  | 골프장 공식 홈페이지 URL _예: `www.88countryclub.co.kr`_ |
| `operatorCompany` | string |  | 골프장 운영 회사명 _예: `88관광개발`_ |
| `admissionAge` | number |  | 입회 가능 최소 나이 (만 나이 기준) _예: `35`_ |
| `introduction` | string |  | 골프장 소개 |
| `facilities` | string |  | 부대시설 정보 _예: `클럽하우스, 사우나, 레스토랑, 골프연습장`_ |
| `operationTypes` | `PUBLIC` \| `MEMBERSHIP` \| `CONDO` |  | 운영 형식 _예: `MEMBERSHIP`_ |
| `stampDuty` | string |  | 인지대 _예: `15만원`_ |
| `agencyFee` | string |  | 대행수수료 _예: `50만원`_ |
| `otherCosts` | string |  | 기타비용 _예: `연회비 30만원`_ |
| `caddyFee` | number |  | 캐디피 _예: `150000`_ |
| `cartFee` | number |  | 카트피 _예: `100000`_ |

### UpdateClubScenarioDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `minCount` | number |  | 최소 필요 개수 _예: `1`_ |
| `unit` | `부` \| `매` \| `통` |  | 단위 _예: `부`_ |
| `isMandatory` | boolean |  | 필수 여부 _예: `True`_ |
| `notes` | string |  | 비고 _예: `발급일로부터 3개월 이내`_ |
| `displayOrder` | number |  | 표시 순서 _예: `0`_ |
