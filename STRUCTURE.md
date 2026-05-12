# Heritage DX — 프로젝트 구조 문서

## 1. 프로젝트 개요

골프 회원권 거래 플랫폼을 위한 **모노레포** 프로젝트. 공개 사이트(OS)와 관리자 백오피스(Back Office) 두 개의 Next.js 앱이 9개의 공유 패키지를 사용한다.

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 15, React 19 |
| 언어 | TypeScript 5.7 |
| 빌드 오케스트레이션 | Turborepo 2.3 |
| 패키지 매니저 | pnpm 9.15 (workspace) |
| 스타일링 | Tailwind CSS 3.4 |
| 배포 | GCP Cloud Run (standalone output) |

---

## 2. 디렉토리 구조

```
heritage-dx/
├── apps/
│   ├── os/                          # 공개 사이트 (포트 3000)
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router (loading/error: clubs, trades, claims, customers)
│   │   │   ├── components/          # 컴포넌트들 — Sidebar/AppHeader/AppShell shell + 페이지 컴포넌트들
│   │   │   │   ├── club-profile/        # ClubBasicInfoTable, MembershipInfoSection,
│   │   │   │   │                        #   EstimateSection, CostCalculatorSection, GreenFeeField, InfoField,
│   │   │   │   │                        #   BenefitsSheetSection, DocumentsSection, MarketPriceSummary,
│   │   │   │   │                        #   NearbyClubPrices, PriceChart, SectionCard, ClubSwitcher, SoldPriceBanner
│   │   │   │   ├── sheet-common/        # 혜택지/견적서 A4 시트 공용 (2026-05 리디자인) —
│   │   │   │   │                        #   sheet.module.css, SheetToolbar, PrintItemSelector
│   │   │   │   ├── customer-create/     # CustomerCreateModal (4섹션 신규 고객 등록 모달 + 스텝퍼),
│   │   │   │   │                        #   MembershipRow (보유 회원권 다중 행 — ClubSearchSelect + membership select)
│   │   │   ├── contexts/            # AuthContext, RepositoryContext
│   │   │   ├── hooks/               # useOrganization, useTaxSettings (localStorage 세율 오버라이드), useSheetStorage, useSettlementSheet (승인요청서 양식 ↔ 백엔드 settlement — 내부에 react-hook-form `useForm<SheetOverrides>` 보관. 마운트 시 GET → 없으면 POST /draft baseline + localStorage(`hdx:settlement:<consultationId>`, **양식 셀 키 단위로 모든 셀 보존**) 머지 → form.reset. useWatch + useEffect 로 변경 감지 → 300ms debounce 후 매핑 여부 무관하게 모든 dirty 셀을 sheet key 그대로 localStorage 에 저장(네트워크 0). `commit()` 시 dirty 셀 중 SHEET_TO_ENTITY 매핑된 것만 entity 변환 → POST(첫 persist) 또는 PUT(변경 셀만) 한 번 발사. 응답 검증 에러는 settlement-sheet-adapter 의 `parseValidationField` + `ENTITY_TO_SHEET` inverse 로 양식 셀 키에 매핑하여 form.setError 로 주입(셀에 빨간 ring + 메시지) — 매핑 안 되는 필드는 `unmappedErrors` 로 반환되어 모달 상단 합쳐 표시. `markGenerated()` 는 `PATCH /document-generated` 의 `SETTLEMENT_REQUIRED_FIELDS` 응답 `details.missingFields` 도 같은 패턴으로 form.setError 매핑. 성공 시 localStorage 클리어 + form.reset 으로 dirty 초기화. reset/missingFields/documentGeneratedAt 노출), useMarketPriceSummary, useSendTradeNotification, useGeocode, useCustomerEnsureFlow
│   │   │   ├── lib/                 # server-repositories.ts, authApi.ts, firebase-admin.ts, gtag.ts
│   │   │   ├── types/               # 앱 전용 타입 (exchange-price.ts 포함)
│   │   │   ├── constants/           # golfCourseCoordinates.json
│   │   │   └── utils/               # distance, sheet-print, documentDownload
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   └── back-office/                 # 관리자 백오피스 (포트 3001)
│       ├── src/
│       │   ├── app/                 # Next.js App Router ((dashboard)/error.tsx, loading: clubs, trade-memos, trade-records, kpi)
│       │   ├── components/
│       │   │   ├── forms/           # ClubForm, DocumentForm, MembershipForm, ScenarioForm
│       │   │   ├── kpi/             # KpiMiniDashboard, KpiFilterBar, KpiTrendChart, KpiEmployeeComparison
│       │   │   ├── layout/          # Header, Sidebar, PageContainer
│       │   │   └── GoogleAnalytics.tsx  # GA4 이벤트 트래킹
│       │   ├── contexts/            # AuthContext, DataContext, RepositoryContext
│       │   ├── hooks/               # useFCMToken, useFCMForeground, useNotifications
│       │   ├── lib/                 # authApi.ts, firebase.ts, firebase-admin.ts
│       │   ├── types/               # 프록시 re-export + 앱 전용 타입
│       │   └── middleware.ts        # 세션·역할 가드 (1-1)
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── package.json
├── packages/
│   ├── types/                       # @heritage-dx/types — 도메인 타입
│   ├── utils/                       # @heritage-dx/utils — 유틸리티 함수
│   ├── api-client/                  # @heritage-dx/api-client — HTTP 클라이언트
│   ├── api/                         # @heritage-dx/api — Repository Pattern API 레이어
│   ├── auth/                        # @heritage-dx/auth — 인증 Provider/Hook
│   ├── store/                       # @heritage-dx/store — Entity/Mapper/Zustand 캐시 스토어
│   ├── ui/                          # @heritage-dx/ui — 공유 UI 컴포넌트
│   ├── typescript-config/           # @heritage-dx/typescript-config
│   ├── tailwind-config/             # @heritage-dx/tailwind-config
│   └── eslint-config/               # @heritage-dx/eslint-config — 공유 ESLint flat config
├── scripts/
│   └── data-sync.mjs                 # Data Sync CLI (fetch/validate/seed/warm)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 3. 패키지 의존성 그래프

```
@heritage-dx/typescript-config          (설정만, 의존 없음)
@heritage-dx/tailwind-config            (설정만, 의존 없음)
@heritage-dx/eslint-config              (설정만, 의존 없음 — ESLint 9 flat config)

@heritage-dx/types                      (의존 없음)
       ↑
@heritage-dx/utils                      (의존 없음)
       ↑
@heritage-dx/api-client  ←── types
       ↑
@heritage-dx/api  ←── types, api-client  (Repository Pattern)
       ↑
@heritage-dx/store  ←── types, api  (Entity/Mapper/Zustand Store)
       ↑
@heritage-dx/auth  ←── types, api-client
       ↑
@heritage-dx/ui  ←── (lucide-react)

       ↓                    ↓
  @heritage-dx/os      @heritage-dx/back-office
  (types, utils,       (types, utils,
   api-client, api,     api-client, api,
   store, auth, ui)     store, auth, ui)
  + recharts            + react-hook-form
                        + recharts
  + html-to-image       + zod
  + jszip, pdf-lib
```

**앱 → 패키지 의존성 요약:**

| 패키지 | OS | Back Office |
|--------|:--:|:-----------:|
| `@heritage-dx/types` | O | O |
| `@heritage-dx/utils` | O | O |
| `@heritage-dx/api-client` | O | O |
| `@heritage-dx/api` | O | O |
| `@heritage-dx/store` | O | O |
| `@heritage-dx/auth` | O | O |
| `@heritage-dx/ui` | O | O |
| `@heritage-dx/typescript-config` | dev | dev |
| `@heritage-dx/tailwind-config` | dev | dev |

---

## 4. 공유 패키지 상세

### 4.1. `@heritage-dx/types`

도메인 모델의 TypeScript 타입 정의. 12개 모듈로 구성. OpenAPI 스펙(`docs/api/`) 을 ground truth 로 한다.

| 모듈 | 주요 타입 |
|------|----------|
| `api.ts` | `ApiResponse<T>` (클라이언트 Result), `AuthApiResponse<T>`, `ServerEnvelope<T>`, `ServerErrorEnvelope`, `ErrorDto`, `Pagination` (`{page, limit, total, totalPages, hasNext, hasPrev}`), `SearchParams` |
| `club.ts` | `Club` (목록 경량), `ClubDetail`, `ClubContact`, `BankAccount`, `ClubsResponse`, `ClubDetailResponse` — `ClubListItemDto` / `ClubDetailDataDto` 1:1 |
| `membership.ts` | `Membership`, `MembershipDocument`, `MembershipType` (`"개인"` \| `"법인"`) — 준회원/가족회원/위임 13필드는 스펙 부재로 제거 |
| `document.ts` | `Document`, `ClubDocument`, `GlobalDocument`, `CustomerDocument`, `ClubScenarioDocument`, `DocumentsSummary` |
| `scenario.ts` | `Scenario`, `ScenarioSide`, `ScenarioOwnerType` (`Personal`\|`Corporate`\|`Family`\|`Special`\|`All`), `ScenarioConditions`, `ScenarioWithDocuments`, `AvailableFilters` |
| `trade.ts` | `Consultation`, `ConsultationInput`, `ConsultationNoteEntry`/`ConsultationNotes`/`ConsultationNoteInput`/`ConsultationNotesData`(notes JSONB 메모 entry — `ConsultationNotesData` 는 `POST/PATCH/DELETE /consultations/:id/notes[/:noteId]` 의 부분 응답 `{notes: {entries:[...]}}` 전용 타입), `MembershipTrade`, `MembershipTradeInput`, `TradeType` (`"매도"` \| `"매수"`), AI 자연어 추출용 `ConsultationAiInput`/`ConsultationAiDraft`/`ConsultationAiCandidate`/`ConsultationAiMatchInfo`/`ConsultationAiMissingField`/`ConsultationAiResponse` — pagination 은 공용 `Pagination` 사용. `Consultation.notes` 는 `{ entries: ConsultationNoteEntry[] }` 구조이며 메모 CRUD 는 별도 엔드포인트(`POST/PATCH/DELETE /consultations/:id/notes[/:noteId]`) 로만 수행한다. `ConsultationInput.notes` 는 **상담 생성 시에만** 첫 entry 텍스트로 사용(서버 자동 변환), `PUT /consultations/:id` 에서는 omit 필수. AI 타입은 `packages/store/src/entities/consultation-ai.ts` 에서 re-export 되어 뷰는 `@heritage-dx/store` 로만 import |
| `approval.ts` | `APPROVAL_STATUS`, `APPROVAL_ACTIONS`, `ApprovalStatus`/`WorkflowStatus`/`ApprovalAction`/`ApprovalActionInput` |
| `claim.ts` | `Claim`, `ClaimInput` |
| `customer.ts` | `Customer`, `CustomerInput`, `CustomerUpdateInput`, `CustomerOwnedMembership` (clubId/membershipId/status/quantity/note/displayOrder + clubName/membershipName join), `CustomersListData`, `CustomerHistory`, `CustomerHistorySummary` — OpenAPI `CustomerResponseDto` 1:1. UpdateInput.ownedMemberships 동작: 미포함=유지/[]=전체삭제/[...]=전체교체 |
| `notice.ts` | `Notice` (files 배열 포함), `NoticeFile`, `NoticeInput`, `NoticesData` — pagination 은 공용 `Pagination` |
| `settlement.ts` | `Settlement`, `SettlementInput`, `SettlementUpdateInput`, `SettlementDraftRequest`, `SettlementDraftResponse` — 입출금표(상담 1:1). 백엔드 응답 기준 평탄 필드: 메타(consultationId/membershipTradeId/documentGeneratedAt 등) + 헤더(membershipName/tradeDate/salesContractAmount/remarks) + 매도(sellName/sellPhone/sellDealerId/sellEntityType/sellMembershipAmount/sellCommissionDeducted) + 매수(buy 계열 동일). draft 응답은 `{ draft, missingFields, warnings }` 한 단계 감싸짐. PUT 동작: 키 명시된 셀만 변경 |
| `kpi.ts` | `KpiTradesResponse` (userId/managerName 포함 4필드), `KpiConsultationsResponse` (8필드 전체), `KpiTradesParams`, `KpiConsultationsParams`, `Employee` |
| `user.ts` | `User` (isActive, createdAt 등 포함 full UserDto), `AdminUser` (alias), `UserRole`, `UserCreateInput`, `UserUpdateInput`, `LoginResponse` |
| `organization.ts` | `Organization` |

### 4.2. `@heritage-dx/utils`

네 개의 유틸리티 모듈.

**`currency.ts`** — 한국 원화 포맷팅:
- `formatCurrency(amount)` → `"1,000원"`
- `formatManwon(manwon)` → `"1억 7,000만원"`
- `manwonToWon(manwon)` / `wonToManwon(won)` — 만원↔원 변환
- `parseNumber(str)` — 문자열에서 숫자 추출
- `parseTransferFee(feeStr)` — 명의개서료 파싱 (만원 단위)
- `parseTransferFeeToWon(feeStr)` — 명의개서료 파싱 (원 단위)
- `toManwon(won)` → `"1,700"` (원→만원 숫자 문자열, 접미사 없음, null 은 `"—"`)
- `formatProfitShort(won)` → `"1.2억" / "1.2천만" / "123만"` (KPI 차트용 축약)
- `formatKrwWithComma(value)` — 입력 필드용 콤마 포맷 (0/undefined → 빈 문자열)

**`korean.ts`** — 한글 처리:
- `getKoreanInitial(str)` — 초성 추출
- `normalizeInitial(initial)` — 쌍자음→단자음
- `getProvince(region)`: 첫 단어 도/시 약칭 정규화
- `getRegionGroup(region)`: 지역 그룹핑. 2-pass 매칭. (1) 첫 단어 약칭 → REGION_GROUP_MAP, (2) 미매칭이면 region 전체에서 한국 키워드 부분 문자열 매칭(`제주시`/`서귀포시` 처럼 도 prefix 없는 단독 시 표기 정확 분류). 둘 다 미매칭이면 `해외`, 빈 region 은 `null`.
- `extractRegionFromAddress(address)`: address에서 "도 시" 두 토큰 추출
- `getEffectiveRegion(region, address)`: region이 비어있으면 address에서 보충
- `INITIALS`: 14개 초성 + `"0-9"`
- `REGION_GROUPS`: `수도권`, `강원도`, `충청도`, `전라도`, `경상도`, `제주도`, `해외` (해외 = 한국 시/도 어느 키워드와도 매칭되지 않은 region 의 폴백)

**`phone.ts`** — 한국 휴대폰 번호:
- `formatPhoneNumber(value)` — 숫자만 추출해 길이별로 `010-1234-5678` 형태 자동 포맷
- `isValidKoreanMobile(value)` — `^010-\d{4}-\d{4}$` 매칭

**`email.ts`** — 이메일:
- `isValidEmail(value)` — `[^\s@]+@[^\s@]+\.[^\s@]+` 매칭

### 4.3. `@heritage-dx/api-client`

HTTP 클라이언트 + 토큰 관리.

```
┌──────────────────────────────────────────────────┐
│  ApiClient(baseUrl, options?)                    │
│  - options.timeoutMs?: number (기본 10_000)      │
│  ├── get<T>(endpoint, params?)                   │
│  ├── post<T>(endpoint, body?)                    │
│  ├── put<T>(endpoint, body?)                     │
│  ├── patch<T>(endpoint, body?)                   │
│  ├── delete<T>(endpoint)                         │
│  └── uploadFormData<T>(endpoint, formData)       │
│                                                  │
│  내부 동작:                                       │
│  ├── credentials: "include" (쿠키 전달)           │
│  ├── AbortController + timeoutMs (기본 10초)       │
│  │   → AbortError 시 "요청 시간이 초과되었습니다." 반환 │
│  ├── 401 → tryRefreshToken() → 재시도             │
│  └── 응답 정규화 (success/data 구조)               │
└──────────────────────────────────────────────────┘

