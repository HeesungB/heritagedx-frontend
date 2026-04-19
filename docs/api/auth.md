# Auth API

> spec: `v1.0.0+15ac42bd` · captured: `2026-04-17`
> base URL: `https://api.heritage-dx.com`

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `POST` | `/auth/change-password` | 비밀번호 변경 | 공개 |
| `POST` | `/auth/login` | 로그인 | 공개 |
| `POST` | `/auth/logout` | 로그아웃 | 공개 |
| `GET` | `/auth/me` | 현재 사용자 정보 조회 | 공개 |
| `POST` | `/auth/refresh` | 토큰 갱신 | 공개 |

## 엔드포인트 상세

### `POST /auth/change-password`

- **Summary**: 비밀번호 변경
- **OperationId**: `AuthController_changePassword`
- **인증**: 실제로는 필요할 수 있음 (스펙상 optional, 실테스트 결과 /auth/me 등은 401 반환)

#### Request Body

- Content-Type: `application/json`
- Schema: [`ChangePasswordDto`](#changepassworddto)

#### 응답

- `200` 비밀번호 변경 성공 → [`AuthSessionResponseDto`](#authsessionresponsedto)
- `201`  → [`AuthSessionResponseDto`](#authsessionresponsedto)
- `401` 인증 실패 → [`ErrorResponseDto`](#errorresponsedto)

### `POST /auth/login`

- **Summary**: 로그인
- **OperationId**: `AuthController_login`
- **인증**: 실제로는 필요할 수 있음 (스펙상 optional, 실테스트 결과 /auth/me 등은 401 반환)

#### Request Body

- Content-Type: `application/json`
- Schema: [`LoginDto`](#logindto)

#### 응답

- `200` 로그인 성공 → [`AuthSessionResponseDto`](#authsessionresponsedto)
- `201`  → [`AuthSessionResponseDto`](#authsessionresponsedto)
- `401` 인증 실패 → [`ErrorResponseDto`](#errorresponsedto)

### `POST /auth/logout`

- **Summary**: 로그아웃
- **OperationId**: `AuthController_logout`
- **인증**: 실제로는 필요할 수 있음 (스펙상 optional, 실테스트 결과 /auth/me 등은 401 반환)

#### 응답

- `200` 로그아웃 성공 → [`AuthMessageResponseDto`](#authmessageresponsedto)
- `201`  → [`AuthMessageResponseDto`](#authmessageresponsedto)

### `GET /auth/me`

- **Summary**: 현재 사용자 정보 조회
- **OperationId**: `AuthController_me`
- **인증**: 실제로는 필요할 수 있음 (스펙상 optional, 실테스트 결과 /auth/me 등은 401 반환)

#### 응답

- `200` 조회 성공 → [`AuthMeResponseDto`](#authmeresponsedto)
- `401` 인증 실패 → [`ErrorResponseDto`](#errorresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /auth/me
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": {
    "id": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
    "email": "s***@example.com",
    "name": "Super Admin",
    "role": "SUPER_ADMIN",
    "organizationId": "a0000000-0000-4000-a000-000000000001",
    "mustChangePassword": false
  },
  "timestamp": "2026-04-17T11:38:13.972Z"
}
```

### `POST /auth/refresh`

- **Summary**: 토큰 갱신
- **OperationId**: `AuthController_refresh`
- **인증**: 실제로는 필요할 수 있음 (스펙상 optional, 실테스트 결과 /auth/me 등은 401 반환)

#### 응답

- `200` 토큰 갱신 성공 → [`AuthSessionResponseDto`](#authsessionresponsedto)
- `201`  → [`AuthSessionResponseDto`](#authsessionresponsedto)
- `401` 유효하지 않은 리프레시 토큰 → [`ErrorResponseDto`](#errorresponsedto)

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### AuthMeResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 예: `True` |
| `data` | [`AuthUserResponseDto`](#authuserresponsedto) | ✓ |  |
| `timestamp` | string | ✓ | 예: `2026-02-12T12:00:00.000Z` |

### AuthMessageResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 예: `True` |
| `message` | string | ✓ | 예: `로그아웃되었습니다.` |
| `timestamp` | string | ✓ | 예: `2026-02-12T12:00:00.000Z` |

### AuthSessionDataDto

| Field | Type | Required | Description |
|---|---|---|---|
| `user` | [`AuthUserResponseDto`](#authuserresponsedto) | ✓ |  |
| `accessTokenExpiresAt` | string | ✓ | 예: `2026-02-20T00:00:00.000Z` |
| `refreshTokenExpiresAt` | string | ✓ | 예: `2026-03-12T00:00:00.000Z` |

### AuthSessionResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 예: `True` |
| `data` | [`AuthSessionDataDto`](#authsessiondatadto) | ✓ |  |
| `timestamp` | string | ✓ | 예: `2026-02-12T12:00:00.000Z` |

### AuthUserResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 예: `550e8400-e29b-41d4-a716-446655440000` |
| `email` | string | ✓ | 예: `admin@example.com` |
| `name` | string | ✓ | 예: `관리자` |
| `role` | `SUPER_ADMIN` \| `ORG_ADMIN` \| `EDITOR` | ✓ | 예: `SUPER_ADMIN` |
| `organizationId` | string | ✓ | 예: `a0000000-0000-4000-a000-000000000001` |
| `mustChangePassword` | boolean | ✓ | 예: `False` |

### ChangePasswordDto

| Field | Type | Required | Description |
|---|---|---|---|
| `currentPassword` | string | ✓ | 현재 비밀번호 |
| `newPassword` | string | ✓ | 새 비밀번호 |

### LoginDto

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string (email) | ✓ | 이메일 _예: `admin@example.com`_ |
| `password` | string | ✓ | 비밀번호 |
