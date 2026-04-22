# Admin 문서 API

> spec: `v1.0.0+d8345ee2` · captured: `2026-04-22`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/clubs/{clubId}/customer-documents` | 고객 구비 문서 목록 조회 | 🔒 |
| `POST` | `/api/admin/clubs/{clubId}/customer-documents` | 고객 구비 문서 생성 | 🔒 |
| `GET` | `/api/admin/clubs/{clubId}/customer-documents/{id}` | 고객 구비 문서 상세 조회 | 🔒 |
| `PUT` | `/api/admin/clubs/{clubId}/customer-documents/{id}` | 고객 구비 문서 수정 | 🔒 |
| `DELETE` | `/api/admin/clubs/{clubId}/customer-documents/{id}` | 고객 구비 문서 삭제 | 🔒 |
| `GET` | `/api/admin/clubs/{clubId}/documents` | 클럽 문서 목록 조회 | 🔒 |
| `POST` | `/api/admin/clubs/{clubId}/documents` | 클럽 문서 생성 | 🔒 |
| `GET` | `/api/admin/clubs/{clubId}/documents/{id}` | 클럽 문서 상세 조회 | 🔒 |
| `PUT` | `/api/admin/clubs/{clubId}/documents/{id}` | 클럽 문서 수정 | 🔒 |
| `DELETE` | `/api/admin/clubs/{clubId}/documents/{id}` | 클럽 문서 삭제 | 🔒 |
| `GET` | `/api/admin/clubs/{clubId}/documents/{id}/download-url` | 클럽 문서 다운로드 URL 발급 | 🔒 |
| `GET` | `/api/admin/clubs/{clubId}/memberships/{membershipId}/documents` | 회원권별 문서 목록 조회 | 🔒 |
| `POST` | `/api/admin/clubs/{clubId}/memberships/{membershipId}/documents` | 회원권 문서 생성 | 🔒 |
| `GET` | `/api/admin/clubs/{clubId}/memberships/{membershipId}/documents/{id}` | 회원권 문서 상세 조회 | 🔒 |
| `PUT` | `/api/admin/clubs/{clubId}/memberships/{membershipId}/documents/{id}` | 회원권 문서 수정 | 🔒 |
| `DELETE` | `/api/admin/clubs/{clubId}/memberships/{membershipId}/documents/{id}` | 회원권 문서 삭제 | 🔒 |
| `GET` | `/api/admin/clubs/{clubId}/memberships/{membershipId}/documents/{id}/download-url` | 회원권 문서 다운로드 URL 발급 | 🔒 |
| `GET` | `/api/admin/global-documents` | 전역 문서 목록 조회 | 🔒 |
| `POST` | `/api/admin/global-documents` | 전역 문서 생성 | 🔒 |
| `GET` | `/api/admin/global-documents/{id}` | 전역 문서 상세 조회 | 🔒 |
| `PUT` | `/api/admin/global-documents/{id}` | 전역 문서 수정 | 🔒 |
| `DELETE` | `/api/admin/global-documents/{id}` | 전역 문서 삭제 | 🔒 |
| `GET` | `/api/admin/global-documents/{id}/download-url` | 전역 문서 다운로드 URL 발급 | 🔒 |
| `PUT` | `/api/admin/global-documents/{id}/file` | 전역 문서 파일 교체 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/clubs/{clubId}/customer-documents`

- **Summary**: 고객 구비 문서 목록 조회
- **OperationId**: `AdminCustomerDocumentsController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

페이지네이션과 검색을 지원하는 고객 구비 문서 목록 조회

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `query` | `page` | number |  | 페이지 번호 |
| `query` | `limit` | number |  | 페이지당 항목 수 (최대 100) |
| `query` | `search` | string |  | 검색어 (문서명, 설명) |

#### 응답

- `200` 고객 구비 문서 목록 조회 성공 → [`AdminCustomerDocumentListResponseDto`](#admincustomerdocumentlistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/clubs/680fcded-07ec-4537-9dba-bb52d440ddfa/customer-documents
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2026-04-17T11:39:58.234Z"
}
```

### `POST /api/admin/clubs/{clubId}/customer-documents`