토큰 관리 유틸리티:
├── setAuthExpiredHandler(handler) — 만료 콜백 등록
├── setAuthBaseUrl(url) — 인증 엔드포인트 URL
├── tryRefreshToken() — 중복 방지 refresh (singleton promise)
└── redirectToLogin() — 로그인 리다이렉트
```

### 4.4. `@heritage-dx/api`

Repository Pattern 기반 API 레이어. General(공개)/Admin(관리자)/Server(ISR) 3가지 카테고리의 리포지토리를 제공한다.

> **API 스펙·실응답 샘플 참조**: [`docs/api/README.md`](docs/api/README.md) (public) · [`docs/api/admin/README.md`](docs/api/admin/README.md) (admin). `https://api.heritage-dx.com/api-docs-json` 기반 113 operations / 149 DTOs 의 도메인별 문서.

```
packages/api/
├── src/
│   ├── index.ts                          # Barrel export (client)
│   ├── server.ts                         # Barrel export (server)
│   ├── types.ts                          # ListParams, TradeListParams, PaginatedList
│   ├── normalizers/
│   │   └── normalize-list.ts             # 3가지 응답 포맷 통합 정규화
│   ├── interfaces/
│   │   ├── index.ts                      # GeneralRepositories, AdminRepositories 집합 타입
│   │   ├── general/                      # 8개 공개 API 인터페이스 (+customer.repository)
│   │   └── admin/                        # 13개 관리자 API 인터페이스
│   ├── repositories/
│   │   ├── general/                      # ApiClient 기반 공개 API 구현
│   │   ├── admin/                        # ApiClient 기반 관리자 API 구현
│   │   └── server/                       # OS ISR용 raw fetch 구현
│   ├── factories/
│   │   ├── create-general-repositories.ts
│   │   ├── create-admin-repositories.ts
│   │   └── create-server-repositories.ts
│   └── context/
│       └── RepositoryContext.tsx          # RepositoryProvider + useXxxRepository hooks
```

**General Repository (공개 API):**

