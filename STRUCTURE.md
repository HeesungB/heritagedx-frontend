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
│   │   │   ├── app/                 # Next.js App Router
│   │   │   ├── components/          # 38개 컴포넌트
│   │   │   ├── contexts/            # AuthContext, RepositoryContext
│   │   │   ├── hooks/               # useOrganization, useTaxSettings
│   │   │   ├── lib/                 # server-repositories.ts, authApi.ts, firebase-admin.ts
│   │   │   ├── types/               # 앱 전용 타입
│   │   │   └── utils/               # distance, taxCalculator
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   └── back-office/                 # 관리자 백오피스 (포트 3001)
│       ├── src/
│       │   ├── app/                 # Next.js App Router
│       │   ├── components/
│       │   │   ├── forms/           # ClubForm, DocumentForm, MembershipForm, ScenarioForm
│       │   │   └── layout/          # Header, Sidebar, PageContainer
│       │   ├── contexts/            # AuthContext, DataContext, RepositoryContext
│       │   ├── hooks/               # useFCMToken, useFCMForeground, useNotifications
│       │   ├── lib/                 # authApi.ts, firebase.ts, firebase-admin.ts
│       │   └── types/               # 프록시 re-export + 앱 전용 타입
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
│   └── tailwind-config/             # @heritage-dx/tailwind-config
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
  + html2canvas         + zod
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

도메인 모델의 TypeScript 타입 정의. 8개 모듈로 구성.

| 모듈 | 주요 타입 |
|------|----------|
| `api.ts` | `ApiResponse<T>`, `AuthApiResponse<T>`, `Pagination`, `SearchParams` |
| `club.ts` | `Club`, `ClubDetail`, `ClubContact`, `BankAccount`, `ClubsResponse`, `ClubDetailResponse` |
| `membership.ts` | `Membership`, `MembershipDocument` |
| `document.ts` | `Document`, `ClubDocument`, `GlobalDocument`, `CustomerDocument`, `ClubScenarioDocument`, `DocumentsSummary` |
| `scenario.ts` | `Scenario`, `ScenarioSide`, `ScenarioOwnerType`, `ScenarioConditions`, `ScenarioWithDocuments`, `AvailableFilters` |
| `trade.ts` | `TradeMemo`, `TradeMemoInput`, `TradeRecord`, `TradeRecordInput` |
| `user.ts` | `User`, `UserRole` (`SUPER_ADMIN` \| `ORG_ADMIN` \| `EDITOR`), `AdminUser`, `LoginResponse` |
| `organization.ts` | `Organization` |

### 4.2. `@heritage-dx/utils`

두 개의 유틸리티 모듈.

**`currency.ts`** — 한국 원화 포맷팅:
- `formatCurrency(amount)` → `"1,000원"`
- `formatManwon(manwon)` → `"1억 7,000만원"`
- `manwonToWon(manwon)` / `wonToManwon(won)` — 만원↔원 변환
- `parseNumber(str)` — 문자열에서 숫자 추출
- `parseTransferFee(feeStr)` — 명의개서료 파싱 (만원 단위)

**`korean.ts`** — 한글 처리:
- `getKoreanInitial(str)` — 초성 추출
- `normalizeInitial(initial)` — 쌍자음→단자음
- `getProvince(region)` / `getRegionGroup(region)` — 지역 그룹핑
- `INITIALS` — 14개 초성 + `"0-9"`
- `REGION_GROUPS` — `수도권`, `강원도`, `충청도`, `전라도`, `경상도`, `제주도`

### 4.3. `@heritage-dx/api-client`

HTTP 클라이언트 + 토큰 관리.

```
┌─────────────────────────────────────────────┐
│  ApiClient                                  │
│  ├── get<T>(endpoint, params?)              │
│  ├── post<T>(endpoint, body?)               │
│  ├── put<T>(endpoint, body?)                │
│  ├── patch<T>(endpoint, body?)              │
│  ├── delete<T>(endpoint)                    │
│  └── uploadFormData<T>(endpoint, formData)  │
│                                             │
│  내부 동작:                                  │
│  ├── credentials: "include" (쿠키 전달)      │
│  ├── 401 → tryRefreshToken() → 재시도        │
│  └── 응답 정규화 (success/data 구조)          │
└─────────────────────────────────────────────┘

토큰 관리 유틸리티:
├── setAuthExpiredHandler(handler) — 만료 콜백 등록
├── setAuthBaseUrl(url) — 인증 엔드포인트 URL
├── tryRefreshToken() — 중복 방지 refresh (singleton promise)
└── redirectToLogin() — 로그인 리다이렉트
```

### 4.4. `@heritage-dx/api`

Repository Pattern 기반 API 레이어. General(공개)/Admin(관리자)/Server(ISR) 3가지 카테고리의 리포지토리를 제공한다.

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
│   │   ├── general/                      # 4개 공개 API 인터페이스
│   │   └── admin/                        # 12개 관리자 API 인터페이스
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
| `IConsultationRepository` | `getAll(params?)`, `create(data)`, `update(id, data)`, `delete(id)` |
| `IMembershipTradeRepository` | `getAll(params?)`, `create(data)`, `update(id, data)`, `delete(id)` |

