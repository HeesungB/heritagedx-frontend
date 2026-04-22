# 클레임 API

> spec: `v1.0.0+d8345ee2` · captured: `2026-04-22`
> base URL: `https://api.heritage-dx.com`

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| `POST` | `/api/claims` | 클레임 접수 | 🔒 |

## 엔드포인트 상세

### `POST /api/claims`

- **Summary**: 클레임 접수
- **OperationId**: `ClaimsController_create`
- **인증**: 필요 (쿠키 `hdx_access_token`)

클레임을 접수하고 로그인 유저에게 접수 확인 이메일을 발송합니다.

#### Request Body

- Content-Type: `application/json`
- Schema: [`CreateClaimDto`](#createclaimdto)

#### 응답

- `201` 클레임 접수 완료 → [`ApiResponseDto`](#apiresponsedto)
- `400` 유효성 검증 실패 → [`ErrorResponseDto`](#errorresponsedto)
- `500` 이메일 발송 실패 → [`ErrorResponseDto`](#errorresponsedto)

---

## DTO

공통 DTO(`ApiResponseDto`, `ErrorDto`, `ErrorResponseDto`, `PaginationMetaDto`)는 [`../README.md`](../README.md) 참고.

### CreateClaimDto

| Field | Type | Required | Description |
|---|---|---|---|
| `category` | string | ✓ | 클레임 카테고리 _예: `서비스 불만`_ |
| `content` | string | ✓ | 클레임 내용 _예: `서류 처리가 지연되고 있습니다.`_ |