| Interface | 메서드 |
|-----------|--------|
| `IClubRepository` | `getAll(params?)`, `getOne(code)` |
| `IScenarioRepository` | `getByClub(clubCode)`, `match(conditions)`, `getDocuments(...)` |
| `IConsultationRepository` | `getAll(params?)`, `create(data)`, `update(id, data)`, `delete(id)`, `approvalAction(id, body)`, `createDraftFromText(input)` (POST `/consultations/ai`), 메모 CRUD: `addNote(id, {content})` / `updateNote(id, noteId, {content})` / `deleteNote(id, noteId)` — 응답은 갱신된 notes 만 (`ConsultationNotesData = {notes: {entries: [...]}}`); 다른 mutation 과 달리 전체 Consultation 이 아니다. store 는 기존 entity 의 다른 필드를 보존한 채 notes 만 patch (`mergeNotesIntoItem`). content 1-500자/최대 100 entry/작성자 본인·관리자만 수정 삭제 가능/완료 거래 연결 시 차단 등은 서버 검증. `IConsultationAdminRepository` 도 동일 메소드 노출(`/admin/consultations/:id/notes` 경로) — 관리자는 작성자 제한 없이 모든 메모 수정 가능. ⚠️ admin /notes 엔드포인트는 현재 백엔드 swagger 에 부재 — 호출 시 404 가능, 별도 정리 필요 |
| `IMembershipTradeRepository` | `getAll(params?)`, `create(data)`, `update(id, data)`, `delete(id)`, `workflowAction(id, body)` |
| `IClaimRepository` | `create(data)` |
| `IMarketPriceRepository` | `listByMembership(membershipId, { from, to })` |
| `INoticeRepository` | `list(params?)`, `create(input)`, `update(id, input)`, `delete(id)` |
| `ICustomerRepository` | `getAll(params?)`, `getOne(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `getHistory(id)`, `getHistorySummary(id)` |
| `ISettlementRepository` | `createDraft(consultationId)` (POST /settlements/draft, in-memory 산출), `create(data)`, `getOne(consultationId)`, `update(consultationId, partial)`, `markDocumentGenerated(consultationId)` (PATCH `/document-generated` — 승인 요청 게이트), `delete(consultationId)`. 상담 1건 ↔ 입출금표 1건 |

- `packages/api/src/interfaces/general/notice.repository.ts` — `INoticeRepository` 인터페이스 (`NoticeListParams`, `list`, `create`, `update`, `delete`). 읽기는 `/notices` 공개 엔드포인트, 쓰기는 `/admin/notices` 관리자 엔드포인트(서버측 토큰 검증)로 라우팅.
- `packages/api/src/repositories/general/notice.repository.impl.ts` — `ApiClient` 기반 구현체

**Admin Repository (관리자 API):** 15개 — clubs, scenarios, documents, club-documents, scenario-documents, club-scenario-documents, club-scenarios, global-documents, customer-documents, users, organizations, memberships, kpi, **consultations**(`/admin/consultations*` + `approvalAction`), **membershipTrades**(`/admin/membership-trades*` + `workflowAction`)

#### 승인 워크플로우

상담(`approvalStatus`)과 거래(`workflowStatus`)는 한 enum을 공유하되, **2026-04 변경**으로 거래는 진행 단계(세무신고/완료)가 추가됐다. 응답 필드명은 상담이 `approvalRequestedAt`/`firstApprovedAt`/`linkedTradeId`, 거래가 `submittedForFinalReviewAt`/`finalApprovedAt`/`finalRejectedAt`/`finalRejectionReason`로 분리. (`holdReason`/`rejectionReason`은 deprecated, 과거 데이터 호환만)

- **상담 상태**: `IN_CONSULTATION(상담중) → PENDING_DEPOSIT(계약금 대기) → DEPOSIT_APPROVED(계약금 승인)`. (구 `DRAFT`/`PENDING_APPROVAL`/`FIRST_APPROVED` 는 각각 `IN_CONSULTATION`/`PENDING_DEPOSIT`/`DEPOSIT_APPROVED` 로 명칭 변경됨 — enum 호환을 위해 코드에는 deprecated 로 남아 있음.) `ON_HOLD`/`REJECTED` 는 도달 불가하며 deprecated.
- **거래 상태**: 상담 APPROVE_FIRST 이후 자동 생성된 거래는 진행 단계(`TAX_FILING → COMPLETED` 등)로 전환. 정확한 enum 이름은 백엔드 신규 스펙 캡처(Phase B) 후 확정.
- **상담중(DRAFT)** 은 닫는 개념이 없는 디폴트 상태(반대 매물 매칭 탐색용).
- **액션 분기**:
  - 공개 상담 (`PATCH /consultations/:id/approval-action`) — `REQUEST_APPROVAL` 만.
  - 관리자 상담 (`PATCH /admin/consultations/:id/approval-action`) — `APPROVE_FIRST`(거래 자동 생성) | `REOPEN`(거래내역 이관 *전* 무산 → 상담을 DRAFT 로 복귀).
  - 관리자 거래 (`PATCH /admin/membership-trades/:id/workflow-action`) — `ADVANCE_TO_TAX_FILING` | `ADVANCE_TO_COMPLETED` | `REJECT`(거래 레코드 물리 삭제 + 원천 상담 DRAFT 복귀 + 다른 거래 없으면 고객 등급 `ACTIVE_DEAL → HIGH_INTENT` 자동 하향).
- **공개 거래 mutation 엔드포인트는 모두 제거**(`POST/PUT/DELETE /membership-trades`, `PATCH .../workflow-action`). 거래는 상담 APPROVE_FIRST 시 백엔드가 자동 생성하므로 사용자가 직접 만들 수 없다. 따라서 `IMembershipTradeRepository`(general)는 `getAll`/`getOne`만 노출하고, 공개 store/hook도 read-only.
- **상담 → 거래 연결**: APPROVE_FIRST 시 서버가 거래 초안 생성 + 원천 상담에 `linkedTradeId` 세팅 + 거래에 `sourceConsultationId`. 거래 REJECT/삭제 시 자동으로 상담 DRAFT 복귀 + `approvalRequestedAt/By` 초기화.
- **타입 좁히기**: `UserConsultationAction` / `AdminConsultationAction` / `AdminTradeAction` 으로 역할별 액션을 분리(`packages/types/src/approval.ts`). 광역 `AdminApprovalAction` 은 제거됐다.
- **DTO**: `ApprovalActionInput<A extends ApprovalAction = ApprovalAction> { action: A; reason? }` — 호출부에서 좁은 union을 전달.

#### v1 운영 정책 적용

- **상담일지 = 리드/재작업 장부**, **거래내역 = 계약금 이후 실행 + 월별 매출 집계 장부**. 전환 시점은 계약금 입금 확인 시점.
- **상담 리스트 기본 필터**: OS/BO 모두 `isConverted=false` 기본. FIRST_APPROVED 건은 "거래 전환 완료 포함" 토글로 노출.
- **APPROVE_FIRST 가드 (2026-05-08 갱신)**: BO "계약금 확인" 버튼이 `depositAmount > 0` AND `settlementDocumentGenerated === true` 둘 다 충족할 때만 활성화. 백엔드가 입출금표 문서 생성 완료를 별도 게이트로 두며 미충족 시 400 거부. APPROVE_FIRST 처리 시 상담을 거래내역으로 전환하고 `settlement.membershipTradeId` 에 거래 ID 를 연결한다. 상담 응답에 `settlementId / settlementDocumentGenerated / settlementDocumentGeneratedAt` 메타가 포함된다.
- **REQUEST_APPROVAL 게이트 (2026-05)**: OS의 ApprovalRequestSheetModal 이 "승인 요청 보내기" 클릭 시, REQUEST_APPROVAL 액션 직전에 `PATCH /api/settlements/:consultationId/document-generated` 를 호출하여 입출금표 문서 생성 완료를 백엔드에 마킹한다. 백엔드는 이 마킹이 있어야 다음 상태로 전이하도록 검증한다.
- **REOPEN vs REJECT**: REOPEN은 거래 이관 직전 단계에서 무산(상담 DRAFT 복귀), REJECT는 거래 이관 후 무산(거래 물리 삭제 + 상담 DRAFT 복귀). 둘 다 `ActionReasonModal`로 사유를 받는다.
- **완료 거래 락**: COMPLETED 거래 자체와 그 거래에 연결된 상담은 수정/삭제가 서버에서 거부된다. UI는 가드 노출.
- **삭제 권한**: `canDeleteConsultation(user, cons)` — `FIRST_APPROVED`/`linkedTradeId` 있는 상담은 대표/백오피스만 삭제. `canDeleteTrade(user)` — 거래내역은 항상 대표/백오피스만 삭제. OS/BO 삭제 버튼 모두 가드 적용.

**Server Repository (ISR):** `IClubRepository`, `IScenarioRepository` — raw `fetch()` + `{ next: { revalidate } }`

**Factory 함수:**
- `createGeneralRepositories(apiClient)` → `GeneralRepositories`
- `createAdminRepositories(apiClient, baseUrl)` → `AdminRepositories`
- `createServerRepositories({ baseUrl, revalidate })` → `ServerRepositories`

**React Context:**
- `RepositoryProvider` — general/admin 리포지토리 주입
- `useClubRepository()`, `useScenarioRepository()`, `useConsultationRepository()`, `useMembershipTradeRepository()`, `useClaimRepository()` — 공개 convenience hooks
- `useConsultationAdminRepository()`, `useMembershipTradeAdminRepository()` — 관리자 convenience hooks (백오피스 승인 UI에서 사용)
- `useNoticeRepository()` — notice general 리포지토리 convenience hook (훅 내부에서만 소비)
- `useMarketPriceRepository()` — market-price general 리포지토리 convenience hook (훅 내부에서만 소비)
- `useCustomerRepository()` — customer general 리포지토리 convenience hook (OS/BO 고객 페이지, 고객 자동완성, 이력 조회에서 사용)
- `useGeneralRepositories()`, `useAdminRepositories()` — 집합 hooks

### 4.5. `@heritage-dx/store`

Entity 타입 + DTO→Entity Mapper + Zustand 기반 캐시 스토어. API 응답(DTO)을 프론트엔드 친화적인 Entity로 정규화하고, stale-while-revalidate 캐싱을 제공한다.

```
packages/store/
├── src/
│   ├── index.ts              # 클라이언트 barrel export (stores, hooks, entities, mappers, domain)
│   ├── domain/               # 도메인 순수 로직 (React/I/O 금지)
│   │   ├── auth/             # 역할·권한 도메인
│   │   │   ├── index.ts      # 배럴 export
│   │   │   └── roles.ts      # ROLE_LABELS, ROLE_BADGE_VARIANTS, canManageOrg, canAccessUsersPage, canDeleteConsultation, canDeleteTrade, getAssignableRoles
│   │   ├── kpi/              # KPI 기간·버킷·집계 타입 도메인
│   │   │   ├── index.ts      # 배럴 export
│   │   │   ├── periods.ts    # PeriodPreset, KpiFilters, PRESET_GROUPS, getDateRange, getTimeBuckets, toConsultationDateField
│   │   │   └── types.ts      # KpiSummary, TrendDataPoint, EmployeeKpiData, KpiMetric
│   │   └── tax/              # 세금·수수료 도메인
│   │       ├── index.ts      # 배럴 export
│   │       ├── types.ts      # TaxRateSettings, CalculatorInput, CalculationResult 등
│   │       ├── defaults.ts   # DEFAULT_TAX_SETTINGS, 누진 구간표, TAX_DESCRIPTIONS
│   │       └── calculator.ts # calculateTax(input, settings) 순수 함수 (4시나리오)
│   ├── entities/             # 도메인 Entity 타입
│   │   ├── index.ts
│   │   ├── common.ts         # PaginationState, FetchStatus
│   │   ├── club.ts           # ClubEntity, ClubDetailEntity (서브 객체 그룹핑)
│   │   ├── consultation.ts        # ConsultationEntity (+ approvalStatus/linkedTradeId/depositAmount) + collectMissingConsultationApprovalFields(entity) — 승인 요청 전 누락 필드 감지 (structural vs fillable 분리)
│   │   ├── consultation-ai.ts     # ConsultationAi* 6종 type re-export — POST /consultations/ai 의 입력/응답 타입을 뷰 레이어가 @heritage-dx/store 로 import 할 수 있게 한다 (lint 의 @heritage-dx/types 직접 import 금지 규칙 대응)
│   │   ├── membership-trade.ts    # MembershipTradeEntity (+ workflowStatus/sourceConsultationId/depositAmount)
│   │   ├── membership.ts     # MembershipEntity
│   │   ├── scenario.ts       # ScenarioEntity, ScenarioSide, ScenarioOwnerType, ScenarioWithDocsEntity, ScenarioMatchFilters, ScenarioBasicCode, ScenarioAccentTokens + scenarioMatchesFilters, findMatchingScenario, SCENARIO_BASIC_LABEL, SCENARIO_BASIC_ACCENT, getScenarioBasicLabel, getScenarioBasicAccent
│   │   ├── document.ts       # DocumentEntity, GlobalDocumentEntity 등 + isDocumentExpired, isDocumentDownloadable
│   │   ├── organization.ts   # OrganizationEntity
│   │   ├── user.ts           # UserRole, UserEntity, AdminUserEntity
│   │   ├── employee.ts       # EmployeeEntity
│   │   ├── customer.ts       # CustomerEntity (+ ageBracket/occupation/ownedMembershipSummary/customerGrade(read-only)/residenceArea — 2026-04 추가). OwnedMembershipEntity[] (clubId/membershipId/status/quantity/note/displayOrder + clubName/membershipName join), OWNED_MEMBERSHIP_STATUS_LABEL (OWNED/SELLING/TRANSFER_PENDING/SOLD/UNKNOWN ↔ 보유/매도중/명의이전중/매도완료/알 수 없음 — 백엔드 검증 2026-05-07), getOwnedMembershipStatusLabel — 2026-05 추가
│   │   ├── settlement.ts     # SettlementEntity (입출금표 — 상담 1:1, 백엔드 응답 기준 평탄 필드: 메타 + 헤더(membershipName/tradeDate/salesContractAmount/remarks) + 매도/매수(sellName/sellPhone/sellDealerId/sellEntityType/sellMembershipAmount/sellCommissionDeducted, buy 계열 동일)), SettlementCellKey, SETTLEMENT_CELL_KEYS const, EMPTY_SETTLEMENT_ENTITY 헬퍼
│   │   ├── club-document.ts  # ClubDocumentEntity, ClubScenarioDocumentEntity
│   │   └── memo-history.ts   # `flattenMemoHistoryNotes(notes)` 만 — 백엔드가 notes JSONB 로 정규화되면서 client-side `__MEMO_V1__` 인코딩/디코딩 경로는 폐기. 단일 텍스트 필드(예: customer.memo) 에 과거 마커가 흘러들어왔을 때 `flattenMemoHistoryNotes` 로 entries content 를 시간순 join 한 plain text 로 정규화 (마커 없으면 통과, 파싱 실패 시 데이터 손실 방지로 원본 유지)
│   ├── mappers/              # DTO ↔ Entity 변환 (순수 함수)
│   │   ├── index.ts
│   │   ├── club.mapper.ts
│   │   ├── consultation.mapper.ts
│   │   ├── customer.mapper.ts       # mapCustomerDtoToEntity (memo 는 flattenMemoHistoryNotes 로 정규화 — `__MEMO_V1__` 마커가 들어오면 entries.content 시간순 join, ownedMemberships 는 displayOrder 오름차순 정렬), mapCustomerEntityToInput, mapCustomerEntityToUpdateInput (ownedMemberships 키가 명시 entry 일 때만 페이로드에 포함 — 미포함=유지/[]=전체삭제/[...]=전체교체), mapOwnedMembershipDtoToEntity, mapOwnedMembershipEntityToInput
│   │   ├── settlement.mapper.ts     # mapSettlementDtoToEntity (SETTLEMENT_CELL_KEYS 로 알려진 셀만 흡수), mapSettlementEntityToInput (POST /api/settlements 전체 페이로드, documentGenerated 계열/createdAt 제외), mapSettlementEntityToUpdateInput (partial entity → PUT 페이로드, dirty 키만)
│   │   ├── membership-trade.mapper.ts
│   │   ├── membership.mapper.ts
│   │   ├── scenario.mapper.ts
│   │   └── document.mapper.ts
│   ├── schemas/              # 도메인 Zod 검증 스키마 (React/Browser API 금지)
│   │   ├── index.ts          # 배럴 export
│   │   ├── _shared.ts        # optionalNumber preprocess 헬퍼
│   │   ├── club.schema.ts    # clubBaseSchema, clubDetailSchema + ClubFormValues, ClubDetailFormValues
│   │   ├── scenario.schema.ts# createScenarioSchema, updateScenarioSchema + normalizeSide/OwnerType
│   │   ├── membership.schema.ts # membershipSchema + MembershipFormValues
│   │   └── document.schema.ts   # documentSchema + DocumentFormValues
│   ├── stores/               # Zustand 스토어 (stale-while-revalidate)
│   │   ├── index.ts
│   │   ├── club.store.ts     # 목록 캐시 + 상세 캐시 (Map<code, detail>)
│   │   ├── consultation.store.ts           # general — requestApproval (REQUEST_APPROVAL 만) + 메모 CRUD: addNote/updateNote/deleteNote(id, [noteId,] content) — 각각 `repos.consultations.{addNote|updateNote|deleteNote}` 호출. 응답은 부분 응답(`{notes: {entries:[...]}}`)이므로 `mergeNotesIntoItem` 헬퍼가 기존 item 의 다른 필드를 보존한 채 notes/updatedAt 만 patch (전체 entity 교체 시 거래유형/골프장/고객명 등이 undefined 가 되어 행이 빈 미정으로 보이는 버그 회귀 방지). REOPEN/HOLD/REJECT 모두 제거됨
│   │   ├── membership-trade.store.ts       # general — read-only (mutation 메서드 모두 제거)
│   │   ├── consultation-admin.store.ts     # admin — approveFirst / reopen 만 (HOLD/REJECT/REQUEST_APPROVAL 제거)
│   │   ├── membership-trade-admin.store.ts # admin — advanceToTaxFiling / advanceToCompleted / reject (REJECT는 응답 후 로컬 목록에서 제거)
│   │   ├── customer.store.ts               # CRUD + searchByQuery + getOne/getHistorySummary
│   │   └── settlement.store.ts             # 입출금표 store — byConsultation: Record<id, entity> 캐시, actions: createDraft (in-memory, 응답 envelope 한 단계 풀어 `{entity, missingFields}` 반환)/create (첫 persist)/fetchOne/update/markDocumentGenerated/remove. PATCH /document-generated 결과로 entity 캐시 갱신
│   └── hooks/                # 컴포넌트용 편의 훅
│       ├── index.ts
│       ├── useClubs.ts
│       ├── useClubDetail.ts
│       ├── useConsultations.ts
│       ├── useMembershipTrades.ts
│       ├── useConsultationsAdmin.ts
│       ├── useMembershipTradesAdmin.ts
│       ├── useScenarioOptions.ts   # 시나리오 필터 옵션 조회
│       ├── useScenarioDocuments.ts # 시나리오별 구비서류 조회 (mapper 내장)
│       ├── useGlobalDocuments.ts   # 전역 서류 목록 조회
│       ├── useClubDocuments.ts     # 클럽별 서류 목록 조회
│       ├── useClaims.ts            # 건의사항 제출 (mutation-only)
│       ├── useKpi.ts               # KPI 저수준 fetch 함수 노출 (fetchTrades, fetchConsultations, fetchEmployees)
│       ├── useKpiSummary.ts        # KpiFilters → KpiSummary (이번 달 요약 등)
│       ├── useKpiSeries.ts         # KpiFilters → TrendDataPoint[] (버킷별 추이)
│       ├── useKpiByEmployee.ts     # KpiFilters + employees → EmployeeKpiData[]
│       ├── useUsers.ts             # 사용자 목록 조회 (read)
│       ├── useUserMutations.ts     # 사용자 CRUD + 비밀번호 초기화 (write)
│       ├── useMyOrganization.ts    # 나의 조직 정보 조회
│       ├── useNotices.ts           # 공지사항 목록 조회 (read)
│       ├── useNoticeMutations.ts   # 공지사항 CRUD (write)
│       ├── useMarketPrices.ts      # 회원권 시세 추이 조회 (membershipId, period)
│       ├── useCustomers.ts         # 고객 CRUD + searchByQuery + getOne/getHistorySummary
│       ├── useFavoriteConsultations.ts  # localStorage 즐겨찾기 (heritage-dx:consultation-favorites) — `FavoriteConsultationItem[]` ({id,label,subLabel?,href}) 저장. `toggleFavorite(id, meta?)` 시그니처 + 사이드바용 `favoriteItems` export. 레거시 string[] 자동 마이그레이션
│       ├── useRecentSearches.ts    # localStorage 최근 검색어 (heritage-dx:recent-searches:${scope}, 최대 8건). 사용 scope: `trades`(상담일지 페이지 검색/고객 chip), `customers`(사이드바 최근 항목 — `CustomersPageClient.handleSelect` 에서 push), `clubs`(골프장 검색 4종 UI 에서 선택 시 push — `kind:"club"`)
│       ├── useFavoriteClubs.ts     # localStorage 골프장 즐겨찾기 (heritage-dx:club-favorites) — `FavoriteClubItem[]` ({code,name,region?,holes?}) 저장. `toggleFavorite(code, meta?)` 시그니처. useFavoriteConsultations 와 동일하게 모듈 listener Set + storage 이벤트로 같은 탭/다른 탭 동기화
│       └── useTopClubs.ts          # 골프장 검색 UI 4종(`ClubSearchSelect`/`ClubSearchPanel`/`ClubSwitcher`/`GolfClubSearch`)이 공유하는 통합 hook. `useFavoriteClubs` + `useRecentSearches("clubs")` 결합 — **즐겨찾기를 우선 채우고**, 남은 슬롯을 최근 선택으로 보충하여 max(기본 5)개의 `topClubCodes` 반환. "clubs" scope 의 RecentSearchItem 은 `kind` 가 region 이든 `"club"` 이든 무관하게 모두 club 코드로 취급하여 누락되지 않게 한다(HomeClient 가 진입 시 region 을 kind 에 담아 push 해도 노출). 함께 `isFavorite`/`toggleFavorite`/`trackSelection` 도 노출하여 호출부에서 별도 hook 호출 없이 사용 가능
```

**Entity 설계 원칙:**
- DTO(API 응답)의 `string | number | null` → Entity에서 `number | null`로 정규화 (`coerceToNumber`)
- 관련 필드를 서브 객체로 그룹핑 (예: `ClubDetailEntity.basicInfo`, `MembershipTradeEntity.customer`)
- Union 리터럴 타입 활용 (`tradeType: '매수' | '매도'`)

**Mapper:**
- 순수 함수: `mapClubDtoToEntity(dto)`, `mapConsultationDtoToEntity(dto)`, `mapMembershipTradeDtoToEntity(dto)` 등
- 역방향: `mapConsultationEntityToInput(entity)`, `mapMembershipTradeEntityToInput(entity)` (쓰기용)
- 상담 매퍼는 응답의 `offerPrice`/`desiredPrice` (string numeric) → `coerceToNumber`로 `number | null` 변환
- `buildClubMembershipPair({ clubId, clubName, membershipId, membershipType })` — 백엔드가 `club`/`membership`을 모두 UUID 또는 모두 텍스트로만 받기 때문에, 두 ID가 모두 있을 때만 ID 모드로 보내고 하나라도 빠지면 텍스트 모드로 다운그레이드한다. 상담일지 생성/수정 페이로드 빌더(`mapConsultationEntityToInput`, 백오피스 `trade-memos/page.tsx`)에서 공용 사용
- API 포맷 변경 시 Mapper만 수정 → Entity/컴포넌트 영향 없음

**Store (Zustand):**
- `createClubStore(repos)` — 클럽 목록 + 상세 캐시, `hydrateClubs()`/`hydrateDetail()` (SSR→클라이언트)
- `createConsultationStore(generalRepos)` — CRUD + 낙관적 업데이트 + `requestApproval(id, patch?) → RequestApprovalResult`. patch가 하나라도 있으면 update → approvalAction 순차 실행(문자열은 trim 후 병합). `RequestApprovalResult = { entity, missingFillable?, errorMessage? }`. 서버가 `CONSULTATION_APPROVAL_REQUIRED_FIELDS` 로 missingFields를 내려주면 fillable 필드만 걸러 로컬 엔티티를 서버 기준으로 맞추고 `missingFillable`로 반환 → UI가 모달을 재오픈해 드리프트 자동 복구
- `createMembershipTradeStore(generalRepos)` — CRUD + `requestFinalReview`
- `createConsultationAdminStore(adminRepos)` — CRUD + `approvalAction`/`approveFirst`/`hold`/`reject`/`reopen`
- `createMembershipTradeAdminStore(adminRepos)` — CRUD + `workflowAction`/`approveFirst`/`hold`/`reject`/`reopen`
- `createCustomerStore(generalRepos)` — 고객 CRUD + `searchByQuery(query, limit)` (자동완성에서 소비) + `getOne(id)` (단건 조회 후 `mapCustomerDtoToEntity`) + `getHistorySummary(id)` (`mapCustomerHistorySummaryDtoToEntity` 적용해 `recentConsultations`/`recentMembershipTrades` 반환). `create` 결과는 `{ success, entity?, conflict?, errorMessage? }` 형태로 409(연락처 중복)를 플래그로 전달한다. `getOne`/`getHistorySummary` 는 신규 상담일지 작성 패널의 `MatchedCustomerCard` 가 소비.
- 패턴: 캐시 히트 → stale 데이터 즉시 반환 + 백그라운드 refresh

**Exports:**
- `@heritage-dx/store` — 전체 (entities, mappers, stores, hooks, domain/tax, domain/auth, domain/kpi)
- `@heritage-dx/store/entities` — Entity 타입만 (서버 안전)
- `@heritage-dx/store/mappers` — Mapper만 (서버 안전)
- `@heritage-dx/store/schemas` — Zod 폼 스키마 + 유추 타입 (club, scenario, membership, document)

**KPI Domain (`@heritage-dx/store`):**
- 타입: `PeriodPreset`, `DateField`, `KpiFilters`, `KpiSummary`, `TrendDataPoint`, `EmployeeKpiData`, `KpiMetric`
- 상수: `PRESET_GROUPS`
- 함수: `getDateRange`, `getMonthBuckets`, `getDailyBuckets`, `getWeeklyBuckets`, `getTimeBuckets`, `toConsultationDateField`
- 훅: `useKpiSummary(filters)`, `useKpiSeries(filters)`, `useKpiByEmployee(filters, employees)` — 모두 `{ data, isLoading, error: string | null }` 반환. `useKpiSeries`/`useKpiByEmployee`는 월/직원별 병렬 호출을 `Promise.allSettled`로 처리해 부분 실패를 보존하고, 실패가 있으면 `error`에 첫 에러 메시지가 세팅된다.

**Tax Domain (`@heritage-dx/store`):**
- 함수: `calculateTax(input, settings)`, `getScenarioLabel`, `getResultLabel`
- 상수: `DEFAULT_TAX_SETTINGS`, `DEFAULT_BROKERAGE_FEE_RATE`, `TAX_DESCRIPTIONS`, `CAPITAL_GAINS_TAX_BRACKETS`, `CORPORATE_TAX_BRACKETS`
- 타입: `TaxRateSettings`, `TaxBracket`, `CalculatorInput`, `CalculationResult`, `TaxCalculationItem`, `TaxScenario`, `EntityType`, `TransactionType`

### 4.6. `@heritage-dx/auth`

인증 컨텍스트와 API 팩토리.

**`createAuthApi(authBaseUrl)`** — Factory 함수:
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `login(email, password)` | `POST /auth/login` | 로그인 |
| `logout()` | `POST /auth/logout` | 로그아웃 |
| `me()` | `GET /auth/me` | 현재 사용자 조회 |
| `refresh()` | 위임 → `tryRefreshToken()` | 토큰 갱신 |
| `changePassword(data)` | `POST /auth/change-password` | 비밀번호 변경 |

**`AuthProvider`** — React Context Provider:
- Props: `authApi`, `loginPath`, `onLoginSuccess`
- 앱 시작 시 `authApi.me()`로 세션 확인
- 14분 주기 토큰 refresh (`setInterval`)
- 인증 만료 시 `setAuthExpiredHandler` → 로그인 리다이렉트

**`useAuth()`** 훅 반환값:
```typescript
{ user: User | null, isLoading: boolean, login, logout, updateUser }
```

### 4.7. `@heritage-dx/ui`

12개 공유 UI 컴포넌트. 두 앱 모두에서 사용.

| 컴포넌트 | 설명 | Back Office | OS |
|----------|------|:-----------:|:--:|
| `Button` | 5개 variant (primary, secondary, outline, ghost, danger), 3개 size (sm, md, lg), 로딩 상태 | O | O |
| `Input` | 폼 입력 필드 (label, error, helperText) | O | O |
| `Textarea` | 멀티라인 입력 | O | - |
| `Select` | 드롭다운 선택 | O | - |
| `Card` / `CardHeader` / `CardTitle` / `CardContent` | 카드 레이아웃 | O | - |
| `Badge` | 뱃지/태그 | O | - |
| `Modal` / `ConfirmModal` | 모달 다이얼로그 (sm/md/lg/xl, ESC 닫기) | O | O |
| `Drawer` | 사이드 드로어 | - | - |
| `Table` | 데이터 테이블 | O | - |
| `Loading` / `PageLoading` | 로딩 인디케이터 | O | O |
| `Tabs` | 탭 네비게이션 | - | - |
| `ClubSearchSelect` | 골프장 검색 선택 | - | O |

### 4.8. `@heritage-dx/typescript-config`

3개의 TypeScript 설정 프리셋.

| 설정 | 용도 | 특이사항 |
|------|------|---------|
| `base.json` | 기본 설정 | ES2017, strict, bundler resolution |
| `nextjs.json` | Next.js 앱 | `jsx: "preserve"`, Next.js plugin |
| `react-library.json` | React 라이브러리 | `jsx: "react-jsx"` |

### 4.9. `@heritage-dx/tailwind-config`

공유 Tailwind CSS 테마 + `globals.css`.

**전역 폰트:** 양쪽 앱 `layout.tsx`에서 `next/font/google`로 Inter(400~800) + Noto Sans KR(400~900)을 로드해 `--font-inter` / `--font-noto-sans-kr` CSS 변수로 주입. 각 앱의 `globals.css` `body`가 두 변수를 폰트 스택의 최우선으로 사용. 로그인 페이지의 `font-extrabold` 등 두꺼운 굵기 합성 깨짐을 방지하기 위함.

**커스텀 색상 팔레트:**
```
primary:    #000000
background: #ffffff / #f9fafb (secondary) / #f3f4f6 (tertiary)
border:     #e5e7eb / #d1d5db (dark)
text:       #111827 (primary) / #6b7280 (secondary) / #9ca3af (tertiary)
success:    #22c55e / #dcfce7 (light)
error:      #ef4444 / #fee2e2 (light)
info:       #3b82f6 / #dbeafe (light)
```

### 4.10. `@heritage-dx/eslint-config`

ESLint 9 flat config 공유 패키지. `eslint-config-next`의 `core-web-vitals` + `typescript` preset을 `FlatCompat`로 래핑해 export. 두 앱이 각자의 `eslint.config.mjs`에서 import하여 사용. `scripts/`, `.next/`, `dist/`, `node_modules/` 자동 ignore 포함.

- `packages/eslint-config/index.mjs` — flat config 배열 default export
- 소비처: `apps/os/eslint.config.mjs`, `apps/back-office/eslint.config.mjs`

**레이어링 강제 (A-0-10)**: `**/src/components/**/*.{ts,tsx}` 스코프에 `no-restricted-imports` 적용.
금지 대상: `@heritage-dx/types`(`/*` 포함), `@heritage-dx/api-client`(`/*` 포함), `**/mappers/*`, `**/normalizers/*`, `**/repositories/*`.
위반 시 `pnpm lint` / `turbo lint` 가 error 로 실패해 CI 차단.

---

## 5. 앱별 아키텍처

### 5.1. OS (공개 사이트) — 포트 3000

골프장 정보 조회, 회원권 시세, 거래 상담을 위한 고객 대면 앱.

#### 라우트 구조

```
/app
├── layout.tsx                    # 루트 레이아웃 (+ next/font: Inter + Noto Sans KR)
├── page.tsx                      # 홈 대시보드 (DashboardClient — 골프장 정보 hub + 공지사항)
├── error.tsx                     # 에러 바운더리
├── global-error.tsx              # 글로벌 에러 핸들러
├── login/page.tsx                # 로그인
├── api/geocode/route.ts          # 지오코딩 API Route
├── api/notifications/send/route.ts # FCM 푸시 알림 전송
├── clubs/
│   ├── page.tsx                  # 골프장 디렉토리/검색
│   └── loading.tsx               # 로딩 스켈레톤
├── trades/page.tsx               # 거래 메모 (상담 기록)
├── customers/
│   ├── page.tsx                  # 고객 관리 목록 (CRUD)
│   └── [id]/page.tsx             # 고객 상세 페이지 (시안 적용 + 인라인 편집)
└── claims/page.tsx               # 건의사항
```

#### 컴포넌트 (51개 — top-level 34, `club-profile/` 14, `sheet-common/` 3 [.tsx 2 + .module.css 1])

**코어:**
`AuthGuard`, `ClientLayout`, `AppShell`, `Sidebar`, `AppHeader`, `MobileNavigation`, `GoogleAnalytics`

**레이아웃 셸**: `ClientLayout` 안 `AuthGuard` 안에 `AppShell` 을 둔다. `AppShell` 은 `pathname === "/login"` 일 때 children 만 통과(풀스크린 로그인 페이지). 그 외에는 좌측 `Sidebar`(다크 #1a1a1a, 헤더 보더 #2a2a2a)와 상단 `AppHeader`(57px, 흰색, 좌측 라우트 아이콘+페이지 제목 / 우측 사용자 role 라벨 + 로그아웃 텍스트 버튼) 를 렌더한다. 사이드바는 데스크톱에서 218px(확장) ↔ 64px(축소) 두 상태를 헤더 토글 버튼(`PanelLeftClose`/`PanelLeftOpen`)으로 전환하며 상태는 `localStorage["heritage-os.sidebar.collapsed"]` 에 영속화. 메뉴는 `홈(/, Home)`, `골프장 검색(/clubs, Flag)`, `고객 관리(/customers, Users)`, `상담일지(/trades, BookOpen)`, `건의 사항(/claims, MessageSquare)` 순 — 홈만 정확 경로(`pathname === "/"`)에서 활성화되고 나머지는 prefix 매칭. 확장 상태에서만 "즐겨찾기"·"최근 항목" 섹션이 노출되며 둘 다 `@heritage-dx/store` 의 localStorage 훅에 연결된다 — **즐겨찾기**는 `useFavoriteConsultations().favoriteItems` (TradesPageClient 별 아이콘 토글에서 `{label: 고객명·골프장명, subLabel: 유형·일자, href: /trades?expand=<id>}` 메타 저장. 클릭 시 `/trades?expand=<id>` 로 이동하면 해당 행이 자동 펼쳐짐), **최근 항목**은 `useRecentSearches("customers")` (행 클릭으로 `/customers/<id>` 진입 시 `CustomerDetailClient` 가 push, 사이드바 클릭 시 동일 라우트로 이동). 빈 상태일 땐 한 줄 안내 텍스트가 노출된다. 모바일(`< lg`)에서는 햄버거 → 슬라이드 오버레이로 항상 확장 상태 표시(`<Sidebar forceExpanded />`). 페이지 제목 매핑은 `apps/os/src/lib/breadcrumb.ts`(`getPageTitle`), 라우트 아이콘·role 라벨 매핑은 `AppHeader` 내부 상수(`PAGE_ICONS`, `ROLE_LABELS`).

**골프장:**
`ClubProfile`, `ClubDirectory`, `GolfClubDetail`, `GolfClubTable`, `GolfClubSearch`, `NaverMap`, `MapSidebar`

**골프장 검색** (`club-search/`):
`ClubSearchPanel`: `/clubs` 디렉토리 뷰. 검색 입력 + 지역 칩(`전체` + `@heritage-dx/utils` `REGION_GROUPS` 를 순회해 자동 생성: 수도권/강원도/충청도/전라도/경상도/제주도/해외) + 한글 초성 박스(`INITIALS` + `0-9` 디바이더) + 카드 그리드. 그리드는 뷰포트 폭에 따라 단계적으로 컬럼 수가 변하는 반응형(`grid-cols-1 sm:2 lg:3 xl:4 2xl:5`). 카드는 지역(utils 정본 라벨)/운영타입/홀수 배지 + 골프장명 + 주소 + 연락처. 컨테이너 `max-w-[1500px]`. `useClubs(clubStore)` 로 전체 목록을 받고 검색·필터링은 클라이언트에서 메모이즈. 지역 분류는 `getRegionGroup(getEffectiveRegion(region, address))`. '해외' 그룹은 한국 시/도 키워드 어느 것과도 매칭되지 않는 region(예: `일본`, `베트남`) 을 자동으로 모은다. **로컬 region 유틸 중복 제거 (2026-05)**: 이전엔 `ClubDirectory` 가 자체 `INITIALS`/`REGION_GROUPS`/`PROVINCE_TO_GROUP`/`getRegionGroup`/`extractRegionFromAddress`/`getEffectiveRegion` 을 정의하고 `HomeClient`/`ClubSwitcher` 가 거기서 re-export 를 import 했는데, 모두 `@heritage-dx/utils` 직접 import 로 일원화. back-office Sidebar 와 `/clubs` 페이지의 region 버튼도 동일한 `REGION_GROUPS` 를 참조하므로 '해외' 탭이 자동 노출된다.

**골프장 프로필 섹션** (`club-profile/`):
`ClubBasicInfoTable`, `MembershipInfoSection`, `EstimateSection`, `CostCalculatorSection`, `GreenFeeField`, `InfoField`, `BenefitsSheetSection`, `DocumentsSection`, `MarketPriceSummary`, `NearbyClubPrices`, `PriceChart`, `SectionCard`, `ClubSwitcher`, `SoldPriceBanner`

**시트 공용 디자인 (`sheet-common/` — 2026-05 혜택지/견적서 리디자인)**: 골프장 프로필의 `혜택지` / `견적서` 두 탭이 공유하는 A4 1페이지 컴팩트 레이아웃. 새 시각 시스템은 모노크롬 + Pretendard + 섹션 헤더 underline + KV 2컬럼 그리드 + sharp border, hover/focus highlight 는 emerald → neutral/yellow (`#f7f8fa` hover / `#fffbe6` focus). `apps/os/src/components/sheet-common/` 에 분리: `sheet.module.css` (CSS Modules — 디자인 토큰 + `.sheetStage`/`.paper`/`.kvGrid`/`.kvRow`/`.editCell`/`.tbl`/`.docFoot`/`.psChip` 등), `SheetToolbar` (좌 `혜택지|견적서` 라벨 + vertical separator + 옵션 `클릭 편집` 뱃지 / 우 인쇄·JPEG pill 버튼), `PrintItemSelector` (혜택지 전용 chip 그리드 셀렉터 — `groups: { title, items: { key, label, hasData? }[] }` props, `hidden:Set<string>`/`onChange` 로 외부 상태 연결, 헤더 토글로 접힘). 시트 본문은 `.paper`(794×1123 min-height, padding `28px 40px 80px`, position:relative) 안에 섹션이 자연 배치되고 `.docFoot` 는 position:absolute로 항상 A4 바닥에 고정. 데이터가 길어지면 페이퍼는 자연스럽게 늘어나고, 인쇄/JPEG 경로는 기존 `sheet-print.ts` 의 fit-to-page zoom 로직이 그대로 처리 (변경 없음). `MembershipInfoSheet`(혜택지 본문)과 `EstimateSheet`(견적서 본문)는 둘 다 이 시스템 사용. `MembershipInfoSheet` 섹션 = 골프장 정보 (KV 그리드) / 회원권 정보 (KV + multiline med/tall) / 그린피 정보 (`.gfWrap` — 평일/주말 × 회원유형 테이블 + 카트비/캐디비 카드) / 기타 비용 + 기타 사항 (`.etcRow` 좌우 분할: 비용 4컬럼 테이블 + 메모 영역). `EstimateSheet` 섹션 = 수신자 정보 / 공급자 정보 / 견적 내역 (회원권명/{tradeType}금액/명의개서료/중개수수료/인지세/기타비용 + 합계/계약금/잔금 sumHead/sumRow) / `{매수|매도}시 구비서류` / disclaimer notes. 매수·매도 토글은 시안의 별도 카드 대신 제목 안 inline 버튼(`.tradeToggle` global selector) 유지 — 클릭하면 `onTradeTypeChange("매수"↔"매도")` 호출 + 구비서류·라벨 자동 전환. 컨테이너는 `BenefitsSheetSection`(툴바 + PrintItemSelector + `MembershipInfoSheet`)과 `EstimateSection`(툴바 + `EstimateSheet`)이며 `useSheetStorage`(localStorage `hdx:sheet:{clubCode}:{benefits|estimate}`) 의 `fieldOverrides`/`hiddenItems`/`customItems` 모델은 그대로 - 인라인 편집/항목 hide-show/커스텀 항목 추가 기능 유지. **`MembershipInfoSheet` 의 인라인 편집 셀 컴포넌트(`KVRow`, `CustomRows`)는 module scope 에 선언** - 부모 함수 안에 두면 매 렌더마다 새 function reference 가 만들어져 React 가 다른 component type 으로 간주하고 `<input>`/`<textarea>` 를 unmount/remount 시켜 포커스가 끊기는 (한 글자 입력 후 다음 키 입력 불가) 증상이 생긴다. 부모 컴포넌트는 `kvCtx = { hiddenItems, fieldOverrides, isEditable, onFieldOverrideChange }` 를 한 번 조립해 `<KVRow {...kvCtx} .../>` 로 spread 하고 `<CustomRows customItems={...} onCustomItemsChange={...} />` 는 따로 prop drilling. `EstimateSheet` 은 component 가 아닌 helper 함수(`renderText`/`renderNumWithAuto`)로 JSX element 를 값으로 반환하므로 reconciler 가 input 을 remount 시키지 않는다 (inner 정의여도 안전).

**ClubProfile 화면 구조 (2026-05 detail.html V3 기반 재설계)**: 글로벌 `AppHeader` 의 actions 슬롯은 비우고(`setActions(null)`) `ClubSwitcher` 는 본문 sticky 툴바로 이동. ClubProfile 본문 최상단은 단일 sticky 툴바 한 줄로 `ClubSwitcher (88CC + 다른 골프장으로 이동)` · `36홀` · `[개인|법인]` 사각 토글 · `[membershipName ...]` pill 토글(필터된 `memberships[]` 을 회색 트랙 안 흰색 active pill 로 노출 — 데이터에 정/준회원 외 다양한 종류가 있어도 모두 동적 렌더) · 우측 `매물 시세 · 갱신일` · `[지도]` · `[상담일지]` 버튼. 그 아래 `SoldPriceBanner` (선택 회원권 `dealerPriceRange` + `{개인|법인}-{membershipName} 기준` 컨텍스트), 탭 바 `회원권 정보 / 혜택지 / 견적서`, 회원권 정보 탭은 6개 `SectionCard` 2열 그리드(`01 골프장 정보` / `02 회원권 정보` / `03 그린피 정보` / `04 시세 추이` / `05 기타 비용` / `06 구비서류`). 회원권 선택은 `selectedMembershipIndex` (filtered 인덱스) 로 단일 source-of-truth, `ownerType` 또는 `detail.code` 변경 시 0으로 리셋.

**회원권/거래:**
`MembershipCalculator`, `MembershipInfoSheet`, `RequiredDocuments`, `TradesPageClient`, `TransactionTypeForm`, `TradeMemoSidebar` — `TradesPageClient` 의 메모 입력은 단일 `notes`/`remarks` 텍스트 필드를 폼에서 제거하고, 행을 펼치면 나타나는 인라인 패널에서 메모 entry(`ConsultationNoteEntry[]`)에 누적 기록한다. 저장은 `addNote(id, content)` 훅이 `POST /consultations/:id/notes` 호출 후 응답으로 entity 동기화 — 더 이상 클라이언트가 인코딩/디코딩하지 않는다(서버가 JSONB 로 보유). **TradesPageClient (2026-04 시안 적용)**: 페이지 셸은 좌(스크롤되는 main, 필터 카드 + 테이블 카드) / 우(560px 인라인 push aside `TradesCreatePanel`) flex 행 구조. 인라인 폼은 제거되고 새/수정은 push panel 로 통일. 필터 카드는 (1) 상단 큰 검색 바 + 클리어 버튼 + `/` 단축키 힌트, (2) 최근 검색어 chip(`useRecentSearches('trades')` 로컬 저장 — `RecentSearchItem { label, value, kind }` 객체 형식. text 검색은 Enter 로 push, 고객 검색은 행에서 고객명/연락처 클릭 시 `{label: 고객명, value: customerId, kind: 'customer'}` push 하면서 `customerFilter` 활성화 → fetch 시 `customerId` 파라미터로 전송. 활성 chip 은 gray-900 배경으로 강조), (3) 유형 pill(전체/매수/매도/미정 + 카운트 배지) · 승인 상태 select(상담중/계약금 대기/계약금 승인 모두 노출) · 기간 picker · 정렬 select 로 구성 — 진행 상태(완료/진행중)·골프장·회원권·승인내역 포함 토글은 의도적으로 제거하여 결과를 항상 전체 노출. 테이블은 13컬럼(즐겨찾기/유형/상태/골프장/회원권/고객명/연락처/메모/제시가/희망가/등록일/승인 요청/관리). 즐겨찾기는 `useFavoriteConsultations` (localStorage `heritage-dx:consultation-favorites`) 로컬 토글, 표시 전용. 메모 셀은 chevron + (메모가 있으면 최신 한 줄 + `+N` 카운트 + 시각, 없으면 "메모가 없습니다 — 클릭해서 추가" placeholder) 형태로 클릭 시 행을 펼친다. 입력은 표 내부에 직접 두지 않고, 펼친 행의 `MemoHistoryRow`(빠른 추가 input + 타임라인)에서만 처리. 승인 컬럼은 `ApprovalPillButton` (orange/amber/emerald/red pill) — IN_CONSULTATION/DRAFT 만 클릭 가능, 클릭 시 `ApprovalRequestSheetModal` 풀스크린 [회원권 거래 승인요청서] 양식 모달이 열린다(별도 누락 필드 모달 단계 없음). 모달은 상담일지 ID 별로 1대1 매핑되어 `useApprovalSheetStorage` 훅이 `hdx:approval-sheet:<consultationId>` 키에 draft 를 자동 저장(300ms debounce); 디폴트 값은 상담일지의 `tradeType` 에 따라 자기 쪽(매도→출금 / 매수→입금)에 회원권명·담당·고객명·연락처·금액·계약금·일자·계좌·특이사항이 채워지고 반대편은 빈 칸이다. 모달 액션은 인쇄(`printSheetFitToPage`)/JPEG(`captureSheetAsJpeg`)/초기화/닫기/**승인 요청 보내기**. "승인 요청 보내기" 클릭 시 양식의 자기쪽 핵심 필드(고객명/연락처/금액/계약금)를 patch 로 묶어 `requestApproval(id, patch)` 호출하여 update + approvalAction 을 순차 수행하고, structural 누락(`tradeType`/`clubId`/`membershipId`)은 사전 차단하여 상담 편집을 유도한다. 키보드 단축키: `n`/`N` 새 상담일지 push panel open, `/` 검색 input focus(input/textarea 포커스 시 무시). **TradeMemoSidebar (2026-04 재설계)**: 클럽 프로필에서 호출되는 사이드바(`lg:w-96` 384px)는 두 탭(`AI 입력 (beta)` / `일반 입력`)으로 구성. 기존 `list` 탭(메모 목록·검색·인라인 메모 추가)은 제거. **AI 탭에서 제출하면 사이드바 폼을 채우지 않고 별도 다이얼로그(centered modal, max-w-[640px], max-h-[90vh])가 열려** 응답을 검토·수정한 뒤 저장한다. **일반 입력 탭은 사이드바 안에서 직접 폼을 작성·저장**한다. 하위 컴포넌트는 `apps/os/src/components/trade-memo/` 디렉토리에 분리:
- `AiConsultationDraftPanel` — 자연어 textarea(자동 확장, min 6rem / max 18rem, 최대 2000자), `useConsultationRepository().createDraftFromText({ text })` 호출, 응답을 부모로 전달. `Cmd/Ctrl+Enter` 단축키 지원.
- `ConsultationFormSections` — 5섹션(거래 정보 / 고객 정보 / 금액 정보 / 일정 / 메모·특이사항) 폼 본체를 chrome 없이 렌더. `compact` prop 으로 좁은 사이드바에서는 모든 Row 를 단일 컬럼으로 스택, 다이얼로그에서는 `1fr 200px` / `1fr 1.4fr` 등 다중 컬럼 레이아웃 사용. 거래유형 토글(매수 `#1E429F` / 매도 `#B23232`), 골프장·회원권 직접입력 토글, 회원권 select 는 `membershipName` 기준 dedup 후 `id` 를 key 로 사용(중복 이름 대응). 고객 정보 섹션은 `CustomerAutocomplete` 아래에 `MatchedCustomerCard` 를 렌더 — `form.customerId` 가 채워진 시점에만 노출되어 작성 패널·사이드바 양쪽에서 자동 동작. 골프장 input 은 `clubLocked` prop 으로 두 모드 전환: `clubLocked=true`(default, ClubProfile 컨텍스트) 면 disabled 텍스트 input + 직접입력 토글, `clubLocked=false`(`/trades` 리스트) 면 `ClubSearchSelect` picker + 직접입력 토글. 후자에서는 부모가 `clubs`/`selectedClubCode`/`onClubChange` 를 함께 전달. `clubDetail` 은 `ClubDetail | null` — picker 모드에서 클럽 미선택 시 null 가능, 회원권 dropdown 은 빈 상태에서 자동으로 직접입력으로 전환.
- `MatchedCustomerCard` — 자동완성에서 선택된 고객의 collapsible 요약 카드(헤더: 아바타·이름·등급 Pill·등록일·거주지). 펼치면 3탭(`기본 정보` / `보유 회원권` / `상담 히스토리`). 데이터는 `useCustomers().getOne(id)` + `useCustomers().getHistorySummary(id)` 병렬 fetch — store.items 캐시가 있으면 즉시 노출 후 신선한 값으로 덮어쓴다. 보유 회원권 탭은 `customer.ownedMembershipSummary` 텍스트 + "행 데이터는 추후 연동 예정" 빈 상태(행 단위 회원권 API 미연동). 상담 히스토리는 `recentConsultations` 최근 3건 타임라인 + 총 건수가 더 많으면 `/customers/[id]` 링크 노출.
- `ManualConsultationPanel` — 사이드바 일반 입력 탭용 form wrapper. `ConsultationFormSections compact` + 단순 footer(저장 버튼)만 렌더. `editingTrade`/`clubLocked`/`clubs`/`selectedClubCode`/`onClubChange` 를 그대로 패스스루 — 골프장 상세(`TradeMemoSidebar`)와 `/trades` 리스트(`TradesCreatePanel`) 양쪽이 동일한 wrapper 를 공유한다.
- `CreateConsultationDialog` — AI 응답 적용 후 열리는 다이얼로그. `ConsultationFormSections` + `AiResultBanner` + 풀 footer(취소/저장). `isOpen`/`onClose` props 로 제어. Escape 닫기, `Cmd/Ctrl+Enter` 저장, body scroll lock 지원. 사이드바는 단일 클럽 컨텍스트지만 AI 매칭 결과로 다른 클럽 ID 가 들어올 수 있어 `form.clubId/clubName` 을 source-of-truth 로 사용. 신규 작성 시 메모 textarea 입력은 `ConsultationInput.notes` 로 그대로 전달되고 백엔드가 첫 entry 로 자동 변환한다. 비어있으면 `notes` 필드 자체를 omit.
- `AiResultBanner` — `missingRequiredFields`(빨간), `warnings`(노란), club 차이 안내(파란), ambiguous club/membership 후보 칩(주황) 을 조건부 렌더. 다이얼로그 폼 상단에 표시.
폼 state(`form`/`manualMembershipInput`/`manualClubInput`/`aiDraftMeta`)는 `TradeMemoSidebar` 단일 소스에서 관리하고 일반 입력 패널/다이얼로그 양쪽이 공유. `useCustomerEnsureFlow` 미등록 고객 ensure 흐름은 그대로 유지.

**`apps/os/src/components/trades/` (2026-04 시안 신규)** — `/trades` 전용 컴포넌트.
- `TradesCreatePanel` — 560px 인라인 push aside (slide-in 220ms). 내부 폼 본체는 자체 구현이 아니라 `trade-memo/` 신형 공유 컴포넌트(`AiConsultationDraftPanel` + `ManualConsultationPanel` + `CreateConsultationDialog` + `ConsultationFormSections`) 를 재사용 — 골프장 상세의 `TradeMemoSidebar` 와 동일한 컴포넌트 트리. 차이는 두 가지: (1) `clubLocked={false}` 로 골프장을 사용자가 직접 선택(`ClubSearchSelect`); (2) `editingTrade` prop 으로 수정 모드를 지원하여 `update()` 호출. AI 탭 적용 시 `CreateConsultationDialog` 모달이 열려 검토 후 저장(신규 모드 한정, 수정 모드에서는 탭 자체 미노출). `useCustomerEnsureFlow` + `useSendTradeNotification` 통합은 동일.
- `Pill` — 활성/비활성 toggle pill + 카운트 배지(필터 chip 용).
- `TypeBadge` — 매수(blue `#E6EFFB/#1E429F`) · 매도(red `#FCE7E7/#B23232`) · 미정(gray) 파스텔 뱃지. `isUndecided`/`isDone` flag 지원.
- `FavoriteStar` — `useFavoriteConsultations` 로컬 토글 별 아이콘.
- `ApprovalPillButton` — orange/amber/emerald/red pill 변형. `IN_CONSULTATION`/`DRAFT` 만 클릭 가능(`onRequest` 호출), 나머지 상태는 표시 전용. `pending` prop 으로 진행 중 상태 렌더.

**승인 워크플로우 (`approval/`):**
- `StatusBadge` — 상담·거래 상태 공통 배지
- `ApprovalRequestSheetModal` — 상담일지 행마다 1대1 매핑되는 [회원권 거래 승인요청서] 풀스크린 모달. **2026-05 격상 + 명시적 commit 모델 (재조정)**: 데이터 소스가 클라이언트 localStorage(`useApprovalSheetStorage`) → 자동 persist Settlement API → **localStorage(`hdx:settlement:<consultationId>`) draft + 명시적 commit Settlement API** 로 두 차례 변경됐다. `useSettlementSheet(trade)` 가 마운트 시 `GET /api/settlements/:id` → 없으면 `POST /api/settlements/draft` baseline + localStorage 미commit 변경분 머지. 셀 변경은 entity state + localStorage debounced 저장만 — 네트워크 호출 0. 액션: 인쇄(`printSheetFitToPage`) / JPEG(`captureSheetAsJpeg`) / 초기화(`DELETE /api/settlements/:id` 후 draft 재산출 + localStorage 클리어) / 닫기 / **승인 요청 보내기** (1) `commit()` — pending localStorage flush + isDraft=true 면 `POST /api/settlements`, 아니면 `PUT /api/settlements/:id` 한 번 발사. 성공 시 localStorage 클리어 + isDraft=false 전환. (2) `PATCH /api/settlements/:id/document-generated` — 백엔드 게이트. (3) 부모가 주입한 `onSubmit(trade, patch)` — 양식 자기쪽 핵심 필드를 ConsultationEntity patch 로 묶어 store `requestApproval` 으로 전달. 단계 중 어느 하나라도 실패하면 흐름 중단(localStorage 보존하여 사용자가 재시도 가능). `documentGeneratedAt` 표시 배너 유지. 양식 본체는 top-level `ApprovalRequestSheet` 컴포넌트가 렌더하며 `forwardRef<HTMLDivElement>` 로 캡처용 ref 노출. TradesPageClient 의 `ApprovalPillButton` `onRequest` 가 이 모달을 여는 유일한 진입점.

**건의사항:**
`ClaimsPageClient`

**고객:**
`CustomersPageClient`, `CustomerDetailClient`, `CustomerAutocomplete` — `/customers` 목록 (`CustomersPageClient` — 검색/페이지네이션 + 행 클릭 시 `/customers/<id>` 라우트 push. "신규 고객 등록" 버튼 → `customer-create/CustomerCreateModal` open. `CustomerCreateModal` — 4섹션 모달(기본정보/추가정보/보유회원권/메모), 연락처 자동 포맷·형식 검증, 이메일 형식 검증, 연령대 칩, 메모 글자수 카운터(500자). 보유 회원권은 `customer-create/MembershipRow` 다중 행(`ClubSearchSelect usePortal` + 클럽 detail 의 membership dedup — modal-body `overflow-y-auto` 클리핑 회피), (clubId, membershipId) 행 내 중복 차단, 빈 배열 허용. 제출은 `useCustomers().create` 사용 — 서버 conflict 시 "이미 등록된 연락처입니다" 표시) / `/customers/[id]` 상세 (`CustomerDetailClient` — `useCustomerRepository().getOne(id)` 단일 조회 + `update(id, partial)` 인라인 편집, 단일 컬럼 풀폭 시안 1:1 적용. 상단 PersonCard(이름 + 등급/거래 의사 dot 태그 + 연락처/이메일/등록일 메타) → BasicInfoCard(8행: 고객명·연락처·이메일·직장/직업·연령대·거주지·고객 등급·거래 의사. 고객 등급/거래 의사는 칩 그룹 read-only — 백엔드 enum 미정. 나머지는 InlineField 클릭 편집. 우측 상단 "편집" 토글) → MembershipCard(`customer.ownedMemberships` 행 표시 — 골프장/회원유형/상태(태그)/수량/메모/액션. "+ 회원권 추가" 버튼 → `OwnedMembershipFormModal` open. 행 [수정](모달 edit 모드)/[삭제](`ConfirmModal`) 액션. 추가/수정/삭제 모두 `onPatch({ ownedMemberships: [...] })` 로 PUT 전송 → 백엔드 전체 교체 의미) → ConsultationHistoryCard(`useConsultations(tradeMemo).fetch({ customerId, limit:50 })` 로 해당 고객 상담 전체 조회 → `ConsultationRow` 다중 행. 카드 헤더 "상담 이력" + 우측 건수만, stat 블록/서브 헤더는 의도적으로 제외. 행 헤더는 chevron + 골프장 · 회원권 · 최신메모 truncate + 매수/매도 뱃지(`tradeSideStyle`) + 날짜. 펼침 본문은 `addNote(id, content)` 입력(Enter/녹색 추가 버튼) + 메모 타임라인(점-라인, 최신순 정렬, 첫 항목 "최신" 검정 뱃지). 첫 행 default open) → NotesCard(textarea + 검정 "기록 저장" 버튼 → memo 텍스트 누적, 하단 이력 표시). 우측 보조 컬럼·탭은 시안에 없음). 시안 카드 컴포넌트는 `apps/os/src/components/customer-detail/` 에 분리 — `PersonCard`, `BasicInfoCard`, `MembershipCard`, `OwnedMembershipFormModal` (골프장+회원권 picker — `ClubSearchSelect`/`useClubs`/`useClubDetail`/`useTopClubs` 재사용, 상태/수량/메모/정렬 입력, (clubId,membershipId) 중복 차단), `ConsultationHistoryCard`, `ConsultationRow`, `NotesCard`, `EmptyCard`, `InlineField` (hover→연필→input→체크/X 저장 primitive), `styles.ts` (시안 cdStyles + tagStyle 헬퍼 + `getCustomerGradeColor`/`getOwnedMembershipStatusColor`/`tradeSideStyle`). CSS 변수(`--bg`/`--text`/`--text-2`/`--text-3`/`--line`/`--line-soft`/`--green-soft`/`--green-text`/`--slate-soft`)는 `apps/os/src/app/globals.css` 에 정의. `CustomerAutocomplete` — 상담/거래 폼에서 재사용되는 이름/연락처 자동완성. 미등록 고객 저장 시에는 `useCustomerEnsureFlow` 훅이 `ConfirmModal`을 띄워 `POST /customers` → `POST /consultations` 를 순차 실행한다.

**모달/시트:**
`PasswordChangeModal`, `TaxGuideModal`, `TaxSettingsModal`, `EstimateSheet`, `ApprovalRequestSheet` — **`ApprovalRequestSheet`** (2026-05 RHF 도입): 첨부 양식 그대로의 인라인 편집형 시트(헤더/회원권 출금/입금/매매계약서/세금계산서/거래경로/수익금/세무신고/특이사항). props=`forwardRef<HTMLDivElement>` (값 props 제거됨) — `react-hook-form` 의 `FormProvider` 안에서 사용되며, 셀 컴포넌트(`TextCell`/`NumCell`/`Check`/`RegisteredInput`)는 module scope 로 정의되어 `useFormContext` 로 register/Controller/setValue 사용. inner 컴포넌트가 module scope 라 부모 리렌더로 input 이 unmount/remount 되지 않아 입력 끊김이 없음. 셀별 검증 에러는 `useCellError(name)` 헬퍼가 `formState.errors[name]` 을 읽어 빨간 ring + 작은 메시지로 표시(group toggle Check 는 outline 만). 폭은 `1050px` (sheet-print 의 JPEG_PAGE_WIDTH 와 일치). 데이터는 `useSettlementSheet`(2026-05 신설; localStorage draft + 명시적 commit, 내부에 useForm 통합) 가 관리; 컨테이너는 `approval/ApprovalRequestSheetModal` 이 담당하며 양식을 `FormProvider {...form}` 로 감싸고 "승인 요청 보내기" 시 `commit()` → `PATCH /document-generated` → store `requestApproval(id, patch)` 순차 수행 — commit 결과 `{ ok: false, unmappedErrors }` 면 단계 중단 + 모달 상단에 unmapped 표시(셀 빨간 표시는 form.setError 가 자동). 어댑터(`apps/os/src/hooks/settlement-sheet-adapter.ts`)의 `SHEET_TO_ENTITY` 매핑 테이블이 양식 셀 키(예: sellCompany/outAmount/outFeeIncluded)를 백엔드 entity 필드(sellName/sellMembershipAmount/sellCommissionDeducted)로 양방향 변환하며, `ENTITY_TO_SHEET` inverse + `parseValidationField` 로 NestJS class-validator 메시지(`"property X should not exist"`, `"X must be ..."`)에서 셀 키 추출. 매핑 미확정 셀(outDeposit, inBank, taxIssue 그룹, transferReport, sellerRoute 그룹, expense 등)은 양식에 빈 셀로 노출되며 백엔드에 안 실린다.

**유틸리티:**
`HomeClient`, `DashboardClient`, `SearchInput`, `OperatorNotice`, `SystemNotice`

**홈 대시보드 (`DashboardClient` — 2026-05 V3 디자인 적용)**: 루트 `/` 가 렌더하는 메인 페이지. 30:70 grid (`lg:grid-cols-[30%_1fr]`) 로 좌우 분할.
- **좌 — 골프장 정보 hub** (`bg-[#0a0a0a]` 검정 카드, 우상단 radial gradient overlay): 큰 골프 깃발 squircle 아이콘 + "골프장 정보" 26px 타이틀 + 1줄 설명 + dashed 구분선 위 CTA "골프장 검색으로 이동" 화살표 → `Link href="/clubs"`. 하단에 "최근 검색한 골프장" 섹션 — `useRecentSearches("clubs", 4)` (push 는 4종 골프장 검색 UI 에서 선택 시 자동 누적, `kind:"club"`). 각 항목 클릭 시 `/clubs?club=<value>` 로 이동, hover 시 X 버튼으로 단건 제거, "모두 지우기" 버튼으로 일괄 clear.

**골프장 검색 UI 의 즐겨찾기·최근 그룹**: 4종 검색 UI(`packages/ui` 의 `ClubSearchSelect`, `apps/os/src/components/club-search/ClubSearchPanel`, `apps/os/src/components/club-profile/ClubSwitcher`, `apps/os/src/components/GolfClubSearch`) 모두 검색어/필터가 비어 있을 때 상단에 "즐겨찾기 · 최근" 단일 섹션(최대 5개)을 노출한다. 정렬은 `useTopClubs` 가 **즐겨찾기 우선 + 빈 자리는 최근 선택으로 보충** 으로 결정. 별 토글로 즐겨찾기 추가/해제, 골프장 선택 시 자동으로 `useRecentSearches("clubs")` push. `packages/ui/ClubSearchSelect` 는 도메인 hook 을 직접 import 하지 않고 `topClubCodes`/`isFavorite`/`onToggleFavorite`/`onClubSelect` props 로만 노출 — 호출부(`apps/os/src/components/trade-memo/ConsultationFormSections`, `apps/back-office/src/app/(dashboard)/trade-records/page.tsx`, `apps/back-office/src/app/(dashboard)/trade-memos/page.tsx`)에서 `useTopClubs(clubs, 5)` 결과를 주입한다.
- **우 — 공지사항 카드** (`bg-white rounded-2xl shadow-card`): Megaphone 아이콘 + "공지사항" 28px 헤더 + admin 한정 "새 공지" 버튼. 검색 input(`f9fafb` 배경, 300ms 디바운스) + 정렬 select(최신순/오래된순). 본문은 **Hero 카드(최신 1건)** — 파스텔 그라데이션 배경 + 민트 "최신" Pin 태그 + 17px 제목 + 1줄 프리뷰 + 나머지 5건은 `grid-cols-[60px_1fr_100px_16px]` 형태(No / 제목+프리뷰 / 날짜 / chevron) 리스트. 푸터에 `range / total건` 표시 + 페이지네이션(활성 검정 배경 pill).
- **상세 슬라이드 패널**: 행 클릭 시 우측 fixed `w-[420px]` 슬라이드인. 헤더(날짜 + X) + 제목 + 본문(`whitespace-pre-wrap`) + admin 푸터(수정 ghost / 삭제 `bg-red-50 text-red-700` 2단계 confirm). 스크림 클릭으로 닫기.
- **공지 작성/수정**: 별도 `Modal`(`@heritage-dx/ui`) 로 분리. `useNoticeMutations`/`useNotices`/`canManageOrg` 사용은 변경 없음. 페이지 사이즈는 `PAGE_SIZE = 6`.

#### 서버사이드 데이터 페칭 + ISR 캐싱

```typescript
// apps/os/src/lib/server-repositories.ts
const serverRepos = createServerRepositories({
  baseUrl: "https://api.heritage-dx.com/api",
  revalidate: 300,
});

// Helper 함수
getClubs()          // serverRepos.clubs.getAll() (5분 ISR 캐시)
getClubDetail(code) // serverRepos.clubs.getOne(code) (5분 ISR 캐시)
getInitialData()    // 초기 데이터 프리로드
```

서버 컴포넌트에서 `@heritage-dx/api/server`의 Server Repository를 사용. 내부적으로 `fetch()` + `next: { revalidate: 300 }`으로 ISR 캐싱.

#### 클라이언트 사이드 데이터 페칭

`OsRepositoryProvider`에서 `@heritage-dx/api`의 General + Admin Repository를 주입. 클라이언트 컴포넌트는 `@heritage-dx/store`의 훅만 소비한다. Repository convenience hooks(`useXxxRepository`)는 훅 내부에서만 사용.

주요 훅: `useClubs`, `useClubDetail`, `useConsultations`, `useConsultationsAdmin`, `useScenarioOptions`, `useScenarioDocuments`, `useClaims`, `useNotices`, `useNoticeMutations`, `useMarketPrices`, `useSendTradeNotification`, `useGeocode`

#### 매물 시세 & 주변 골프장 가격

최근 추가된 기능. 클럽 프로필 화면에서 매물 시세 정보와 주변 골프장 시세를 비교 표시한다.

| 항목 | 위치 |
|------|------|
| 데이터 훅 | `apps/os/src/hooks/useMarketPriceSummary.ts` |
| 시세 요약 컴포넌트 | `apps/os/src/components/club-profile/MarketPriceSummary.tsx` |
| 주변 클럽 가격 | `apps/os/src/components/club-profile/NearbyClubPrices.tsx` |
| Entity 필드 | `packages/store/src/entities/club.ts` — `marketPrice` 필드 |

흐름: `ClubProfile` → `useMarketPriceSummary(clubCode)` → API → `MarketPriceSummary` / `NearbyClubPrices` 렌더링.

#### 주요 의존성

- **recharts** — 시세 차트 (`PriceChart`)
- **html-to-image** + **pdf-lib** — 혜택지/견적서 JPEG·PDF 생성
- **jszip** — 서류 ZIP 다운로드
- **Naver Map API** — 골프장 지도 (`NaverMap`)
- **firebase-admin** — FCM 푸시 알림 전송 + Firestore 토큰 관리
- **gtag** — Google Analytics 4 이벤트 트래킹 (`lib/gtag.ts`)

### 5.2. Back Office (관리자) — 포트 3001

골프장, 시나리오, 서류, 회원권, 사용자를 관리하는 관리자 앱.

#### 라우트 구조

```
/app
├── layout.tsx                            # 루트 레이아웃 (+ Sonner Toaster, + next/font: Inter + Noto Sans KR)
├── login/page.tsx                        # 로그인
├── api/fcm-tokens/route.ts              # FCM 토큰 CRUD API
├── api/notifications/route.ts           # 알림 목록 GET API
├── api/notifications/read/route.ts      # 알림 읽음 처리 POST API
├── firebase-messaging-sw.js/route.ts    # Service Worker (동적)
└── (dashboard)/                          # 대시보드 그룹
    ├── layout.tsx                        # 대시보드 레이아웃 (Header + Sidebar + PageContainer)
    ├── page.tsx                          # 대시보드 홈
    ├── clubs/
    │   ├── page.tsx                      # 골프장 목록
    │   ├── new/page.tsx                  # 골프장 생성
    │   └── [code]/
    │       ├── page.tsx                  # 골프장 상세/편집
    │       └── documents/
    │           ├── new/page.tsx          # 서류 등록
    │           └── [docCode]/page.tsx    # 서류 상세
    ├── common-documents/page.tsx         # 공용 서류 관리
    ├── my-organization/page.tsx          # 조직 설정
    ├── notifications/page.tsx            # 알림 목록
    ├── kpi/page.tsx                       # KPI 통계 대시보드
    ├── trade-memos/page.tsx              # 상담 기록 (승인 UI — useConsultationAdminRepository). 메모 컬럼은 `Consultation.notes.entries` 를 그대로 사용해 최신 한 줄 + `+N` 카운트 표시(서버 JSONB 응답을 직접 소비). 행 클릭 시 우측 Drawer 에 메모 히스토리 타임라인(최신 dot 강조 + dashed 구분선) + 고객 이력 + 반대매매 리스트가 함께 노출. 편집 모드에서는 `notes` 폼 필드를 비워두며 update 페이로드에서 omit — 메모 변경은 별도 엔드포인트로만. **상담일지 추가/수정 Drawer** 안 고객명/연락처 입력 grid 바로 아래에 `MatchedCustomerCard` (apps/back-office/src/components/trade-memos/) 를 배치 — 수정 모드에서 `editingMemo.customerId` 가 있을 때만 카드를 노출(추가 모드는 자동 숨김). 카드는 `useCustomerRepository().getOne` + `getHistorySummary` 를 직접 호출하고 `mapCustomerDtoToEntity`/`mapCustomerHistorySummaryDtoToEntity` 로 entity 변환 — OS 의 `apps/os/src/components/trade-memo/MatchedCustomerCard` 와 시각·매핑 1:1 동일(추후 packages/ui 통합 후보).
    ├── trade-records/page.tsx            # 거래 내역 (승인 UI — useMembershipTradeAdminRepository)
    ├── customers/page.tsx                # 고객 목록 + 담당자 필터 + 이력 Drawer (useCustomerRepository)
    └── users/page.tsx                    # 사용자 관리
```

#### 컴포넌트 (13개)

**레이아웃** (`layout/`): `Header`, `Sidebar`, `PageContainer`

**폼** (`forms/`): `ClubForm`, `DocumentForm`, `MembershipForm`, `ScenarioForm`

**KPI** (`kpi/`): `KpiMiniDashboard`, `KpiFilterBar`, `KpiTrendChart`, `KpiEmployeeComparison`
- react-hook-form + zod 스키마 검증 기반

**공통**: `GoogleAnalytics` (GA4 이벤트 트래킹)

**승인 워크플로우** (`approval/`): `StatusBadge`, `ActionReasonModal` (보류/반려 사유 필수 입력)

#### API 레이어 (Repository Pattern)

`BackOfficeRepositoryProvider`에서 `@heritage-dx/api`의 General + Admin Repository를 주입.

```typescript
// apps/back-office/src/contexts/RepositoryContext.tsx
const apiClient = new ApiClient("/api-proxy/api");
const general = createGeneralRepositories(apiClient);
const admin = createAdminRepositories(apiClient, "/api-proxy/api");

// 컴포넌트는 @heritage-dx/store 훅만 소비 (repository hooks는 훅 내부에서만)
useKpi()              // KPI 페치 함수
useUsers()            // 사용자 목록
useUserMutations()    // 사용자 CRUD
useMyOrganization()   // 나의 조직
useNotices()          // 공지사항 목록
useNoticeMutations()  // 공지사항 CRUD
```

#### 컨텍스트

- **AuthContext** — 공유 `AuthProvider` 래핑
- **RepositoryContext** — `@heritage-dx/api`의 General + Admin Repository 주입
- **DataContext** — 앱 데이터 프리로드 (clubs, tradeMemos, tradeRecords). Repository hooks 사용.
  - `useData()` → `{ clubs, preloadedMemos, preloadedRecords, ... }`

---

## 6. 레이어 아키텍처

### 6.1. UI Layer

```
@heritage-dx/ui (공유 컴포넌트)
       ↓
앱별 컴포넌트 (components/)
       ↓
페이지 (app/**/page.tsx)
```

공유 UI 패키지는 디자인 시스템 역할. 각 앱은 도메인별 컴포넌트를 추가로 구현.

### 6.2. API Layer (Repository Pattern)

```
@heritage-dx/api
├── interfaces/         ← 리포지토리 인터페이스 (의존성 역전)
├── repositories/       ← 구현체 (ApiClient 또는 raw fetch)
├── factories/          ← 리포지토리 생성 팩토리
└── context/            ← React Context + Hooks