**Admin Repository (관리자 API):** 12개 — clubs, scenarios, documents, club-documents, scenario-documents, club-scenario-documents, club-scenarios, global-documents, customer-documents, users, organizations, memberships

**Server Repository (ISR):** `IClubRepository`, `IScenarioRepository` — raw `fetch()` + `{ next: { revalidate } }`

**Factory 함수:**
- `createGeneralRepositories(apiClient)` → `GeneralRepositories`
- `createAdminRepositories(apiClient, baseUrl)` → `AdminRepositories`
- `createServerRepositories({ baseUrl, revalidate })` → `ServerRepositories`

**React Context:**
- `RepositoryProvider` — general/admin 리포지토리 주입
- `useClubRepository()`, `useScenarioRepository()`, `useConsultationRepository()`, `useMembershipTradeRepository()` — convenience hooks
- `useGeneralRepositories()`, `useAdminRepositories()` — 집합 hooks

### 4.5. `@heritage-dx/store`

Entity 타입 + DTO→Entity Mapper + Zustand 기반 캐시 스토어. API 응답(DTO)을 프론트엔드 친화적인 Entity로 정규화하고, stale-while-revalidate 캐싱을 제공한다.

```
packages/store/
├── src/
│   ├── index.ts              # 클라이언트 barrel export (stores, hooks, entities, mappers)
│   ├── entities/             # 도메인 Entity 타입
│   │   ├── index.ts
│   │   ├── common.ts         # PaginationState, FetchStatus
│   │   ├── club.ts           # ClubEntity, ClubDetailEntity (서브 객체 그룹핑)
│   │   ├── trade-memo.ts     # TradeMemoEntity
│   │   ├── trade-record.ts   # TradeRecordEntity (서브 객체 그룹핑)
│   │   ├── membership.ts     # MembershipEntity
│   │   ├── scenario.ts       # ScenarioEntity, ScenarioWithDocsEntity
│   │   └── document.ts       # DocumentEntity, GlobalDocumentEntity 등
│   ├── mappers/              # DTO ↔ Entity 변환 (순수 함수)
│   │   ├── index.ts
│   │   ├── club.mapper.ts
│   │   ├── trade-memo.mapper.ts
│   │   ├── trade-record.mapper.ts
│   │   ├── membership.mapper.ts
│   │   ├── scenario.mapper.ts
│   │   └── document.mapper.ts
│   ├── stores/               # Zustand 스토어 (stale-while-revalidate)
│   │   ├── index.ts
│   │   ├── club.store.ts     # 목록 캐시 + 상세 캐시 (Map<code, detail>)
│   │   ├── trade-memo.store.ts
│   │   └── trade-record.store.ts
│   └── hooks/                # 컴포넌트용 편의 훅
│       ├── index.ts
│       ├── useClubs.ts
│       ├── useClubDetail.ts
│       ├── useTradeMemos.ts
│       └── useTradeRecords.ts
```

**Entity 설계 원칙:**
- DTO(API 응답)의 `string | number | null` → Entity에서 `number | null`로 정규화 (`coerceToNumber`)
- 관련 필드를 서브 객체로 그룹핑 (예: `ClubDetailEntity.basicInfo`, `TradeRecordEntity.customer`)
- Union 리터럴 타입 활용 (`tradeType: '매수' | '매도'`)

**Mapper:**
- 순수 함수: `mapClubDtoToEntity(dto)`, `mapTradMemoDtoToEntity(dto)` 등
- 역방향: `mapTradeMemoEntityToInput(entity)`, `mapTradeRecordEntityToInput(entity)` (쓰기용)
- API 포맷 변경 시 Mapper만 수정 → Entity/컴포넌트 영향 없음

**Store (Zustand):**
- `createClubStore(repos)` — 클럽 목록 + 상세 캐시, `hydrateClubs()`/`hydrateDetail()` (SSR→클라이언트)
- `createTradeMemoStore(repos)` — CRUD + 낙관적 업데이트
- `createTradeRecordStore(repos)` — CRUD + 낙관적 업데이트
- 패턴: 캐시 히트 → stale 데이터 즉시 반환 + 백그라운드 refresh

**Exports:**
- `@heritage-dx/store` — 전체 (entities, mappers, stores, hooks)
- `@heritage-dx/store/entities` — Entity 타입만 (서버 안전)
- `@heritage-dx/store/mappers` — Mapper만 (서버 안전)

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

---

## 5. 앱별 아키텍처

### 5.1. OS (공개 사이트) — 포트 3000

골프장 정보 조회, 회원권 시세, 거래 상담을 위한 고객 대면 앱.

#### 라우트 구조

