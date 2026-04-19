# Admin 사용자 API

> spec: `v1.0.0+15ac42bd` · captured: `2026-04-17`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/users` | 사용자 목록 조회 | 🔒 |
| `POST` | `/api/admin/users` | 사용자 생성 | 🔒 |
| `GET` | `/api/admin/users/{id}` | 사용자 상세 조회 | 🔒 |
| `PUT` | `/api/admin/users/{id}` | 사용자 정보 수정 | 🔒 |
| `DELETE` | `/api/admin/users/{id}` | 사용자 삭제 | 🔒 |
| `POST` | `/api/admin/users/{id}/reset-password` | 비밀번호 초기화 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/users`

- **Summary**: 사용자 목록 조회
- **OperationId**: `UsersController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

SUPER_ADMIN은 모든 사용자, ORG_ADMIN은 소속 조직 사용자만 조회 가능

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `page` | number |  | _예: `1`_ |
| `query` | `limit` | number |  | _예: `20`_ |
| `query` | `search` | string |  |  |

#### 응답

- `200` 사용자 목록 조회 성공 → [`UserListResponseDto`](#userlistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/users?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [
    {
      "id": "462f5763-498f-4d74-b716-d1b41798d3a4",
      "email": "p***@heritage-dx.test",
      "name": "Prod Workflow Editor",
      "role": "EDITOR",
      "organizationId": "a0000000-0000-4000-a000-000000000001",
      "organizationName": "참존회원권",
      "isActive": true,
      "mustChangePassword": false,
      "lastLoginAt": "2026-04-11T19:57:46.726Z",
      "createdAt": "2026-04-11T18:46:44.251Z",
      "updatedAt": "2026-04-11T19:57:46.730Z"
    },
    {
      "id": "95c2fcc2-6c70-409b-bd41-628096f9aac3",
      "email": "d***@heritagedx.com",
      "name": "Demo Super Admin",
      "role": "SUPER_ADMIN",
      "organizationId": "5fe3826f-68e3-4f6e-9163-a2c0c8cce0c8",
      "organizationName": "DEMO조직",
      "isActive": true,
      "mustChangePassword": false,
      "lastLoginAt": "2026-03-15T19:03:29.391Z",
      "createdAt": "2026-03-15T18:55:42.457Z",
      "updatedAt": "2026-03-15T19:03:29.409Z"
    },
    {
      "id": "00174a9a-d5a3-4415-9206-44c090ac9fd0",
      "email": "d***@heritagedx.com",
      "name": "박데모",
      "role": "EDITOR",
      "organizationId": "5fe3826f-68e3-4f6e-9163-a2c0c8cce0c8",
      "organizationName": "DEMO조직",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-03-15T18:00:37.615Z",
      "updatedAt": "2026-03-15T18:00:37.615Z"
    }
  ],
  "meta": {
    "total": 16,
    "page": 1,
    "limit": 3,
    "totalPages": 6,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-04-17T11:38:14.456Z"
}
```

### `POST /api/admin/users`