[OS 앱 — 서버 사이드]
  createServerRepositories() → Server Repository → fetch() + ISR → API 서버

[OS 앱 — 클라이언트 사이드]
  OsRepositoryProvider → General Repository → ApiClient → Next.js rewrite → API 서버

[Back Office 앱]
  BackOfficeRepositoryProvider → General + Admin Repository → ApiClient → Next.js rewrite → API 서버
```

- OS: 서버 컴포넌트는 Server Repository (raw `fetch()` + ISR), 클라이언트는 General Repository (ApiClient + 프록시)
- Back Office: General Repository (공개 API) + Admin Repository (관리자 API)로 분리, 응답 정규화는 `normalizeListResponse`로 통합

### 6.3. Auth Layer

```
@heritage-dx/auth
├── createAuthApi(baseUrl)      ← Factory
└── AuthProvider + useAuth()    ← Context + Hook
       ↓
앱별 AuthContext (contexts/AuthContext.tsx)
├── OS: AuthProvider (기본)
└── BO: AuthProvider (기본)
       ↓
AuthGuard (OS) / Dashboard Layout (BO)
       ↓
보호된 라우트
```

### 6.4. State Layer

```
AuthProvider (인증 상태)
       ↓
RepositoryProvider (API 리포지토리 주입)
       ↓
