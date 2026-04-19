# Admin 공지사항 API

> spec: `v1.0.0+15ac42bd` · captured: `2026-04-17`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

> ↔ 공개 대응: [../notices.md](../notices.md)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/notices` | [Admin] 공지사항 목록 조회 | 🔒 |
| `POST` | `/api/admin/notices` | [Admin] 공지사항 등록 | 🔒 |
| `GET` | `/api/admin/notices/{id}` | [Admin] 공지사항 상세 조회 | 🔒 |
| `PUT` | `/api/admin/notices/{id}` | [Admin] 공지사항 수정 | 🔒 |
| `DELETE` | `/api/admin/notices/{id}` | [Admin] 공지사항 삭제 | 🔒 |
| `DELETE` | `/api/admin/notices/{id}/files/{fileId}` | [Admin] 공지사항 첨부파일 개별 삭제 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/notices`

- **Summary**: [Admin] 공지사항 목록 조회
- **OperationId**: `AdminNoticesController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `page` | number |  | 페이지 번호 _예: `1`_ |
| `query` | `limit` | number |  | 페이지당 항목 수 _예: `20`_ |
| `query` | `search` | string |  | 검색어 (제목, 내용) _예: `안내`_ |
| `query` | `sort` | `createdAt` |  | 정렬 기준 _예: `createdAt`_ |
| `query` | `order` | `ASC` \| `DESC` |  | 정렬 방향 _예: `DESC`_ |

#### 응답

- `200` 목록 조회 성공 → [`NoticeListResponseDto`](#noticelistresponsedto)
- `401` 유효하지 않은 인증 토큰 → [`ErrorResponseDto`](#errorresponsedto)
- `404` 리소스를 찾을 수 없음 (권한 은닉 포함) → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/notices?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "notices": [
      {
        "id": "68e689b2-f863-4983-b651-ff526e60fc34",
        "title": "오늘 태광 얼마  c",
        "content": "cc 까지 작업 마무리하셈",
        "createdAt": "2026-03-02T06:59:37.300Z",
        "updatedAt": "2026-03-02T06:59:37.300Z"
      },
      {
        "id": "786e01e2-33b2-4c5b-a31e-538f9e404b1a",
        "title": "오늘 KPI",
        "content": "1. 정영각 이사님 - 오늘 판매왕",
        "createdAt": "2026-02-28T06:04:27.444Z",
        "updatedAt": "2026-02-28T06:04:27.444Z"
      },
      {
        "id": "81459790-4ee4-4e4b-9056-91e88ffb5e3e",
        "title": "캐광 3넉",
        "content": "가지5일뒤",
        "createdAt": "2026-02-27T09:47:31.459Z",
        "updatedAt": "2026-02-27T09:47:31.459Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 5,
      "itemsPerPage": 3
    }
  },
  "timestamp": "2026-04-17T11:38:12.131Z"
}
```

### `POST /api/admin/notices`

- **Summary**: [Admin] 공지사항 등록
- **OperationId**: `AdminNoticesController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### Request Body

- Content-Type: `multipart/form-data`
- Schema: object

#### 응답

- `201` 공지사항 등록 성공 → [`NoticeDetailResponseDto`](#noticedetailresponsedto)
- `400` 잘못된 요청 → [`ErrorResponseDto`](#errorresponsedto)
- `401` 유효하지 않은 인증 토큰 → [`ErrorResponseDto`](#errorresponsedto)
- `404` 리소스를 찾을 수 없음 (권한 은닉 포함) → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/admin/notices/{id}`

- **Summary**: [Admin] 공지사항 상세 조회
- **OperationId**: `AdminNoticesController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 공지사항 ID (UUID) |

#### 응답

- `200` 상세 조회 성공 → [`NoticeDetailResponseDto`](#noticedetailresponsedto)
- `401` 유효하지 않은 인증 토큰 → [`ErrorResponseDto`](#errorresponsedto)
- `404` 공지사항을 찾을 수 없음 (권한 은닉 포함) → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/notices/68e689b2-f863-4983-b651-ff526e60fc34
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "68e689b2-f863-4983-b651-ff526e60fc34",
    "title": "오늘 태광 얼마  c",
    "content": "cc 까지 작업 마무리하셈",
    "createdAt": "2026-03-02T06:59:37.300Z",
    "updatedAt": "2026-03-02T06:59:37.300Z",
    "files": []
  },
  "timestamp": "2026-04-17T11:38:19.132Z"
}
```