- **Summary**: 사용자 생성
- **OperationId**: `UsersController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

새로운 사용자 생성. SUPER_ADMIN은 모든 역할, ORG_ADMIN은 EDITOR만 생성 가능

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateUserDto`](#createuserdto)

#### 응답

- `201` 사용자 생성 성공 (계정 안내 이메일 발송) → [`UserCreateResponseDto`](#usercreateresponsedto)
- `400` 잘못된 요청 → [`ErrorResponseDto`](#errorresponsedto)
- `409` 이메일 중복 → [`ErrorResponseDto`](#errorresponsedto)

### `GET /api/admin/users/{id}`

- **Summary**: 사용자 상세 조회
- **OperationId**: `UsersController_findOne`
- **인증**: 필요 (쿠키 `hdx_access_token`)

사용자 ID로 상세 정보 조회

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 사용자 ID (UUID) |

#### 응답

- `200` 사용자 상세 조회 성공 → [`UserDetailResponseDto`](#userdetailresponsedto)
- `404` 사용자를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/users/462f5763-498f-4d74-b716-d1b41798d3a4
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "462f5763-498f-4d74-b716-d1b41798d3a4",
    "email": "p***@heritage-dx.test",
    "name": "Prod Workflow Editor",
    "role": "EDITOR",
    "organizationId": "a0000000-0000-4000-a000-000000000001",
    "organizationName": "참존회원권",
    "isActive": true,
    "mustChangePassword": false,
    "lastLoginAt": "2026-04-11T19:57:46.726Z",
    "createdAt": "2026-04-11T18:46:44.251Z",
    "updatedAt": "2026-04-11T19:57:46.730Z"
  },
  "timestamp": "2026-04-17T11:38:21.735Z"
}
```

### `PUT /api/admin/users/{id}`

- **Summary**: 사용자 정보 수정
- **OperationId**: `UsersController_update`
- **인증**: 필요 (쿠키 `hdx_access_token`)

사용자 정보 수정. 역할 수정은 권한에 따라 제한됨

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 사용자 ID (UUID) |

#### Request Body

- Content-Type: `application/json`
- Schema: [`UpdateUserDto`](#updateuserdto)

#### 응답

- `200` 사용자 수정 성공 → [`UserDetailResponseDto`](#userdetailresponsedto)
- `404` 사용자를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `DELETE /api/admin/users/{id}`

- **Summary**: 사용자 삭제
- **OperationId**: `UsersController_delete`
- **인증**: 필요 (쿠키 `hdx_access_token`)

사용자를 DB에서 완전히 삭제합니다.

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 사용자 ID (UUID) |

#### 응답

- `200` 사용자 삭제 성공 → [`UserMessageResponseDto`](#usermessageresponsedto)
- `404` 사용자를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

### `POST /api/admin/users/{id}/reset-password`

- **Summary**: 비밀번호 초기화
- **OperationId**: `UsersController_resetPassword`
- **인증**: 필요 (쿠키 `hdx_access_token`)

사용자 비밀번호를 임시 비밀번호로 초기화

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `path` | `id` | string | ✓ | 사용자 ID (UUID) |

#### 응답

- `200` 비밀번호 초기화 성공 (이메일 발송) → [`UserMessageResponseDto`](#usermessageresponsedto)
- `201`  → [`UserMessageResponseDto`](#usermessageresponsedto)
- `404` 사용자를 찾을 수 없음 → [`ErrorResponseDto`](#errorresponsedto)

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### CreateUserDto

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string (email) | ✓ | 사용자 이메일 _예: `user@example.com`_ |
| `name` | string | ✓ | 사용자 이름 _예: `홍길동`_ |
| `role` | `SUPER_ADMIN` \| `ORG_ADMIN` \| `EDITOR` | ✓ | 사용자 역할 _예: `EDITOR`_ |
| `organizationId` | string (uuid) | ✓ | 소속 조직 ID _예: `123e4567-e89b-12d3-a456-426614174000`_ |

### UpdateUserDto

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string |  | 사용자 이름 _예: `홍길동`_ |
| `role` | `SUPER_ADMIN` \| `ORG_ADMIN` \| `EDITOR` |  | 사용자 역할 _예: `EDITOR`_ |
| `isActive` | boolean |  | 활성화 여부 _예: `True`_ |

### UserCreateResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 |
| `data` | object | ✓ | 생성된 사용자 정보 |
| `message` | string | ✓ | 메시지 _예: `사용자가 생성되었고 계정 안내 이메일이 발송되었습니다.`_ |
| `timestamp` | string | ✓ | 응답 시간 |

### UserDetailResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 |
| `data` | object | ✓ | 사용자 정보 |
| `timestamp` | string | ✓ | 응답 시간 |

### UserDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 사용자 ID |
| `email` | string | ✓ | 이메일 |
| `name` | string | ✓ | 이름 |
| `role` | `SUPER_ADMIN` \| `ORG_ADMIN` \| `EDITOR` | ✓ | 역할 |
| `organizationId` | string | ✓ | 조직 ID |
| `organizationName` | string |  | 조직명 |
| `isActive` | boolean | ✓ | 활성화 여부 |
| `mustChangePassword` | boolean | ✓ | 비밀번호 변경 필요 여부 |
| `lastLoginAt` | string |  | 마지막 로그인 일시 |
| `createdAt` | string | ✓ | 생성일시 |
| `updatedAt` | string | ✓ | 수정일시 |

### UserListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 |
| `data` | Array&lt;[`UserDto`](#userdto)&gt; | ✓ | 사용자 목록 |
| `meta` | object | ✓ |  |
| `timestamp` | string | ✓ | 응답 시간 |

### UserMessageResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 성공 여부 |
| `message` | string | ✓ | 메시지 |
| `timestamp` | string | ✓ | 응답 시간 |