Zustand Store (OS: Entity 캐시 — stale-while-revalidate)
DataProvider (BO: clubs, memos, records 프리로드)
       ↓
useAuth() / useClubs() / useClubDetail() / useConsultations() 등
       ↓
컴포넌트
```

- OS: `AuthProvider` → `OsRepositoryProvider` → Zustand Store (캐시) → `useClubs()`, `useClubDetail()`, `useConsultations()` hooks
- Back Office: `AuthProvider` → `BackOfficeRepositoryProvider` (General + Admin) → `DataProvider` → `useAuth()` + `useData()` + repository hooks

### 6.5. Type Layer

```
@heritage-dx/types (공유 DTO 타입 — API 응답 형태)
       ↓
@heritage-dx/store/entities (Entity 타입 — 정규화된 프론트엔드 타입)
       ↓
앱별 types/index.ts
├── OS: Entity 타입을 별칭으로 re-export (ClubEntity as Club 등)
└── BO: DTO 타입 re-export + Entity 타입 re-export + 앱 전용 확장 (UsersResponse 등)
```

- **DTO 타입** (`@heritage-dx/types`): 백엔드 API 응답 형태 그대로. Mapper의 입력.
- **Entity 타입** (`@heritage-dx/store`): 프론트엔드용 정규화 타입. Mapper의 출력. 컴포넌트에서 사용.
- 두 앱 모두 **Type Proxy 패턴** — `@/types`에서 re-export하여 import 경로 통일.

---

## 7. 데이터 흐름

### 7.1. 인증 흐름

```
[로그인]
POST /auth/login (credentials: include)
  → 서버가 httpOnly 쿠키로 토큰 설정
  → AuthProvider에서 user 상태 업데이트
  → (BO) DataProvider: 골프장 + 거래 메모/내역 프리로드

