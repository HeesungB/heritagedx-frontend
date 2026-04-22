# Admin 회원권 API

> spec: `v1.0.0+d8345ee2` · captured: `2026-04-22`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/clubs/{clubId}/memberships` | 회원권 목록 조회 | 🔒 |
| `POST` | `/api/admin/clubs/{clubId}/memberships` | 회원권 생성 | 🔒 |
| `GET` | `/api/admin/clubs/{clubId}/memberships/{id}` | 회원권 상세 조회 | 🔒 |
| `PUT` | `/api/admin/clubs/{clubId}/memberships/{id}` | 회원권 수정 | 🔒 |
| `DELETE` | `/api/admin/clubs/{clubId}/memberships/{id}` | 회원권 삭제 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/clubs/{clubId}/memberships`

- **Summary**: 회원권 목록 조회
- **OperationId**: `AdminMembershipsController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID |

#### 응답

- `200` 회원권 목록 조회 성공 → -

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/clubs/680fcded-07ec-4537-9dba-bb52d440ddfa/memberships
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [
    {
      "id": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
      "createdAt": "2026-04-09T01:15:45.187Z",
      "updatedAt": "2026-04-10T06:10:25.001Z",
      "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
      "reservationSystem": null,
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
      "sellerDocuments": null
    },
    {
      "id": "6f39d229-de86-4e46-a123-a7b918c18238",
      "createdAt": "2026-04-09T01:15:45.187Z",
      "updatedAt": "2026-04-09T01:15:45.187Z",
      "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
      "reservationSystem": null,
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
      "sellerDocuments": null
    },
    {
      "id": "7dc78303-ffd1-4768-a550-1eb7d325a2da",
      "createdAt": "2026-04-09T01:15:45.187Z",
      "updatedAt": "2026-04-09T01:15:45.187Z",
      "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
      "reservationSystem": null,
      "membershipType": "개인",
      "membershipName": "정회원",
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
      "buyerDocuments
... (truncated)
```

### `POST /api/admin/clubs/{clubId}/memberships`

