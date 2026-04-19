# Admin 조직원 API

> spec: `v1.0.0+15ac42bd` · captured: `2026-04-17`
> base URL: `https://api.heritage-dx.com`
> 인증: 쿠키 `hdx_access_token` 필수 (SUPER_ADMIN / ORG_ADMIN / EDITOR 중 권한 보유자만)

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/admin/employees` | [Admin] 조직원 목록 조회 | 🔒 |

## 엔드포인트 상세

### `GET /api/admin/employees`

- **Summary**: [Admin] 조직원 목록 조회
- **OperationId**: `AdminEmployeesController_findAll`
- **인증**: 필요 (쿠키 `hdx_access_token`)

현재 사용자의 조직에 속한 활성 직원 목록을 조회합니다. 필터 드롭다운 등에 사용됩니다.

#### 응답

- `200`  → [`AdminEmployeeListResponseDto`](#adminemployeelistresponsedto)

#### 실호출 샘플 (2026-04-17)

```http
GET /api/admin/employees?page=1&limit=3
Cookie: hdx_access_token=<JWT>
```

```json
{
  "success": true,
  "data": [
    {
      "id": "3dd75ef3-5a0f-47b1-a9f0-028bb0da10da",
      "name": "김민정"
    },
    {
      "id": "a7f16bda-a098-4bae-bf63-6d8139a2e075",
      "name": "배희성"
    },
    {
      "id": "c295f98e-44f3-4e02-a92a-28ad06014790",
      "name": "에디터"
    },
    {
      "id": "4473b65c-3367-4b54-a517-b5ba15414197",
      "name": "이의현"
    },
    {
      "id": "4753cd40-58f3-4d0b-bf1a-6fd32f06169a",
      "name": "정상호"
    },
    {
      "id": "07401d33-2c10-4f40-ac97-3a52aca8daca",
      "name": "admin"
    },
    {
      "id": "cc59b257-a187-4e6f-b5b8-a8d689689ce1",
      "name": "Consultation Share Test Editor2"
    },
    {
      "id": "8ffb49d6-0303-4e4a-8f70-e0af659f954c",
      "name": "demo"
    },
    {
      "id": "eac1ec66-c832-4102-93db-3d666296db18",
      "name": "Editor User"
    },
    {
      "id": "237361a5-535f-4bcd-aaab-82446847c5a8",
      "name": "Org Admin"
    },
    {
      "id": "462f5763-498f-4d74-b716-d1b41798d3a4",
      "name": "Prod Workflow Editor"
    },
    {
      "id": "8a5ee07f-3b17-40da-ba8d-1067e4fd13ee",
      "name": "Super Admin"
    }
  ],
  "timestamp": "2026-04-17T11:38:12.691Z"
}
```

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### AdminEmployeeListResponseDto

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | ✓ | 예: `True` |
| `data` | Array&lt;[`EmployeeItemDto`](#employeeitemdto)&gt; | ✓ |  |
| `timestamp` | string | ✓ | 예: `2025-01-01T00:00:00.000Z` |

### EmployeeItemDto

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | 예: `550e8400-e29b-41d4-a716-446655440000` |
| `name` | string | ✓ | 예: `김담당` |