```
/app
├── layout.tsx                    # 루트 레이아웃
├── page.tsx                      # 홈 (골프장 목록 + 지도)
├── error.tsx                     # 에러 바운더리
├── global-error.tsx              # 글로벌 에러 핸들러
├── login/page.tsx                # 로그인
├── api/geocode/route.ts          # 지오코딩 API Route
├── api/notifications/send/route.ts # FCM 푸시 알림 전송
├── clubs/
│   ├── page.tsx                  # 골프장 디렉토리/검색
│   └── loading.tsx               # 로딩 스켈레톤
├── trades/page.tsx               # 거래 메모 (상담 기록)
└── membership-trades/page.tsx    # 거래 내역
```

#### 컴포넌트 (38개)

**코어:**
`AuthGuard`, `ClientLayout`, `Header`, `MobileNavigation`

**골프장:**
`ClubProfile`, `ClubDirectory`, `GolfClubDetail`, `GolfClubTable`, `GolfClubSearch`, `NaverMap`, `MapSidebar`

**골프장 프로필 섹션** (`club-profile/`):
`ClubBasicInfoTable`, `MembershipInfoSection`, `MembershipTradesSection`, `EstimateSection`, `CostCalculatorSection`, `GreenFeeField`, `InfoField`, `BenefitsSheetSection`, `DocumentsSection`, `NearbyClubPrices`, `PriceChart`

**회원권/거래:**
`MembershipCalculator`, `MembershipInfoSheet`, `MembershipTradesClient`, `RequiredDocuments`, `TradesPageClient`, `TransactionTypeForm`, `TradeMemoSidebar`

**모달/시트:**
`PasswordChangeModal`, `TaxGuideModal`, `TaxSettingsModal`, `EstimateSheet`

**유틸리티:**
`HomeClient`, `DashboardClient`, `SearchInput`, `OperatorNotice`, `SystemNotice`

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

`OsRepositoryProvider`에서 `@heritage-dx/api`의 General Repository를 주입. 클라이언트 컴포넌트에서 `useClubRepository()`, `useScenarioRepository()`, `useConsultationRepository()`, `useMembershipTradeRepository()` 훅으로 데이터 호출.

#### 주요 의존성

- **recharts** — 시세 차트 (`PriceChart`)
- **html2canvas** + **pdf-lib** — 견적서 PDF 생성 (`EstimateSheet`)
- **jszip** — 서류 ZIP 다운로드
- **Naver Map API** — 골프장 지도 (`NaverMap`)
- **firebase-admin** — FCM 푸시 알림 전송 + Firestore 토큰 관리

### 5.2. Back Office (관리자) — 포트 3001

골프장, 시나리오, 서류, 회원권, 사용자를 관리하는 관리자 앱.

#### 라우트 구조

```
/app
├── layout.tsx                            # 루트 레이아웃 (+ Sonner Toaster)
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
    ├── trade-memos/page.tsx              # 상담 기록 (거래 메모)
    ├── trade-records/page.tsx            # 거래 내역
    └── users/page.tsx                    # 사용자 관리
```

#### 컴포넌트 (7개)

**레이아웃** (`layout/`): `Header`, `Sidebar`, `PageContainer`

**폼** (`forms/`): `ClubForm`, `DocumentForm`, `MembershipForm`, `ScenarioForm`
- react-hook-form + zod 스키마 검증 기반

#### API 레이어 (Repository Pattern)

`BackOfficeRepositoryProvider`에서 `@heritage-dx/api`의 General + Admin Repository를 주입.

```typescript
// apps/back-office/src/contexts/RepositoryContext.tsx
const apiClient = new ApiClient("/api-proxy/api");
const general = createGeneralRepositories(apiClient);
const admin = createAdminRepositories(apiClient, "/api-proxy/api");

// 컴포넌트에서 훅으로 사용
useClubRepository()           // 골프장 조회 (general)
useConsultationRepository()   // 거래 메모 CRUD (general)
useMembershipTradeRepository() // 거래 내역 CRUD (general)
useAdminRepositories()        // 12개 admin 리포지토리 집합
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
useAuth() / useClubs() / useClubDetail() / useTradeMemos() 등
       ↓
컴포넌트
```

- OS: `AuthProvider` → `OsRepositoryProvider` → Zustand Store (캐시) → `useClubs()`, `useClubDetail()`, `useTradeMemos()`, `useTradeRecords()` hooks
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
컴포넌트 → useClubs() / useClubDetail() / useTradeMemos() 등
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
└── .github/workflows/deploy.yml     # CI/CD 워크플로우
```

| 항목 | OS | Back Office |
|------|-----|-------------|
| Cloud Run 서비스 | `heritage-dx-os` | `heritage-dx-back-office` |
| CPU / Memory | 1 / 512Mi | 1 / 512Mi |
| Min / Max instances | 0 / 10 | 0 / 5 |
| Artifact Registry | `asia-northeast3-docker.pkg.dev/{PROJECT}/heritage-dx/os` | `asia-northeast3-docker.pkg.dev/{PROJECT}/heritage-dx/back-office` |
| 인증 | Workload Identity Federation (GitHub Actions ↔ GCP) | 동일 |

### Next.js 설정 (공통)

```typescript
// apps/*/next.config.ts
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