- **Summary**: 회원권 생성
- **OperationId**: `AdminMembershipsController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID |

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateMembershipDto`](#createmembershipdto)

#### 응답

- `201` 회원권 생성 성공 → -
- `409` 동일한 회원권 타입이 이미 존재함 → -

### `GET /api/admin/clubs/{clubId}/memberships/{id}`

- **Summary**: 회원권 상세 조회
- **OperationId**: `AdminMembershipsController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 회원권 ID |
| `path` | `clubId` |  | ✓ | 골프장 ID |

#### 응답

- `200` 회원권 상세 조회 성공 → -
- `404` 회원권을 찾을 수 없음 → -

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/clubs/680fcded-07ec-4537-9dba-bb52d440ddfa/memberships/0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd",
    "createdAt": "2026-04-09T01:15:45.187Z",
    "updatedAt": "2026-04-10T06:10:25.001Z",
    "clubId": "680fcded-07ec-4537-9dba-bb52d440ddfa",
    "reservationSystem": null,
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
    "sellerDocuments": null
  },
  "timestamp": "2026-04-17T11:42:12.157Z"
}
```

### `PUT /api/admin/clubs/{clubId}/memberships/{id}`

- **Summary**: 회원권 수정
- **OperationId**: `AdminMembershipsController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 회원권 ID |
| `path` | `clubId` |  | ✓ | 골프장 ID |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateMembershipDto`](#updatemembershipdto)

#### 응답

- `200` 회원권 수정 성공 → -
- `404` 회원권을 찾을 수 없음 → -
- `409` 동일한 회원권 타입이 이미 존재함 → -

### `DELETE /api/admin/clubs/{clubId}/memberships/{id}`

- **Summary**: 회원권 삭제
- **OperationId**: `AdminMembershipsController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 회원권 ID |
| `path` | `clubId` |  | ✓ | 골프장 ID |

#### 응답

- `200` 회원권 삭제 성공 → -
- `404` 회원권을 찾을 수 없음 → -
- `409` 연관된 데이터로 인해 회원권을 삭제할 수 없음 → -

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### CreateMembershipDto

| Field | Type | Required | Description |
|---|---|---|---|
| `membershipType` | `개인` \| `법인` | ✓ | 회원권 구분 (개인/법인) _예: `개인`_ |
| `membershipName` | string | ✓ | 회원권 타입명 (정회원, 평일회원 등) _예: `정회원`_ |
| `weekdayGreenFee` | object |  | 회원 등급별 주중 그린피 _예: `{'비회원': 210000, '정회원': 68000, '가족회원': 95000}`_ |
| `weekendGreenFee` | object |  | 회원 등급별 주말 그린피 _예: `{'비회원': 260000, '정회원': 73000, '가족회원': 260000}`_ |
| `reservationNotes` | string |  | 예약 유의사항 |
| `weekendReservationDifficulty` | number |  | 주말 예약 체감 난이도 (1-5) _예: `4`_ |
| `memberDaySchedule` | string |  | 회원의 날 운영 일정 _예: `매월 2, 4주 일요일, 3대 국경일`_ |
| `reservationSystem` | object |  | 예약 시스템 정보 |
| `recentMarketPrice` | string |  | 최근 시세 |
| `recentPriceUpdateDate` | string |  | 최근 시세 업데이트 일자 |
| `avgMarketPrice3y` | string |  | 3년간 평균 시세 |
| `dealerPriceRange` | string |  | 딜러 체감 체결가 범위 |
| `minTransactionUnit` | string |  | 거래 최소 단위 체감 |
| `transactionTendency` | string |  | 체결 성향 |
| `recentTransactionType` | string |  | 최근 거래 형태 |
| `tradableTypeSummary` | string |  | 거래 가능 유형 요약 |
| `registrationDifficulty` | number |  | 명의개서 난이도 (1-5) |
| `additionalDocumentFrequency` | number |  | 추가서류 발생 빈도 (1-5) |
| `balanceRisk` | number |  | 잔금 리스크 (1-5) |
| `transactionRiskMemo` | string |  | 거래 리스크 상세 메모 |
| `isActive` | boolean |  | 활성화 여부 |
| `displayOrder` | number |  | 표시 순서 |
| `registeredPersonCount` | number |  | 회원권당 등록 가능 인원 수 (1=반구좌, 2=온구좌) |
| `initialSalePrice` | string |  | 최초 분양가 |
| `initialSaleYear` | string |  | 분양 연도 |
| `initialSaleMethod` | string |  | 분양 방식 |
| `estimatedSalePrice` | string |  | 매도/매수 예상 시세 범위 |
| `estimatedPriceDate` | string |  | 예상 시세 확인 시점 |
| `memberBenefits` | string |  | 회원 혜택 _예: `동반 할인 30%, 우선 예약권`_ |
| `specialNotes` | string |  | 특이사항 _예: `법인 회원 양도 시 이사회 결의서 필요`_ |
| `transferManagerName` | string |  | 명의개서 담당자 이름 _예: `김수영`_ |
| `transferManagerPhone` | string |  | 명의개서 담당자 전화번호 _예: `031-1234-5678`_ |
| `buyerDocuments` | string |  | 매수 서류 _예: `인감증명서 1부, 주민등록등본 1부`_ |
| `sellerDocuments` | string |  | 매도 서류 _예: `인감증명서 1부, 회원증 원본`_ |

### CreateReservationSystemDto

| Field | Type | Required | Description |
|---|---|---|---|
| `weekdayMethod` | string |  | 주중 예약 가능 방법 _예: `인터넷, 모바일, 전화 예약`_ |
| `weekdayAdvanceDays` | number |  | 주중 사전 예약 가능 일수 _예: `14`_ |
| `weekdayStartTime` | string |  | 주중 예약 시작 시간 _예: `09:00`_ |
| `weekdayMonthlyLimit` | number |  | 주중 월간 예약 가능 횟수 _예: `4`_ |
| `weekdaySeasonalRules` | string |  | 주중 계절별 예약 규정 _예: `성수기(3,4,5,6,9,10,11월) 월2회, 비수기(1,2,7,8,12월) 월3회`_ |
| `weekdayNote` | string |  | 주중 예약 추가 비고 _예: `14일 이내 1회 예약 후 내장한 날부터 재예약 가능`_ |
| `weekendMethod` | string |  | 주말 예약 가능 방법 _예: `연간 주말, 공휴일 예약일정표에 의해 인터넷 예약`_ |
| `weekendAdvanceDays` | number |  | 주말 사전 예약 가능 일수 _예: `14`_ |
| `weekendStartTime` | string |  | 주말 예약 시작 시간 _예: `09:00`_ |
| `weekendMonthlyLimit` | number |  | 주말 월간 예약 가능 횟수 _예: `1`_ |
| `weekendNote` | string |  | 주말 예약 추가 비고 _예: `월 1회만 접수 가능`_ |
| `memberDayMethod` | string |  | 회원의 날 예약 방법 _예: `2주 전 월요일 09시 인터넷 예약`_ |
| `memberDayAdvanceDays` | number |  | 회원의 날 사전 예약 가능 일수 _예: `14`_ |
| `memberDayStartTime` | string |  | 회원의 날 예약 시작 시간 _예: `09:00`_ |
| `memberDayWalkInHoles` | number |  | 회원의 날 도착순 운영 홀 수 _예: `18`_ |
| `memberDayNote` | string |  | 회원의 날 운영 상세 정보 _예: `18홀 도착순 + 18홀 예약제 병행`_ |
| `prioritySystemRules` | string |  | 예약 배정 우선순위 규칙 _예: `1순위: 3개월 이상 미납장과 미당첨 동시충족
2순위: 2개월 이상 미납장과 미당첨 동시충족`_ |

### UpdateMembershipDto

| Field | Type | Required | Description |
|---|---|---|---|
| `membershipType` | `개인` \| `법인` |  | 회원권 구분 (개인/법인) _예: `개인`_ |
| `membershipName` | string |  | 회원권 타입명 (정회원, 평일회원 등) _예: `정회원`_ |
| `weekdayGreenFee` | object |  | 회원 등급별 주중 그린피 _예: `{'비회원': 210000, '정회원': 68000, '가족회원': 95000}`_ |
| `weekendGreenFee` | object |  | 회원 등급별 주말 그린피 _예: `{'비회원': 260000, '정회원': 73000, '가족회원': 260000}`_ |
| `reservationNotes` | string |  | 예약 유의사항 |
| `weekendReservationDifficulty` | number |  | 주말 예약 체감 난이도 (1-5) _예: `4`_ |
| `memberDaySchedule` | string |  | 회원의 날 운영 일정 _예: `매월 2, 4주 일요일, 3대 국경일`_ |
| `reservationSystem` | object |  | 예약 시스템 정보 |
| `recentMarketPrice` | string |  | 최근 시세 |
| `recentPriceUpdateDate` | string |  | 최근 시세 업데이트 일자 |
| `avgMarketPrice3y` | string |  | 3년간 평균 시세 |
| `dealerPriceRange` | string |  | 딜러 체감 체결가 범위 |
| `minTransactionUnit` | string |  | 거래 최소 단위 체감 |
| `transactionTendency` | string |  | 체결 성향 |
| `recentTransactionType` | string |  | 최근 거래 형태 |
| `tradableTypeSummary` | string |  | 거래 가능 유형 요약 |
| `registrationDifficulty` | number |  | 명의개서 난이도 (1-5) |
| `additionalDocumentFrequency` | number |  | 추가서류 발생 빈도 (1-5) |
| `balanceRisk` | number |  | 잔금 리스크 (1-5) |
| `transactionRiskMemo` | string |  | 거래 리스크 상세 메모 |
| `isActive` | boolean |  | 활성화 여부 |
| `displayOrder` | number |  | 표시 순서 |
| `registeredPersonCount` | number |  | 회원권당 등록 가능 인원 수 (1=반구좌, 2=온구좌) |
| `initialSalePrice` | string |  | 최초 분양가 |
| `initialSaleYear` | string |  | 분양 연도 |
| `initialSaleMethod` | string |  | 분양 방식 |
| `estimatedSalePrice` | string |  | 매도/매수 예상 시세 범위 |
| `estimatedPriceDate` | string |  | 예상 시세 확인 시점 |
| `memberBenefits` | string |  | 회원 혜택 _예: `동반 할인 30%, 우선 예약권`_ |
| `specialNotes` | string |  | 특이사항 _예: `법인 회원 양도 시 이사회 결의서 필요`_ |
| `transferManagerName` | string |  | 명의개서 담당자 이름 _예: `김수영`_ |
| `transferManagerPhone` | string |  | 명의개서 담당자 전화번호 _예: `031-1234-5678`_ |
| `buyerDocuments` | string |  | 매수 서류 _예: `인감증명서 1부, 주민등록등본 1부`_ |
| `sellerDocuments` | string |  | 매도 서류 _예: `인감증명서 1부, 회원증 원본`_ |
