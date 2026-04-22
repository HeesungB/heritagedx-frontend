# Admin 감사 로그 API

> spec: `v1.0.0+d8345ee2` · captured: `2026-04-22`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/audit-logs` | 감사 로그 조회 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/audit-logs`

- **Summary**: 감사 로그 조회
- **OperationId**: `AuditController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

SUPER_ADMIN은 전체 조회 가능, ORG_ADMIN은 소속 조직 로그만 조회 가능

#### 파라미터

| 위치 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| `query` | `page` | number |  | _예: `1`_ |
| `query` | `limit` | number |  | _예: `20`_ |
| `query` | `action` | `AUTH_LOGIN` \| `AUTH_LOGIN_FAILED` \| `AUTH_LOGOUT` \| `AUTH_PASSWORD_CHANGE` \| `AUTH_PASSWORD_RESET` \| `AUTH_ORG_SWITCH` \| `USER_CREATE` \| `USER_UPDATE` \| `USER_DEACTIVATE` \| `ORG_CREATE` \| `ORG_UPDATE` \| `ORG_DEACTIVATE` \| `RESOURCE_CREATE` \| `RESOURCE_UPDATE` \| `RESOURCE_DELETE` |  |  |
| `query` | `apiType` | `ADMIN` \| `PUBLIC` |  |  |
| `query` | `organizationId` | string (uuid) |  | SUPER_ADMIN 전용 조직 필터 |
| `query` | `userEmail` | string |  | 사용자 이메일 부분 검색 |
| `query` | `startDate` | string |  | 조회 시작일 (ISO8601) |
| `query` | `endDate` | string |  | 조회 종료일 (ISO8601) |

#### 응답

- `200` 감사 로그 조회 성공 → [`AuditLogListResponseDto`](#auditloglistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/audit-logs?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [
    {
      "id": "1fe4e2e9-1222-4f00-9cea-a7695543abbd",
      "userId": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
      "userEmail": "s***@example.com",
      "userRole": "SUPER_ADMIN",
      "organizationId": "a0000000-0000-4000-a000-000000000001",
      "action": "AUTH_LOGIN",
      "resourceType": "auth",
      "resourceId": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
      "beforeData": null,
      "afterData": {
        "email": "s***@example.com"
      },
      "ipAddress": "160.238.37.100",
      "userAgent": "curl/8.7.1",
      "apiType": "PUBLIC",
      "createdAt": "2026-04-17T11:37:10.924Z"
    },
    {
      "id": "65901c44-997f-4aed-a891-334b77f334f7",
      "userId": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
      "userEmail": "s***@example.com",
      "userRole": "SUPER_ADMIN",
      "organizationId": "a0000000-0000-4000-a000-000000000001",
      "action": "AUTH_LOGIN",
      "resourceType": "auth",
      "resourceId": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
      "beforeData": null,
      "afterData": {
        "email": "s***@example.com"
      },
      "ipAddress": "160.238.37.100",
      "userAgent": "curl/8.7.1",
      "apiType": "PUBLIC",
      "createdAt": "2026-04-17T11:37:04.098Z"
    },
    {
      "id": "5d9c8b76-9435-4760-b03f-e92b88d3cd6b",
      "userId": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
      "userEmail": "s***@example.com",
      "userRole": "SUPER_ADMIN",
      "organizationId": "a0000000-0000-4000-a000-000000000001",
      "action": "AUTH_LOGIN",
      "resourceType": "auth",
      "resourceId": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
      "beforeData": null,
      "afterData": {
        "email": "s***@example.com"
      },
      "ipAddress": "121.166.129.207",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Whale/4.36.368.16 Safari/537.36",
      "apiType": "PUBLIC",
      "createdAt": "2026-04-17T10:13:16.042Z"
    }
  ],
  "meta": {
    "total": 5013,
    "page": 1,
    "limit": 3,
    "totalPages": 1671,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-04-17T11:38:14.262Z"
}
```

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### AuditLogDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ |  |
| `userId` | string | ✓ |  |
| `userEmail` | string | ✓ |  |
| `userRole` | `SUPER_ADMIN` \| `ORG_ADMIN` \| `EDITOR` | ✓ |  |
| `organizationId` | string | ✓ |  |
| `action` | `AUTH_LOGIN` \| `AUTH_LOGIN_FAILED` \| `AUTH_LOGOUT` \| `AUTH_PASSWORD_CHANGE` \| `AUTH_PASSWORD_RESET` \| `AUTH_ORG_SWITCH` \| `USER_CREATE` \| `USER_UPDATE` \| `USER_DEACTIVATE` \| `ORG_CREATE` \| `ORG_UPDATE` \| `ORG_DEACTIVATE` \| `RESOURCE_CREATE` \| `RESOURCE_UPDATE` \| `RESOURCE_DELETE` | ✓ |  |
| `resourceType` | string | ✓ |  |
| `resourceId` | string | ✓ |  |
| `beforeData` | object | ✓ |  |
| `afterData` | object | ✓ |  |
| `ipAddress` | string | ✓ |  |
| `userAgent` | string | ✓ |  |
| `apiType` | `ADMIN` \| `PUBLIC` | ✓ |  |
| `createdAt` | string | ✓ | 예: `2026-02-12T12:34:56.000Z` |

### AuditLogListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 예: `True` |
| `data` | Array&lt;[`AuditLogDto`](#auditlogdto)&gt; | ✓ |  |
| `meta` | object | ✓ |  |
| `timestamp` | string | ✓ | 예: `2026-02-12T12:34:56.000Z` |
