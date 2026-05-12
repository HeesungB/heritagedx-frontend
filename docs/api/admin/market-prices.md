# Admin 시세 API

> spec: `v1.0.0+57563d32` · captured: `2026-05-12`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `POST` | `/api/admin/market-prices/import` | 시세 XLSX 업로드/임포트 | 🔒 |

## 엔드포인트 상세

### `POST /api/admin/market-prices/import`

- **Summary**: 시세 XLSX 업로드/임포트
- **OperationId**: `AdminMarketPricesController_import`
- **인증**: 필요 (쿠키 `hdx_access_token`)

로컬에서 업로드한 XLSX를 서버에서 바로 임포트합니다. createMissing=true면 없는 클럽/회원권을 최소 데이터로 자동 생성합니다.

#### Request Body

- Content-Type: `multipart/form-data`
- Schema: object

#### 응답

- `201` 임포트 성공 → [`AdminMarketPriceImportResponseDto`](#adminmarketpriceimportresponsedto)
- `400` 잘못된 파일 또는 요청 → [`ErrorResponseDto`](#errorresponsedto)

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### AdminMarketPriceImportDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `createMissing` | boolean | ✓ | missing 데이터 자동 생성 여부 _예: `True`_ |
| `dryRun` | boolean | ✓ | dry-run 여부 _예: `False`_ |
| `loadedClubs` | number | ✓ | 실행 전 클럽 수 _예: `8`_ |
| `loadedMemberships` | number | ✓ | 실행 전 회원권 수 _예: `18`_ |
| `processedSheets` | number | ✓ | 처리된 날짜 시트 수 _예: `16`_ |
| `skippedSheets` | Array&lt;string&gt; | ✓ | 날짜 파싱 실패로 건너뛴 시트명 목록 |
| `perSheet` | Array&lt;[`AdminMarketPriceImportSheetSummaryDto`](#adminmarketpriceimportsheetsummarydto)&gt; | ✓ | 시트별 처리 요약 |
| `summary` | object | ✓ | 전체 처리 요약 |
| `membershipsUpdatedWithLatestPrices` | number | ✓ | 최신 시세 반영 업데이트된 membership 수 _예: `142`_ |
| `unmatched` | Array&lt;string&gt; | ✓ | 매칭 실패 목록 |
| `ambiguous` | Array&lt;string&gt; | ✓ | ambiguous 목록 |

### AdminMarketPriceImportResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 요청 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 임포트 결과 |
| `timestamp` | string | ✓ | 응답 시간 _예: `2026-02-24T10:00:00.000Z`_ |

### AdminMarketPriceImportSheetSummaryDto

| Field | Type | Required | Description |
|---|---|---|---|
| `date` | string | ✓ | 시세 기준일 _예: `2026-02-23`_ |
| `rows` | number | ✓ | 해당 시트 데이터 행 수 _예: `164`_ |
| `inserted` | number | ✓ | 신규 시세 row 수 _예: `1`_ |
| `updated` | number | ✓ | 기존 시세 row 업데이트 수 _예: `10`_ |
| `createdClubs` | number | ✓ | 자동 생성된 클럽 수 _예: `3`_ |
| `createdMemberships` | number | ✓ | 자동 생성된 회원권 수 _예: `5`_ |
| `skippedNoPrice` | number | ✓ | 가격 없음으로 스킵된 수 _예: `8`_ |
| `skippedUnmatched` | number | ✓ | 매칭 실패 스킵 수 _예: `2`_ |
| `skippedAmbiguous` | number | ✓ | 중복 후보로 스킵 수 _예: `0`_ |

### AdminMarketPriceImportSummaryDto

| Field | Type | Required | Description |
|---|---|---|---|
| `inserted` | number | ✓ | 총 신규 시세 row 수 _예: `1200`_ |
| `updated` | number | ✓ | 총 업데이트 시세 row 수 _예: `340`_ |
| `createdClubs` | number | ✓ | 총 자동 생성 클럽 수 _예: `120`_ |
| `createdMemberships` | number | ✓ | 총 자동 생성 회원권 수 _예: `210`_ |
| `skippedNoPrice` | number | ✓ | 총 가격 없음 스킵 수 _예: `675`_ |
| `skippedUnmatched` | number | ✓ | 총 매칭 실패 스킵 수 _예: `12`_ |
| `skippedAmbiguous` | number | ✓ | 총 ambiguous 스킵 수 _예: `0`_ |