[세션 유지]
AuthProvider → 14분 주기 setInterval → authApi.refresh()
  → tryRefreshToken() (singleton promise로 중복 방지)
  → 실패 시 user = null, router.replace("/login")

[API 호출 시 401]
ApiClient.request() → 401 응답
  → tryRefreshToken()
  → 성공: 같은 요청 재시도 (isRetry=true)
  → 실패: redirectToLogin()
```

### 7.2. 데이터 페칭 흐름

```
[OS — 서버 사이드]
page.tsx (Server Component)
  → serverRepos.clubs.getAll() / serverRepos.clubs.getOne(code)
  → Server Repository → fetch(API_URL, { next: { revalidate: 300 } })
  → ISR 캐시 (5분)
  → Props로 클라이언트 컴포넌트에 전달

[OS — 클라이언트 사이드]
컴포넌트 → useClubs() / useClubDetail() / useConsultations() 등
  → Zustand Store (캐시) → Mapper (DTO→Entity) → General Repository → ApiClient → API 서버

[Back Office]
컴포넌트 → useClubRepository() / useAdminRepositories() 등
  → General/Admin Repository → ApiClient
  → normalizeListResponse (3가지 응답 형식 → 통일된 구조)
  → 컴포넌트 상태 업데이트
```

---

## 8. 핵심 아키텍처 패턴

### Repository Pattern
`@heritage-dx/api` — 인터페이스 기반 API 추상화. General/Admin/Server 3가지 카테고리로 분리. 팩토리 함수로 구현체 생성, React Context로 주입.

### Factory Pattern
- `createAuthApi(baseUrl)` — 인증 API 객체 생성
- `createGeneralRepositories(apiClient)` — 공개 API 리포지토리 생성
- `createAdminRepositories(apiClient, baseUrl)` — 관리자 API 리포지토리 생성
- `createServerRepositories({ baseUrl, revalidate })` — ISR용 서버 리포지토리 생성

### Provider Pattern
`AuthProvider`, `RepositoryProvider`, `DataProvider` — React Context로 전역 상태/의존성 공급. 계층적 구성 (Auth → Repository → Data).

### Hook Pattern
`useAuth()`, `useData()`, `useClubRepository()`, `useAdminRepositories()`, `useOrganization()`, `useTaxSettings()` — 컴포넌트에서 상태/리포지토리 소비.

### Dependency Injection
- `AuthProvider({ authApi })` — 외부에서 생성한 authApi를 주입
- `RepositoryProvider({ general, admin })` — 외부에서 생성한 리포지토리를 주입. 앱별 설정 분리.

### Type Proxy Pattern
Back Office `types/index.ts`에서 `@heritage-dx/types` re-export → import 경로 통일 (`@/types`).

### DTO → Entity Mapper Pattern
`@heritage-dx/store`의 Mapper 함수에서 API 응답(DTO)을 Entity로 변환. 타입 정규화 (`string|number` → `number`), 서브 객체 그룹핑, 기본값 설정을 담당. API 포맷 변경 시 Mapper만 수정하면 Entity와 컴포넌트에 영향 없음.

### Stale-While-Revalidate Cache Pattern
`@heritage-dx/store`의 Zustand 스토어에서 캐시 데이터 즉시 반환 + 백그라운드 refresh. `FetchStatus`(`idle`→`loading`→`success`/`refreshing`)로 UI 상태 관리. SSR 데이터는 `hydrate*()` 메서드로 클라이언트 스토어에 주입.

### Response Normalization
`@heritage-dx/api`의 `normalizeListResponse`에서 다양한 API 응답 형식 (배열, `{ data, meta }`, spread 객체)을 `{ items, pagination }` 구조로 정규화.

### ISR Cache Pattern
OS Server Repository에서 `next: { revalidate: 300 }`으로 5분 단위 ISR 캐싱. 정적 생성 + 주기적 재검증.

### Token Dedup Pattern
`tryRefreshToken()` — singleton promise로 동시 다중 401 응답 시 refresh 요청 한 번만 발생.

---

## 9. 알림 시스템 (FCM Push + Toast + 알림 이력)

### 아키텍처

```
[OS 앱] 사용자가 거래 메모 등록
    ↓ consultationsRepo.create() 성공
    ↓ fire-and-forget
