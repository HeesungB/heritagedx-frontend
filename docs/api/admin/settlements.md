# Admin 입출금표 API

> spec: `v1.0.0+57563d32` · captured: `2026-05-12`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

> ↔ 공개 대응: general 측은 `consultationId` 키로 접근 (`POST/GET/PUT/DELETE /api/settlements/:consultationId`, `PATCH .../document-generated`). admin 측은 settlement 행의 `id` 키로 접근하며 목록 조회를 추가 제공한다. 두 경로는 같은 row 를 다른 키로 조회한다.

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/settlements` | [Admin] 입출금표 목록 조회 | 🔒 |
| `GET` | `/api/admin/settlements/{id}` | [Admin] 입출금표 상세 조회 | 🔒 |
| `PUT` | `/api/admin/settlements/{id}` | [Admin] 입출금표 수정 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/settlements`

- **Summary**: [Admin] 입출금표 목록 조회
- **OperationId**: `AdminSettlementsController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

ORG_ADMIN 은 소속 조직, SUPER_ADMIN 은 `organizationId` 필터로 조직별 조회.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `organizationId` | string (uuid) |  | 조직 필터 (SUPER_ADMIN 전용) |
| `query` | `consultationId` | string (uuid) |  | 연결된 상담으로 필터 |
| `query` | `membershipTradeId` | string (uuid) |  | 연결된 거래로 필터 |
| `query` | `documentGenerated` | boolean |  | 문서 생성 완료 여부로 필터 |
| `query` | `page` | number |  | 페이지 번호 (기본 1) |
| `query` | `limit` | number |  | 페이지당 항목 수 (기본 20, 최대 100) |
| `query` | `sort` | `createdAt` \| `updatedAt` |  | 정렬 기준 (기본 `createdAt`) |
| `query` | `order` | `ASC` \| `DESC` |  | 정렬 방향 (기본 `DESC`) |

#### 응답

- `200` 목록 조회 성공 → [`SettlementListResponseDto`](#settlementlistresponsedto)

### `GET /api/admin/settlements/{id}`

- **Summary**: [Admin] 입출금표 상세 조회
- **OperationId**: `AdminSettlementsController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string (uuid) | ✓ | settlement 행의 PK |

#### 응답