- **Summary**: 고객 구비 문서 생성
- **OperationId**: `AdminCustomerDocumentsController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

고객 제출용 문서를 생성합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateCustomerDocumentDto`](#createcustomerdocumentdto)

#### 응답

- `201` 고객 구비 문서 생성 성공 → [`AdminCustomerDocumentDetailResponseDto`](#admincustomerdocumentdetailresponsedto)

### `GET /api/admin/clubs/{clubId}/customer-documents/{id}`

- **Summary**: 고객 구비 문서 상세 조회
- **OperationId**: `AdminCustomerDocumentsController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

고객 구비 문서 ID로 상세 정보를 조회합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `id` | string | ✓ | 고객 구비 문서 ID (UUID) |

#### 응답

- `200` 고객 구비 문서 상세 조회 성공 → [`AdminCustomerDocumentDetailResponseDto`](#admincustomerdocumentdetailresponsedto)
- `404` 고객 구비 문서를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/clubs/91073f24-9f8f-4f07-ab71-cab7f2825480/customer-documents/50381876-b2ac-4850-86b3-cfad20214372
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "50381876-b2ac-4850-86b3-cfad20214372",
    "clubId": "91073f24-9f8f-4f07-ab71-cab7f2825480",
    "name": "test1",
    "description": "teststse",
    "createdAt": "2026-01-21T04:52:55.035Z",
    "updatedAt": "2026-01-21T04:53:02.176Z"
  },
  "timestamp": "2026-04-17T11:42:11.941Z"
}
```

### `PUT /api/admin/clubs/{clubId}/customer-documents/{id}`

- **Summary**: 고객 구비 문서 수정
- **OperationId**: `AdminCustomerDocumentsController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

고객 제출용 문서를 수정합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `id` | string | ✓ | 고객 구비 문서 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateCustomerDocumentDto`](#updatecustomerdocumentdto)

#### 응답

- `200` 고객 구비 문서 수정 성공 → [`AdminCustomerDocumentDetailResponseDto`](#admincustomerdocumentdetailresponsedto)
- `404` 고객 구비 문서를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/admin/clubs/{clubId}/customer-documents/{id}`

- **Summary**: 고객 구비 문서 삭제
- **OperationId**: `AdminCustomerDocumentsController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

고객 제출용 문서를 삭제합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `id` | string | ✓ | 고객 구비 문서 ID (UUID) |

#### 응답

- `200` 고객 구비 문서 삭제 성공 → -
- `404` 고객 구비 문서를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/admin/clubs/{clubId}/documents`

- **Summary**: 클럽 문서 목록 조회
- **OperationId**: `AdminDocumentsController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

페이지네이션과 검색을 지원하는 클럽 문서 목록 조회

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `query` | `page` | number |  | 페이지 번호 |
| `query` | `limit` | number |  | 페이지당 항목 수 (최대 100) |
| `query` | `search` | string |  | 검색어 (파일명) |
| `query` | `excludeScenarioId` | string |  | 해당 시나리오에 이미 배치된 문서는 제외 |

#### 응답

- `200` 서류 목록 조회 성공 → [`AdminDocumentListResponseDto`](#admindocumentlistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/clubs/680fcded-07ec-4537-9dba-bb52d440ddfa/documents
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2026-04-17T11:39:58.046Z"
}
```

### `POST /api/admin/clubs/{clubId}/documents`

- **Summary**: 클럽 문서 생성
- **OperationId**: `AdminDocumentsController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

클럽에 업로드된 문서 등록

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |

#### Request Body

- Content-Type: `multipart/form-data`
- Schema: object

#### 응답

- `201` 서류 생성 성공 → [`AdminDocumentDetailResponseDto`](#admindocumentdetailresponsedto)
- `400` 잘못된 요청 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/admin/clubs/{clubId}/documents/{id}`

- **Summary**: 클럽 문서 상세 조회
- **OperationId**: `AdminDocumentsController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

클럽 문서 ID로 상세 정보 조회

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `id` | string | ✓ | 클럽 문서 ID (UUID) |

#### 응답

- `200` 서류 상세 조회 성공 → [`AdminDocumentDetailResponseDto`](#admindocumentdetailresponsedto)
- `404` 서류를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/clubs/91073f24-9f8f-4f07-ab71-cab7f2825480/documents/50ca481b-924c-4974-b8f4-ab77b29b5cfa
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "50ca481b-924c-4974-b8f4-ab77b29b5cfa",
    "clubId": "91073f24-9f8f-4f07-ab71-cab7f2825480",
    "name": "입회신청서(원본 사본제출불가)",
    "fileName": "입회신청서(원본_사본제출불가).pdf",
    "fileDescription": "입회신청서(원본 사본제출불가)",
    "storageKey": "91073f24-9f8f-4f07-ab71-cab7f2825480/2026010-****-****______________________________________.pdf",
    "createdAt": "2026-01-07T14:51:19.633Z",
    "updatedAt": "2026-02-16T02:33:59.445Z"
  },
  "timestamp": "2026-04-17T11:42:11.446Z"
}
```

### `PUT /api/admin/clubs/{clubId}/documents/{id}`

- **Summary**: 클럽 문서 수정
- **OperationId**: `AdminDocumentsController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

클럽 문서 정보 수정

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `id` | string | ✓ | 클럽 문서 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateDocumentDto`](#updatedocumentdto)

#### 응답

- `200` 서류 수정 성공 → [`AdminDocumentDetailResponseDto`](#admindocumentdetailresponsedto)
- `404` 클럽 문서를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/admin/clubs/{clubId}/documents/{id}`

- **Summary**: 클럽 문서 삭제
- **OperationId**: `AdminDocumentsController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

클럽 문서 삭제 (연관된 골프장-시나리오 문서 배치도 함께 삭제)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `id` | string | ✓ | 클럽 문서 ID (UUID) |

#### 응답

- `200` 서류 삭제 성공 → -
- `404` 서류를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/admin/clubs/{clubId}/documents/{id}/download-url`

- **Summary**: 클럽 문서 다운로드 URL 발급
- **OperationId**: `AdminDocumentsController_createDownloadUrl`
- **인증**: 필요 (쿠키 `hdx_access_token`)

서명된 다운로드 URL을 생성

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID (UUID) |
| `path` | `id` | string | ✓ | 클럽 문서 ID (UUID) |

#### 응답

- `200` 다운로드 URL 발급 성공 → [`AdminDocumentDownloadUrlResponseDto`](#admindocumentdownloadurlresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/clubs/91073f24-9f8f-4f07-ab71-cab7f2825480/documents/50ca481b-924c-4974-b8f4-ab77b29b5cfa/download-url
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "url": "https://storage.googleapis.com/heritagedx-documents/91073f24-9f8f-4f07-ab71-cab7f2825480/2026010-****-****______________________________________.pdf?GoogleAccessId=899063000722-compute%40developer.gserviceaccount.com&Expires=1776427031&Signature=GjvMqTwpmy%2BYLbu%2FbGHu9BdkHSFy5MscWkMdijBXUXKMSihHY1gLm2GmPH52%2BodDCLNzys6EIemXMf%2FV6aKwYgSVofE0UvkdpxFlRsZNSYYl1qnRIILwQsQhB0K54azDYolaz67zXU%2BZtHWQyaWNJjdqYoD2tP%2B9TtLEg2a2isu7G2HcyewE43AM2KhGsPoX8aepFfJakHfmJ2AUpBuHEHOdv95TrfSsDjPCxfM1EAY43y3wttVao6xjklNDgUT83TsNFSQfw%2BclZHq3yBD5dYhl5ueGAUuQ47202EuGnWmQUW3fYaRPn2DpVF3%2FAAqpRHOllZzxAzn1wPTsynBYyg%3D%3D",
    "expiresAt": "2026-04-17T11:57:11.606Z"
  },
  "timestamp": "2026-04-17T11:42:11.732Z"
}
```

### `GET /api/admin/clubs/{clubId}/memberships/{membershipId}/documents`

- **Summary**: 회원권별 문서 목록 조회
- **OperationId**: `AdminMembershipDocumentsController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

페이지네이션을 지원하는 회원권별 문서 목록 조회

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID |
| `path` | `membershipId` | string | ✓ | 회원권 ID |
| `query` | `page` | number |  | 페이지 번호 |
| `query` | `limit` | number |  | 페이지당 항목 수 (최대 100) |

#### 응답

- `200` 문서 목록 조회 성공 → [`AdminMembershipDocumentListResponseDto`](#adminmembershipdocumentlistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/clubs/680fcded-07ec-4537-9dba-bb52d440ddfa/memberships/0a8bf9e0-3e76-4bd2-a365-48b8c91ce7dd/documents
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2026-04-17T11:42:12.341Z"
}
```

### `POST /api/admin/clubs/{clubId}/memberships/{membershipId}/documents`

- **Summary**: 회원권 문서 생성
- **OperationId**: `AdminMembershipDocumentsController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID |
| `path` | `membershipId` | string | ✓ | 회원권 ID |

#### Request Body

- Content-Type: `multipart/form-data`
- Schema: object

#### 응답

- `201` 문서 생성 성공 → [`AdminMembershipDocumentDetailResponseDto`](#adminmembershipdocumentdetailresponsedto)
- `404` 회원권을 찾을 수 없음 → -

### `GET /api/admin/clubs/{clubId}/memberships/{membershipId}/documents/{id}`

- **Summary**: 회원권 문서 상세 조회
- **OperationId**: `AdminMembershipDocumentsController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID |
| `path` | `membershipId` | string | ✓ | 회원권 ID |
| `path` | `id` | string | ✓ | 문서 ID |

#### 응답

- `200` 문서 조회 성공 → [`AdminMembershipDocumentDetailResponseDto`](#adminmembershipdocumentdetailresponsedto)
- `404` 문서를 찾을 수 없음 → -

> 실호출 샘플 없음 (데이터 부재 또는 권한 문제로 수집 불가). 스펙 스키마 참고.

### `PUT /api/admin/clubs/{clubId}/memberships/{membershipId}/documents/{id}`

- **Summary**: 회원권 문서 수정
- **OperationId**: `AdminMembershipDocumentsController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID |
| `path` | `membershipId` | string | ✓ | 회원권 ID |
| `path` | `id` | string | ✓ | 문서 ID |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateMembershipDocumentDto`](#updatemembershipdocumentdto)

#### 응답

- `200` 문서 수정 성공 → [`AdminMembershipDocumentDetailResponseDto`](#adminmembershipdocumentdetailresponsedto)
- `404` 문서를 찾을 수 없음 → -

### `DELETE /api/admin/clubs/{clubId}/memberships/{membershipId}/documents/{id}`

- **Summary**: 회원권 문서 삭제
- **OperationId**: `AdminMembershipDocumentsController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID |
| `path` | `membershipId` | string | ✓ | 회원권 ID |
| `path` | `id` | string | ✓ | 문서 ID |

#### 응답

- `200` 문서 삭제 성공 → -
- `404` 문서를 찾을 수 없음 → -

### `GET /api/admin/clubs/{clubId}/memberships/{membershipId}/documents/{id}/download-url`

- **Summary**: 회원권 문서 다운로드 URL 발급
- **OperationId**: `AdminMembershipDocumentsController_createDownloadUrl`
- **인증**: 필요 (쿠키 `hdx_access_token`)

서명된 다운로드 URL을 생성

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `clubId` | string | ✓ | 골프장 ID |
| `path` | `membershipId` | string | ✓ | 회원권 ID |
| `path` | `id` | string | ✓ | 문서 ID |

#### 응답

- `200` 다운로드 URL 발급 성공 → [`AdminDocumentDownloadUrlResponseDto`](#admindocumentdownloadurlresponsedto)
- `404` 문서를 찾을 수 없음 → -

> 실호출 샘플 없음 (데이터 부재 또는 권한 문제로 수집 불가). 스펙 스키마 참고.

### `GET /api/admin/global-documents`

- **Summary**: 전역 문서 목록 조회
- **OperationId**: `AdminGlobalDocumentsController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

페이지네이션과 검색을 지원하는 전역 문서 목록 조회

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `page` | number |  | 페이지 번호 |
| `query` | `limit` | number |  | 페이지당 항목 수 (최대 100) |
| `query` | `search` | string |  | 검색어 (문서명, 파일명) |

#### 응답

- `200` 전역 문서 목록 조회 성공 → [`AdminGlobalDocumentListResponseDto`](#adminglobaldocumentlistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/global-documents?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [
    {
      "id": "f79a81c2-3c1f-4343-897d-5a1772136e09",
      "name": "권한위임장",
      "fileDescription": "오라 권한위임장",
      "fileName": "권한위임장.docx",
      "storageKey": "global/20260121171305_______________.docx",
      "createdAt": "2026-01-21T17:13:06.157Z",
      "updatedAt": "2026-01-21T17:13:06.157Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2026-04-17T11:38:11.514Z"
}
```

### `POST /api/admin/global-documents`

- **Summary**: 전역 문서 생성
- **OperationId**: `AdminGlobalDocumentsController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

전역 필요서류 문서를 생성합니다. 파일 업로드는 선택사항입니다.

#### Request Body

- Content-Type: `multipart/form-data`
- Schema: object

#### 응답

- `201` 전역 문서 생성 성공 → [`AdminGlobalDocumentDetailResponseDto`](#adminglobaldocumentdetailresponsedto)

### `GET /api/admin/global-documents/{id}`

- **Summary**: 전역 문서 상세 조회
- **OperationId**: `AdminGlobalDocumentsController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

전역 문서 ID로 상세 정보를 조회합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 전역 문서 ID (UUID) |

#### 응답

- `200` 전역 문서 상세 조회 성공 → [`AdminGlobalDocumentDetailResponseDto`](#adminglobaldocumentdetailresponsedto)
- `404` 전역 문서를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/global-documents/f79a81c2-3c1f-4343-897d-5a1772136e09
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "f79a81c2-3c1f-4343-897d-5a1772136e09",
    "name": "권한위임장",
    "fileDescription": "오라 권한위임장",
    "fileName": "권한위임장.docx",
    "storageKey": "global/20260121171305_______________.docx",
    "createdAt": "2026-01-21T17:13:06.157Z",
    "updatedAt": "2026-01-21T17:13:06.157Z"
  },
  "timestamp": "2026-04-17T11:38:17.048Z"
}
```

### `PUT /api/admin/global-documents/{id}`

- **Summary**: 전역 문서 수정
- **OperationId**: `AdminGlobalDocumentsController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

전역 필요서류 문서를 수정합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 전역 문서 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateGlobalDocumentDto`](#updateglobaldocumentdto)

#### 응답

- `200` 전역 문서 수정 성공 → [`AdminGlobalDocumentDetailResponseDto`](#adminglobaldocumentdetailresponsedto)
- `404` 전역 문서를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/admin/global-documents/{id}`

- **Summary**: 전역 문서 삭제
- **OperationId**: `AdminGlobalDocumentsController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

전역 필요서류 문서를 삭제합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 전역 문서 ID (UUID) |

#### 응답

- `200` 전역 문서 삭제 성공 → -
- `404` 전역 문서를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/admin/global-documents/{id}/download-url`

- **Summary**: 전역 문서 다운로드 URL 발급
- **OperationId**: `AdminGlobalDocumentsController_createDownloadUrl`
- **인증**: 필요 (쿠키 `hdx_access_token`)

서명된 다운로드 URL을 생성

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 전역 문서 ID (UUID) |

#### 응답

- `200` 다운로드 URL 발급 성공 → [`AdminDocumentDownloadUrlResponseDto`](#admindocumentdownloadurlresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/global-documents/f79a81c2-3c1f-4343-897d-5a1772136e09/download-url
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "url": "https://storage.googleapis.com/heritagedx-documents/global/20260121171305_______________.docx?GoogleAccessId=899063000722-compute%40developer.gserviceaccount.com&Expires=1776426797&Signature=MoYL5MbHxm5FbBIYRg8b4LRVQ9eWfpkr2F46UB%2Fj7DRSxCNmskYsRmoZtqhso3K1IcakmZvPxNXNJNmz6VqFPdFPXJ1Ff1duCY5wmFn9A7jErSpL7lCjZiiznB%2FsNVpOdcaA5OIAAWhLpg1ucGAv%2FBaDNMkESaZ8DGMvJW6W5P8Pb1dsjEcjohxYcT2yHWuCX2i8%2FT1DInOJzBoIxUc6zAhIjle1ryn%2FBF7hKxYSe7TvfbDheS8IIn5oWAnQ8hnbDz4O8wLzCJhfZonqmvCoskMzpcELR%2FeV3XGQxeJ5n3I5QbnoMJrP5l1Kie6A0lJ%2FCMsjkAumLVsua3dEYE0jCg%3D%3D",
    "expiresAt": "2026-04-17T11:53:17.212Z"
  },
  "timestamp": "2026-04-17T11:38:17.316Z"
}
```

### `PUT /api/admin/global-documents/{id}/file`

- **Summary**: 전역 문서 파일 교체
- **OperationId**: `AdminGlobalDocumentsController_replaceFile`
- **인증**: 필요 (쿠키 `hdx_access_token`)

전역 문서의 파일을 교체합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 전역 문서 ID (UUID) |

#### Request Body

- Content-Type: `multipart/form-data`
- Schema: object

#### 응답

- `200` 전역 문서 파일 교체 성공 → [`AdminGlobalDocumentDetailResponseDto`](#adminglobaldocumentdetailresponsedto)

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### AdminCustomerDocumentDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 고객 구비 문서 상세 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminCustomerDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `clubId` | string | ✓ | 골프장 ID |
| `name` | string |  | 표시용 문서명 _예: `위임장`_ |
| `description` | string |  | 문서 설명 _예: `고객이 작성해야 할 위임장입니다.`_ |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### AdminCustomerDocumentListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | Array&lt;[`AdminCustomerDocumentDto`](#admincustomerdocumentdto)&gt; | ✓ | 고객 구비 문서 목록 |
| `meta` | object | ✓ | 페이지네이션 정보 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminDocumentDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 서류 상세 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminDocumentDownloadUrlDto

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | ✓ | 서명된 다운로드 URL |
| `expiresAt` | string | ✓ | 만료 시각 (ISO) |

### AdminDocumentDownloadUrlResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 다운로드 URL 정보 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `clubId` | string | ✓ | 골프장 ID |
| `name` | string |  | 표시용 문서명 _예: `양도양수승인신청서`_ |
| `fileName` | string | ✓ | 파일명 _예: `양도양수승인신청서.pdf`_ |
| `fileDescription` | string |  | 파일 설명 _예: `발급일로부터 3개월 이내`_ |
| `storageKey` | string |  | GCS 저장 경로 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### AdminDocumentListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | Array&lt;[`AdminDocumentDto`](#admindocumentdto)&gt; | ✓ | 서류 목록 |
| `meta` | object | ✓ | 페이지네이션 정보 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminGlobalDocumentDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 전역 문서 상세 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminGlobalDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `name` | string |  | 표시용 문서명 _예: `인감증명서`_ |
| `fileDescription` | string |  | 파일 설명 _예: `최근 3개월 이내`_ |
| `fileName` | string |  | 파일명 _예: `document.pdf`_ |
| `storageKey` | string |  | GCS 저장 경로 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### AdminGlobalDocumentListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | Array&lt;[`AdminGlobalDocumentDto`](#adminglobaldocumentdto)&gt; | ✓ | 전역 문서 목록 |
| `meta` | object | ✓ | 페이지네이션 정보 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminMembershipDocumentDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 회원권 문서 상세 |
| `timestamp` | string | ✓ | 응답 시간 |

### AdminMembershipDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID |
| `membershipId` | string | ✓ | 회원권 ID |
| `name` | string |  | 표시용 문서명 _예: `회원 가입 신청서`_ |
| `fileName` | string |  | 파일명 _예: `membership_form.pdf`_ |
| `fileDescription` | string |  | 파일 설명 _예: `발급일로부터 3개월 이내`_ |
| `storageKey` | string |  | GCS 저장 경로 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |

### AdminMembershipDocumentListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | Array&lt;[`AdminMembershipDocumentDto`](#adminmembershipdocumentdto)&gt; | ✓ | 회원권 문서 목록 |
| `meta` | object | ✓ | 페이지네이션 정보 |
| `timestamp` | string | ✓ | 응답 시간 |

### CreateCustomerDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string |  | 표시용 문서명 _예: `위임장`_ |
| `description` | string |  | 문서 설명 _예: `고객이 작성해야 할 위임장입니다.`_ |

### UpdateCustomerDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string |  | 표시용 문서명 _예: `위임장`_ |
| `description` | string |  | 문서 설명 _예: `고객이 작성해야 할 위임장입니다.`_ |

### UpdateDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string |  | 표시용 문서명 _예: `양도양수승인신청서`_ |
| `fileName` | string |  | 파일명 _예: `양도양수승인신청서.pdf`_ |
| `fileDescription` | string |  | 파일 설명 _예: `발급일로부터 3개월 이내`_ |

### UpdateGlobalDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string |  | 표시용 문서명 _예: `인감증명서`_ |
| `fileDescription` | string |  | 파일 설명 _예: `최근 3개월 이내`_ |

### UpdateMembershipDocumentDto

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string |  | 문서명 _예: `회원 가입 신청서`_ |
| `fileDescription` | string |  | 파일 설명 _예: `발급일로부터 3개월 이내`_ |