[OS API Route] /api/notifications/send
    ↓ Firebase Admin SDK
    ↓ Firestore에서 BO 관리자 FCM 토큰 조회
    ↓ sendEachForMulticast() + Firestore notifications 컬렉션에 이력 저장
[Back Office] 관리자 브라우저
    ├─ 앱 열림 → onForegroundMessage → Sonner Toast + unreadCount 갱신
    ├─ 앱 닫힘 → Service Worker → OS 푸시 알림
    └─ /notifications 페이지 → 알림 목록 조회 + 읽음 처리
```

### OS 앱 (알림 전송 측)

| 파일 | 용도 |
|------|------|
| `apps/os/src/lib/firebase-admin.ts` | Firebase Admin 싱글턴 초기화 |
| `apps/os/src/app/api/notifications/send/route.ts` | 푸시 전송 API |

- 환경변수: `FIREBASE_SERVICE_ACCOUNT_KEY` (base64 인코딩된 서비스 계정 JSON)
- `TradeMemoSidebar.tsx`, `TradesPageClient.tsx`에서 신규 메모 등록 시 `/api/notifications/send`로 fire-and-forget 요청
- Firestore `fcm-tokens` 컬렉션에서 관리자 토큰 조회 후 `sendEachForMulticast()`로 전송
- 전송 후 Firestore `notifications` 컬렉션에 알림 이력 저장 (fire-and-forget)
- 만료된 토큰 자동 정리

### Back Office 앱 (알림 수신 측)

| 파일 | 용도 |
|------|------|
| `apps/back-office/src/lib/firebase.ts` | Firebase 클라이언트 초기화, FCM 토큰/메시지 |
| `apps/back-office/src/app/firebase-messaging-sw.js/route.ts` | 백그라운드 Service Worker (동적 생성) |
| `apps/back-office/src/app/api/fcm-tokens/route.ts` | 토큰 등록/삭제 API |
| `apps/back-office/src/hooks/useFCMToken.ts` | 로그인 시 FCM 토큰 자동 등록 |
| `apps/back-office/src/hooks/useFCMForeground.ts` | 포그라운드 Toast 알림 (Sonner) + 커스텀 이벤트 dispatch |
| `apps/back-office/src/hooks/useNotifications.ts` | 알림 목록/읽음 상태 관리 훅 |
| `apps/back-office/src/lib/firebase-admin.ts` | Firebase Admin 헬퍼 (getAuthUser, getFirestore) |
| `apps/back-office/src/app/api/notifications/route.ts` | 알림 목록 GET API |
| `apps/back-office/src/app/api/notifications/read/route.ts` | 알림 읽음 처리 POST API |
| `apps/back-office/src/app/(dashboard)/notifications/page.tsx` | 알림 목록 페이지 |

- 환경변수 (빌드타임): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- 환경변수 (런타임): `FIREBASE_SERVICE_ACCOUNT_KEY`
- Dashboard layout에서 `useFCMToken()` + `useFCMForeground()` 호출
- Root layout에 `<Toaster position="top-right" richColors />` (Sonner)

### Firestore 스키마

**컬렉션: `fcm-tokens`**

| 필드 | 타입 | 설명 |
|------|------|------|
| `token` | string | FCM 등록 토큰 |
| `userId` | string | 관리자 ID |
| `userName` | string | 관리자 이름 |
| `createdAt` | string | 생성일 (ISO 8601) |
| `updatedAt` | string | 갱신일 (ISO 8601) |

**컬렉션: `notifications`**

| 필드 | 타입 | 설명 |
|------|------|------|
| `title` | string | `"새 거래 메모: {clubName}"` |
| `body` | string | `"[매수] 홍길동 - 개인정회원"` |
| `clubName` | string | 골프장명 |
| `tradeType` | string | 매수/매도 |
| `customerName` | string | 고객명 |
| `membershipType` | string | 회원권 종류 |
| `createdAt` | string | ISO 8601 |
| `readBy` | string[] | 읽은 유저 ID 배열 |

---

## 10. 배포 설정

### Docker + Cloud Run 배포

두 앱 모두 멀티스테이지 Dockerfile로 빌드하여 GCP Cloud Run에 배포. GitHub Actions CI/CD로 `main` 푸시 시 자동 배포.

```
heritage-dx/
├── apps/os/Dockerfile                # OS 앱 Docker 빌드
├── apps/back-office/Dockerfile       # Back Office 앱 Docker 빌드
├── .dockerignore                     # Docker 빌드 제외 파일
├── .github/workflows/ci.yml         # 모든 push + main 대상 PR 에서 lint/type-check/build (concurrency 그룹으로 중복 취소)
└── .github/workflows/deploy.yml     # main 푸시 시 Cloud Run 배포
```

### Git Hook (husky)

`.husky/pre-push` 가 `main` 브랜치 직접 push 를 차단한다 — 모든 변경은 PR 을 통해서만 머지. 우회가 꼭 필요한 경우(예: hook 자체 수정) `git push --no-verify` 사용. `pnpm install` 시 root `prepare` 스크립트가 husky 를 자동 활성화하므로 팀원이 별도 설정할 필요 없음.

| 항목 | OS | Back Office |
|------|-----|-------------|
| Cloud Run 서비스 | `heritage-dx-os` | `heritage-dx-back-office` |
| CPU / Memory | 1 / 512Mi | 1 / 512Mi |
| Min / Max instances | 0 / 10 | 0 / 5 |
| Artifact Registry | `asia-northeast3-docker.pkg.dev/{PROJECT}/heritage-dx/os` | `asia-northeast3-docker.pkg.dev/{PROJECT}/heritage-dx/back-office` |
| 인증 | Workload Identity Federation (GitHub Actions ↔ GCP) | 동일 |

### Next.js 설정 (공통)

```typescript
// apps/*/next.config.ts — 상단에서 DNS 순서 강제 (IPv6 도달 불가 환경 대응)
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