- `200` 상세 조회 성공 → [`SettlementDetailResponseDto`](#settlementdetailresponsedto)

### `PUT /api/admin/settlements/{id}`

- **Summary**: [Admin] 입출금표 수정
- **OperationId**: `AdminSettlementsController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string (uuid) | ✓ |  |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateSettlementDto`](#updatesettlementdto)

#### 응답

- `200` 수정 성공 → [`SettlementDetailResponseDto`](#settlementdetailresponsedto)

> `documentGenerated` / `documentGeneratedAt` / `documentGeneratedByUserId` 는 PUT 으로 변경 불가. general 측 `PATCH /api/settlements/:consultationId/document-generated` 만 사용.

---

## DTO

공통 DTO (`ApiResponseDto`, `ErrorResponseDto`, `PaginationMetaDto`) 는 [`../README.md`](../README.md) 참고.

### SettlementResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string (uuid) | ✓ | settlement row PK |
| `organizationId` | string (uuid) | ✓ | 작성 조직 |
| `createdByUserId` | string (uuid) | ✓ | 작성자 |
| `consultationId` | string (uuid) |  | 연결된 상담 (nullable) |
| `membershipTradeId` | string (uuid) |  | 연결된 거래 (nullable, `APPROVE_FIRST` 이후 세팅) |
| `documentGenerated` | boolean | ✓ | 문서 생성 완료 여부 |
| `documentGeneratedByUserId` | string (uuid) |  | 문서 생성 처리자 |
| `documentGeneratedAt` | string (date-time) |  | 문서 생성 완료 시각 |
| `membershipName` | string |  | 회원권명 |
| `tradeDate` | string (date) |  | 거래일 |
| `salesContractAmount` | number |  | 매매 계약 금액 |
| `specialNotes` | string |  | 특이사항 |
| `sellDealerId` | string (uuid) |  | 매도 담당자 (자사 user) |
| `sellName` | string |  | 매도자명 |
| `sellCompany` | string |  | 매도자 회사 |
| `sellPhone` | string |  | 매도자 연락처 |
| `sellEntityType` | `INDIVIDUAL` \| `TAXABLE_CORP` \| `NON_TAXABLE_CORP` |  | 매도 주체 유형 |
| `sellMembershipAmount` | number |  | 매도 회원권 금액 |
| `sellDepositAmount` | number |  | 매도 계약금 |
| `sellDepositDate` | string (date) |  | 매도 계약금 일자 |
| `sellCommissionAmount` | number |  | 매도 수수료 |
| `sellCommissionDate` | string (date) |  | 매도 수수료 일자 |
| `sellCommissionDeducted` | boolean | ✓ | 매도 수수료 공제 여부 |
| `sellBalanceAmount` | number |  | 매도 잔금 |
| `sellBalanceDate` | string (date) |  | 매도 잔금 일자 |
| `sellAccountHolder` | string |  | 매도 입금 예금주 |
| `sellBankName` | string |  | 매도 은행명 |
| `sellAccountNumber` | string |  | 매도 계좌번호 |
| `sellMemo` | string |  | 매도 메모 |
| `buyDealerId` | string (uuid) |  | 매수 담당자 |
| `buyName` | string |  | 매수자명 |
| `buyCompany` | string |  | 매수자 회사 |
| `buyPhone` | string |  | 매수자 연락처 |
| `buyEntityType` | `INDIVIDUAL` \| `TAXABLE_CORP` \| `NON_TAXABLE_CORP` |  | 매수 주체 유형 |
| `buyMembershipAmount` | number |  | 매수 회원권 금액 |
| `buyDepositAmount` | number |  | 매수 계약금 |
| `buyDepositDate` | string (date) |  | 매수 계약금 일자 |
| `buyCommissionAmount` | number |  | 매수 수수료 |
| `buyCommissionDate` | string (date) |  | 매수 수수료 일자 |
| `buyTransferFeeAmount` | number |  | 매수 명의이전료 |
| `buyTransferFeeDate` | string (date) |  | 매수 명의이전료 일자 |
| `buyStampTaxIncluded` | boolean | ✓ | 매수 인지세 포함 여부 |
| `buyExtraFeeAmount` | number |  | 매수 부대비용 |
| `buyExtraFeeItem` | string |  | 매수 부대비용 항목 |
| `buyExtraFeeDate` | string (date) |  | 매수 부대비용 일자 |
| `buyBalanceAmount` | number |  | 매수 잔금 |
| `buyBalanceDate` | string (date) |  | 매수 잔금 일자 |
| `buyAccountHolder` | string |  | 매수 입금 예금주 |
| `buyBankName` | string |  | 매수 은행명 |
| `buyAccountNumber` | string |  | 매수 계좌번호 |
| `buyMemo` | string |  | 매수 메모 |
| `taxInvoiceSalesAmount` | number |  | 세금계산서 매출 금액 |
| `taxInvoiceSalesReceiver` | string |  | 세금계산서 매출처 |
| `taxInvoicePurchaseAmount` | number |  | 세금계산서 매입 금액 |
| `taxInvoicePurchaseIssuer` | string |  | 세금계산서 매입처 |
| `sellRoute` | `EXISTING` \| `REFERRAL` \| `NEW_TM` \| `INQUIRY` \| `OTHER` |  | 매도 유입경로 |
| `sellRouteDetail` | string |  | 매도 유입경로 상세 |
| `buyRoute` | `EXISTING` \| `REFERRAL` \| `NEW_TM` \| `INQUIRY` \| `OTHER` |  | 매수 유입경로 |
| `buyRouteDetail` | string |  | 매수 유입경로 상세 |
| `profitSell` | number |  | 매도 수익 |
| `profitBuy` | number |  | 매수 수익 |
| `expenseAmount` | number |  | 경비 금액 |
| `expenseDetail` | string |  | 경비 내용 |
| `taxTransferRequired` | boolean |  | 양도세 신고 필요 |
| `taxTransferAmount` | number |  | 양도세 금액 |
| `taxTransferDeadline` | string (date) |  | 양도세 기한 |
| `taxTransferCompletedAt` | string (date-time) |  | 양도세 신고 완료 시각 |
| `taxAcquisitionRequired` | boolean |  | 취득세 신고 필요 |
| `taxAcquisitionAmount` | number |  | 취득세 금액 |
| `taxAcquisitionDeadline` | string (date) |  | 취득세 기한 |
| `taxAcquisitionCompletedAt` | string (date-time) |  | 취득세 신고 완료 시각 |
| `createdByName` | string | ✓ | 작성자 이름 |
| `documentGeneratedByName` | string |  | 문서 생성 처리자 이름 |
| `createdAt` | string (date-time) | ✓ |  |
| `updatedAt` | string (date-time) | ✓ |  |

### UpdateSettlementDto

`SettlementResponseDto` 와 동일한 필드들이 모두 optional 로 노출되며, 다음만 예외:

- 변경 가능: `consultationId`, 모든 매도/매수/세금/유입경로/수익/경비/세무 필드
- 변경 불가 (서버가 무시 또는 거부): `id`, `organizationId`, `createdByUserId`, `createdByName`, `createdAt`, `updatedAt`, `documentGenerated`, `documentGeneratedAt`, `documentGeneratedByUserId`, `documentGeneratedByName`

### SettlementListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ |  |
| `data` | object | ✓ | `{ settlements: SettlementResponseDto[], pagination: PaginationMetaDto }` |
| `timestamp` | string (date-time) | ✓ |  |

### SettlementDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ |  |
| `data` | [`SettlementResponseDto`](#settlementresponsedto) | ✓ |  |
| `timestamp` | string (date-time) | ✓ |  |