### `PUT /api/admin/notices/{id}`

- **Summary**: [Admin] 공지사항 수정
- **OperationId**: `AdminNoticesController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 공지사항 ID (UUID) |

#### Request Body

- Content-Type: `multipart/form-data`
- Schema: object

#### 응답

- `200` 수정 성공 → [`NoticeDetailResponseDto`](#noticedetailresponsedto)
- `401` 유효하지 않은 인증 토큰 → [`ErrorResponseDto`](#errorresponsedto)
- `404` 공지사항을 찾을 수 없음 (권한 은닉 포함) → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/admin/notices/{id}`

- **Summary**: [Admin] 공지사항 삭제
- **OperationId**: `AdminNoticesController_remove`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 공지사항 ID (UUID) |

#### 응답

- `200` 삭제 성공 → [`NoticeDeleteResponseDto`](#noticedeleteresponsedto)
- `401` 유효하지 않은 인증 토큰 → [`ErrorResponseDto`](#errorresponsedto)
- `404` 공지사항을 찾을 수 없음 (권한 은닉 포함) → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/admin/notices/{id}/files/{fileId}`

- **Summary**: [Admin] 공지사항 첨부파일 개별 삭제
- **OperationId**: `AdminNoticesController_removeFile`
- **인증**: 필요 (쿠키 `hdx_access_token`)

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 공지사항 ID (UUID) |
| `path` | `fileId` | string | ✓ | 첨부파일 ID (UUID) |

#### 응답

- `200` 삭제 성공 → -
- `401` 유효하지 않은 인증 토큰 → [`ErrorResponseDto`](#errorresponsedto)
- `404` 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### NoticeDeleteResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `message` | string | ✓ | 삭제 결과 메시지 _예: `삭제되었습니다`_ |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### NoticeDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### NoticeFileResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 파일 ID (UUID) |
| `fileName` | string | ✓ | 파일명 _예: `공지사항_첨부.pdf`_ |
| `fileSize` | number |  | 파일 크기 (bytes) |
| `mimeType` | string |  | MIME 타입 |
| `downloadUrl` | string |  | 다운로드 URL (서명됨) |
| `downloadUrlExpiresAt` | string |  | 다운로드 URL 만료 시각 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |

### NoticeListDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `notices` | Array&lt;[`NoticeResponseDto`](#noticeresponsedto)&gt; | ✓ | 공지사항 목록 |
| `pagination` | object | ✓ | 페이지네이션 정보 |

### NoticeListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 _예: `True`_ |
| `data` | object | ✓ | 응답 데이터 |
| `timestamp` | string | ✓ | 응답 타임스탬프 _예: `2024-12-13T12:00:00Z`_ |

### NoticePaginationMetaDto

| Field | Type | Required | Description |
|---|---|---|---|
| `currentPage` | number | ✓ | 현재 페이지 _예: `1`_ |
| `totalPages` | number | ✓ | 전체 페이지 수 _예: `5`_ |
| `totalItems` | number | ✓ | 전체 항목 수 _예: `100`_ |
| `itemsPerPage` | number | ✓ | 페이지당 항목 수 _예: `20`_ |

### NoticeResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | ID (UUID) |
| `title` | string | ✓ | 공지사항 제목 |
| `content` | string | ✓ | 공지사항 내용 |
| `files` | Array&lt;[`NoticeFileResponseDto`](#noticefileresponsedto)&gt; |  | 첨부 파일 목록 |
| `createdAt` | string (date-time) | ✓ | 생성일시 |
| `updatedAt` | string (date-time) | ✓ | 수정일시 |