{
  transpilePackages: [
    "@heritage-dx/types",
    "@heritage-dx/utils",
    "@heritage-dx/api-client",
    "@heritage-dx/api",
    "@heritage-dx/store",
    "@heritage-dx/auth",
    "@heritage-dx/ui",
  ],
  output: "standalone",                              // Docker 최적 빌드
  outputFileTracingRoot: path.join(__dirname, "../../"),  // 모노레포 루트 추적
  rewrites: [
    { source: "/api-proxy/:path*", destination: "https://api.heritage-dx.com/:path*" }
  ],
}
```

> `dns.setDefaultResultOrder("ipv4first")` — Cloudflare IPv6에 도달 불가한 네트워크에서 Node undici(내장 fetch)가 IPv6를 우선 시도하다 `AggregateError ETIMEDOUT` 내는 것을 방지. 이중 안전망으로 `package.json`의 `dev`/`start`에도 `NODE_OPTIONS=--dns-result-order=ipv4first`를 지정.

### Turborepo 빌드 파이프라인

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

- `^build` — 패키지 의존성 순서대로 빌드 (types → utils → api-client → api → store → auth → ui → apps)
- `dev` — 캐시 없이 persistent 모드로 실행
- `lint` / `type-check` — 패키지 빌드 완료 후 실행

### API 프록시

클라이언트 요청은 Next.js rewrite를 통해 API 서버로 프록시됨:
```
브라우저 → /api-proxy/api/clubs → Next.js rewrite → https://api.heritage-dx.com/api/clubs
```
이를 통해 CORS 문제를 회피하고 쿠키 기반 인증을 유지.

---

## 11. 스크립트

### `scripts/data-sync.mjs` — Data Sync CLI

모든 API를 호출하여 현재 데이터를 로컬에 동기화하는 Node.js 스크립트. 단일 `.mjs` 파일로 외부 의존성 없이 동작.

**4가지 모드:**

| 모드 | 명령어 | 설명 |
|------|--------|------|
| `fetch` | `pnpm data-sync:fetch` | API 응답 → `scripts/data/raw/` JSON 저장 |
| `validate` | `pnpm data-sync:validate` | Raw DTO vs Entity 타입 키 검증 |
| `seed` | `pnpm data-sync:seed` | Mapper 적용 → `scripts/data/entities/` Entity JSON 생성 |
| `warm` | `pnpm data-sync:warm` | 배포된 OS 앱 ISR 캐시 워밍 |
| `all` | `pnpm data-sync` | 4가지 모두 순차 실행 |

**옵션:** `--resume` (중단 재개), `--delay=200` (요청 간 딜레이 ms), `--concurrency=3` (ISR 동시 요청), `--verbose` (상세 로그)

**환경변수:** `SYNC_EMAIL`, `SYNC_PASSWORD`, `SYNC_API_BASE` (기본: `https://api.heritage-dx.com`), `SYNC_OS_BASE` (ISR 워밍용)

**출력 구조:**
```
scripts/data/                 # gitignored
├── raw/                      # Mode 1: Raw API 응답 (DTO)
│   ├── clubs-list.json
│   ├── club-details/{code}.json
│   ├── consultations.json
│   └── membership-trades.json
├── entities/                 # Mode 4: Entity (Mapper 적용)
│   ├── clubs.json
│   ├── club-details.json
│   ├── trade-memos.json
│   └── trade-records.json
├── validation-report.json    # Mode 2: 타입 검증 결과
├── isr-warm-report.json      # Mode 3: ISR 워밍 결과
└── _meta.json                # 타임스탬프, 카운트
```

**인증:** httpOnly 쿠키 기반. `Set-Cookie` 헤더 수동 캡처 → 후속 요청 `Cookie` 헤더 전달. 12분마다 자동 refresh.

**Mapper:** `@heritage-dx/store/mappers`의 TS Mapper 함수를 JS로 포팅. `coerceToNumber`, `normalizeGreenFee` 포함 13개 함수.
