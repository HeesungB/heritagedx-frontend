# Heritage DX — 단계별 개선 로드맵

작성일: 2026-04-14  
검토 범위: `apps/os`, `apps/back-office`, `packages/*` 전체 (구조·아키텍처·상태관리·도메인/뷰 분리·성능·DX)

---

## 원칙

> **"뷰는 사용·폐기 가능, 도메인은 안정."**

UI 변경이 빈번한 프로젝트에서 지속 가능한 구조를 유지하려면 두 레이어를 엄격히 분리해야 한다.

| 레이어 | 범위 | 변경 빈도 |
|--------|------|-----------|
| **도메인** | `packages/types`, `packages/store/{entities,mappers,stores,hooks}`, `packages/api/{interfaces,repositories}`, `packages/utils` | 낮음 (API·정책·규칙이 바뀔 때) |
| **뷰** | `apps/*/src/components/**`, `apps/**/page.tsx`, `packages/ui` | 높음 (디자인·UX 요구사항) |

완료 기준 (Phase 0):
- `grep -r "from \"@heritage-dx/types\"" apps/*/src/components` → 0건
- `grep -r "fetch(" apps/*/src/components` → 0건
- `grep -r "mapXxxDtoToEntity" apps/*/src/components` → 0건

---

## Phase 0 — 도메인/뷰 분리 강화 (최우선)

### 0-1. 세금·수수료 도메인 패키지화

**문제**
- `apps/os/src/utils/taxCalculator.ts` — 양도세 구간, 법인세 구간, 취득세(0.022), 지방소득세(0.1), 기본공제(250), 중개수수료율(0.004) 등 전체 세금 엔진이 OS 앱 전용 위치에 존재.
- `apps/os/src/constants/taxDefaults.ts` — 세율 기본값 상수.
- BO KPI 손익 계산 시 공유 불가.

**개선**
1. `packages/store/src/domain/tax/` 디렉토리 생성.
2. `taxCalculator.ts` + `taxDefaults.ts` 이동 → `packages/store/src/domain/tax/calculator.ts` + `tax-defaults.ts`.
3. `TaxSettingsEntity` 타입 정의, `calculateTax(input: TaxInput): TaxResult` 순수 함수 export.
4. OS `apps/os/src/hooks/useTaxSettings.ts`, BO KPI 페이지에서 공유 함수 사용.

**검증**: `pnpm type-check` 통과 + OS 세금 계산기 동작 확인.

---

### 0-2. 폼 Zod 스키마 도메인화

**문제**
- `apps/back-office/src/components/forms/ClubForm.tsx:17-30` — Zod `clubSchema` 인라인.
- `ScenarioForm.tsx:34-59`, `MembershipForm.tsx`, `DocumentForm.tsx` — 각 폼마다 독립 스키마.
- OS 쪽에서 동일 도메인 검증 재사용 불가. 스키마와 렌더링 로직이 뒤섞임.

**개선**
1. `packages/store/src/schemas/` 디렉토리 신설.
2. `club.schema.ts`, `scenario.schema.ts`, `membership.schema.ts`, `document.schema.ts` 생성 — Zod 스키마 + 유추 타입(`ClubFormValues` 등) export.
3. 각 폼 컴포넌트는 `import { clubSchema, ClubFormValues } from "@heritage-dx/store/schemas"` 후 렌더링만 담당.

**검증**: `pnpm type-check` + 폼 입력 검증 동작 확인.

---

### 0-3. 훅 커버리지 확장

**문제**: 현재 `packages/store/src/hooks`에는 `useClubs`, `useClubDetail`, `useTradeMemos`, `useTradeRecords` 4개만 존재. 나머지 도메인은 컴포넌트가 repository/mapper를 직접 호출하거나 raw fetch를 사용.

| 훅 | 현재 상황 | 신설 위치 |
|----|-----------|-----------|
| `useScenarios(clubCode)` | `TransactionTypeForm.tsx:45` raw fetch | `packages/store/src/hooks/useScenarios.ts` |
| `useScenarioMatch` | 뷰에서 매칭 로직 인라인 | 동일 파일 내 셀렉터 |
| `useDocuments(clubCode)` | repo 직접 호출 | `packages/store/src/hooks/useDocuments.ts` |
| `useGlobalDocuments` | repo 직접 호출 | 동일 |
| `useClaims` | `useClaimRepository()` 직접 | `packages/store/src/hooks/useClaims.ts` |
| `useKpi(params)` | `KpiMiniDashboard.tsx` 병렬 fetch 직접 | `packages/store/src/hooks/useKpi.ts` |
| `useUsers` | `useAdminRepositories()` 직접 | `packages/store/src/hooks/useUsers.ts` |
| `useMyOrganization` | `useAdminRepositories()` 직접 | 동일 |
| `useNotices` | `DashboardClient.tsx` raw fetch+custom auth | `packages/store/src/hooks/useNotices.ts` |
| `useSendTradeNotification` | `TradeMemoSidebar`, `TradesPageClient` 중복 | `apps/os/src/hooks/useSendTradeNotification.ts` |

기존 `useTradeMemos` / `useTradeRecords`는 `packages/store`에 있지만 `TradeMemoSidebar.tsx:62`, `TradesPageClient.tsx:154`, `MembershipTradesClient.tsx:171`에서 mapper를 직접 호출 중 → 훅을 통해 소비하도록 전환.

**검증**: `grep -r "mapTradMemoDtoToEntity\|mapTradeRecordDtoToEntity" apps/` → 0건.

---

### 0-4. Raw fetch 제거 (컴포넌트 내부)

**문제** (파일:행 기준):

| 컴포넌트 | fetch 대상 | 대체 방안 |
|----------|-----------|-----------|
| `TransactionTypeForm.tsx:45` | `/api-proxy/api/clubs/{code}/scenario-options` | `useScenarios(clubCode)` |
| `DashboardClient.tsx:11-28` | notice CRUD (커스텀 fetchWithAuth) | `useNotices` 훅 + Notice Repository |
| `NaverMap.tsx:56` | `/api/geocode?address=...` | `geocodeRepo.getCoords(address)` 또는 OS 전용 `useGeocode` 훅 |
| `TradeMemoSidebar.tsx:123` | `/api/notifications/send` | `useSendTradeNotification` 훅 (fire-and-forget) |
| `TradesPageClient.tsx:232` | `/api/notifications/send` | 동일 훅 재사용 |
| `PriceChart.tsx:70`, `RequiredDocuments.tsx:129,227`, `DocumentsSection.tsx:108,153` | `doc.downloadUrl` raw fetch + PDF merge | `documentsRepo.download(doc)` repository 메서드 |

**검증**: `grep -r "fetch(" apps/*/src/components` → 0건.

---

### 0-5. DTO 재-export 중단

**문제**
- `apps/os/src/types/index.ts:18-29`, `apps/back-office/src/types/index.ts:11,72-88` — `@heritage-dx/types` DTO(`Scenario`, `AvailableFilters`, `Organization`, `ClubContact` 등)를 `@/types`로 re-export.
- 폼 컴포넌트(`ClubForm.tsx:6`, `ScenarioForm.tsx:6` 등)와 클라이언트 컴포넌트가 DTO를 직접 import.

**개선**
1. `apps/*/src/types/index.ts`에서 도메인 DTO re-export 제거.
2. 해당 타입을 `@heritage-dx/store/entities`의 Entity로 교체.
3. DTO import는 mapper 파일 내부에만 허용.

**검증**: `grep -r "from \"@heritage-dx/types\"" apps/*/src/components` → 0건.

---

### 0-6. 역할·열거 라벨 도메인 상수화

**문제**: `user.role === "SUPER_ADMIN"` 비교가 여러 뷰 파일에 산재.

| 파일 | 사용 |
|------|------|
| `apps/os/src/components/DashboardClient.tsx:37` | role 체크 |
| `apps/back-office/src/components/layout/Header.tsx` | role 라벨 표시 |
| `apps/back-office/src/app/(dashboard)/users/page.tsx` | 역할 기반 UI 조건 |
| `apps/back-office/src/app/(dashboard)/my-organization/page.tsx` | 역할 기반 접근 제어 |

**개선**
1. `packages/store/src/domain/auth/roles.ts` 신설.
2. `UserRole` union, `ROLE_LABEL: Record<UserRole, string>`, `canManageOrg(user: User): boolean` 함수 export.
3. 각 파일에서 문자열 비교 → 타입 안전한 함수 호출로 교체.

---

### 0-7. 통화·숫자 헬퍼 통합

**문제**: `packages/utils/currency.ts`에 `formatManwon`, `wonToManwon`, `parseTransferFee` 등이 이미 있으나, 뷰에서 중복 구현.

| 파일 | 중복 함수 |
|------|-----------|
| `club-profile/MarketPriceSummary.tsx:10` | `toManwon` (동일 로직) |
| `kpi/KpiEmployeeComparison.tsx:32` | `formatProfitShort` (억/천만/만 단위) |
| `club-profile/EstimateSection.tsx:169` | `parseTransferFeeToWon` (parseTransferFee 변형) |
| `MembershipTradesClient.tsx:45` | `formatNumberWithComma`, `parseNumberInput` |

**개선**: `packages/utils/src/currency.ts`에 `formatProfitShort`, `parseKrwInput` 추가 후 뷰 인라인 함수 제거.

---

### 0-8. KPI 기간·버킷 로직 도메인화

**문제**
- `apps/back-office/src/components/kpi/KpiFilterBar.tsx:35-60` — `getDateRange`, `PRESET_GROUPS`(기간 프리셋 테이블) 인라인.
- `apps/back-office/src/components/kpi/KpiMiniDashboard.tsx:50-119` — 월별 버킷 생성 + 12+2개 병렬 fetch 오케스트레이션 → 순수 비즈니스 로직.

**개선**
1. `packages/store/src/domain/kpi/periods.ts` 신설 — `getDateRange`, `getMonthBuckets`, `PRESET_GROUPS` export.
2. `packages/store/src/hooks/useKpi.ts` — 기간 파라미터를 받아 데이터 fetch + 집계. `KpiMiniDashboard`는 훅 결과를 렌더링만.

---

### 0-9. 엔티티 메서드·셀렉터 승격

**문제**
- `apps/os/src/components/TransactionTypeForm.tsx:45-77` — `side`, `ownerType`, `hasProxy`, `isCertificateLost` 기반 시나리오 매칭 서술자가 뷰에 인라인.
- `apps/os/src/components/club-profile/DocumentsSection.tsx:56-59` — `isUrlExpired` 정책(URL 만료 기준) 뷰에 인라인.

**개선**
1. `ScenarioEntity.matches(filters: ScenarioFilters): boolean` 메서드 또는 스토어 셀렉터로 이동.
2. `DocumentEntity.isDownloadExpired(): boolean` — Entity 메서드로 승격.

---

### 0-10. 레이어링 린트 강제

**목표**: 실수로 레이어를 역전시키는 것을 빌드타임에 차단.

**방법**: ESLint `no-restricted-imports` 규칙을 `apps/*/src/components/**` 경로 패턴에 적용.

```jsonc
// apps/*/eslint.config.mjs (또는 .eslintrc)
{
  "files": ["src/components/**/*.tsx", "src/components/**/*.ts"],
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        "@heritage-dx/types",
        "@heritage-dx/api-client",
        "*/mappers/*",
        "*/normalizers/*",
        "*/repositories/*"
      ]
    }]
  }
}
```

허용 import: `@heritage-dx/store`(entities+hooks), `@heritage-dx/utils`, `@heritage-dx/ui`.

---

## Phase 1 — P0 Quick Wins

### 1-1. `middleware.ts` 도입 (BO 라우트 가드)

**문제**: `middleware.ts`가 0개. 인증 보호는 클라이언트 `AuthContext`에만 의존 → 미인증 상태에서 대시보드 셸이 잠깐 노출되며, `apps/back-office/src/app/api/fcm-tokens`, `notifications` API Route에 역할 기반 가드 없음.

**개선**
- `apps/back-office/middleware.ts` 신설 — 세션 쿠키 검증, 미인증 시 `/login` 리다이렉트. `SUPER_ADMIN`·`ORG_ADMIN` 제한 라우트(`/users`, `/my-organization`) 역할 가드.

---

### 1-2. 무거운 라이브러리 동적 임포트

**문제**: `recharts`, `pdf-lib`, `jszip`, `html-to-image` 정적 import — 초기 번들에 포함.

| 파일 | 라이브러리 |
|------|-----------|
| `club-profile/PriceChart.tsx` | recharts |
| `apps/os/src/utils/sheet-print.ts` | html-to-image, pdf-lib |
| `club-profile/DocumentsSection.tsx` | jszip |
| `apps/back-office/src/components/kpi/*.tsx` | recharts |

**개선**: `next/dynamic(() => import(...), { ssr: false, loading: () => <Skeleton /> })` 패턴. PDF/ZIP/이미지 라이브러리는 클릭 핸들러 내 dynamic import.

---

### 1-3. `loading.tsx`·`error.tsx` 전 라우트 보강

**문제**: `apps/os/src/app/clubs/loading.tsx` 외 loading/error 0개. BO 대시보드 전 라우트에 없음.

**개선 대상**:
- OS: `trades/loading.tsx`, `trades/error.tsx`, `claims/loading.tsx`, `membership-trades/loading.tsx`
- BO: `(dashboard)/clubs/loading.tsx`, `(dashboard)/trade-memos/loading.tsx`, `(dashboard)/trade-records/loading.tsx`, `(dashboard)/kpi/loading.tsx`, `(dashboard)/layout.tsx`에 `error.tsx`

---

### 1-4. `any`·불안전 캐스트 정리

총 89개 `any`, 30 파일. 우선순위 핫스팟:

| 파일 | `any` 수 |
|------|----------|
| `apps/os/src/types/index.ts` | 13 |
| `apps/back-office/src/types/index.ts` | 10 |
| `apps/back-office/src/components/forms/MembershipForm.tsx` | 9 + 2 `as any` |
| `apps/back-office/src/app/(dashboard)/clubs/[code]/page.tsx` | 9 |
| `apps/os/src/components/NaverMap.tsx` | 4 + `as any` |

**개선**: `unknown` + 타입 가드 / 제대로 된 Entity 타입 사용. `NaverMap.tsx`는 `types/naver-maps.d.ts` 선언 파일 추가.

---

### 1-5. CI + Turbo 개선

**문제**: GitHub Actions 워크플로우 미존재, `turbo.json` task에 `inputs` 미선언(캐시 키 불안정).

**개선**:
1. `.github/workflows/ci.yml` — `pnpm install && pnpm lint && pnpm type-check && pnpm build`.
2. `turbo.json` 각 task에 `"inputs": ["src/**", "tsconfig.json"]` 추가.

---

### 1-6. BO 초기 로드 N+1 제거

**문제**: `apps/back-office/src/contexts/DataContext.tsx:78-88` — `clubsRepo.getAll({page, limit: 100})`를 `hasNext === false`까지 순차 반복. 클럽 수가 많으면 수십 건의 연속 요청.

**개선 옵션**:
- A. 첫 응답의 `pagination.totalPages`를 보고 `Promise.all`로 병렬 페이징.
- B. 서버 컴포넌트 + Server Repository로 이동(ISR 캐싱 활용).
- C. 백엔드에 bulk 엔드포인트(`/clubs?limit=all`) 요청.

---

## Phase 2 — P1 구조 개선

### 2-1. 상태관리 일원화 (DataContext → Zustand)

**문제**: BO의 `DataContext`(clubs, tradeMemos, tradeRecords)와 `@heritage-dx/store`의 Zustand 스토어가 동일 도메인을 이중 관리. `PreloadedMemos`, `PreloadedRecords` 타입이 store Entity와 중복.

**개선**: `DataContext` 제거 → BO도 `club.store`, `trade-memo.store`, `trade-record.store` Zustand 스토어 사용. `useData()` → `useClubs()`, `useTradeMemos()`, `useTradeRecords()` 훅으로 대체.

---

### 2-2. 공유 컴포넌트 승격 (`@heritage-dx/ui`)

중복 구현된 컴포넌트:

| 컴포넌트 | OS | BO | 이동 대상 |
|----------|:--:|:--:|----------|
| `GoogleAnalytics` | O | O | `@heritage-dx/ui` |
| 통화 입력 필드 | O | O | `@heritage-dx/ui` |
| 초성·지역 필터 | O | O | `@heritage-dx/ui` |
| `AppShell` (Header+Sidebar+PageContainer 조합) | - | O | `@heritage-dx/ui` |

---

### 2-3. Entity/Mapper 커버리지 확장

현재 mapper가 없는 도메인 → 뷰에서 DTO를 직접 소비:

| 도메인 | 추가 위치 |
|--------|-----------|
| `claim` | `packages/store/src/mappers/claim.mapper.ts` |
| `kpi` | `packages/store/src/mappers/kpi.mapper.ts` |
| `organization` | `packages/store/src/mappers/organization.mapper.ts` |
| `user` | `packages/store/src/mappers/user.mapper.ts` |
| `customer-document` | `packages/store/src/mappers/customer-document.mapper.ts` |

---

### 2-4. Server 경계·ISR 튜닝

**문제**: `export const revalidate` 선언 0건. Server Repository(`server-repositories.ts`)가 있음에도 클럽 상세·시세 RSC가 매 요청마다 fetch.

**개선**: 클럽 디렉토리 페이지, 클럽 상세 페이지에 `export const revalidate = 300` 또는 `revalidateTag` 적용. `unstable_cache` 활용 검토.

---

### 2-5. 환경변수 zod 검증

**문제**: `process.env.*` 26개 raw 참조. Firebase VAPID 키 등 누락 시 FCM 무음 실패.

**개선**: `packages/utils/src/env.ts`에 zod 스키마로 파싱 + 앱 시작 시 fail-fast.

---

### 2-6. FCM 강화

**문제**:
- `useFCMToken.ts` — 로그아웃 시 토큰 미삭제.
- 5xx 응답 시 에러만 콘솔에 출력, 사용자 피드백 없음.
- 만료 토큰 정리 미흡.

**개선**: `AuthContext` logout에서 `DELETE /api/fcm-tokens/:token` 호출. 5xx 1회 재시도. Firestore TTL 기반 Cloud Function 또는 주기적 정리 로직.

---

### 2-7. `ApiClient` 싱글턴 공유

**문제**: `RepositoryContext.tsx`가 `useMemo`로 `ApiClient`를 생성 → 컴포넌트 재마운트 시 새 인스턴스, `tryRefreshToken()` singleton 효과 희석.

**개선**: base URL별 모듈 레벨 싱글턴(`Map<string, ApiClient>`)으로 교체.

---

## Phase 3 — P2 장기·DX

| 항목 | 설명 |
|------|------|
| **테스트** | Vitest + React Testing Library. `packages/store/src/mappers/*` 순수 함수부터 시작. |
| **패키지 README** | `packages/api`, `packages/store` 우선. Public API 표면, Entity vs DTO 계약 문서화. |
| **접근성·모바일 내비** | `MobileNavigation.tsx` aria-label, keyboard focus. `roleLabels: Record<string, string>` → `Record<UserRole, string>` 타입 강화. |
| **번들 분석기** | `@next/bundle-analyzer` 양 앱에 추가. `NaverMap.tsx` → `next/script strategy="lazyOnload"`. |
| **Turbo/스크립트 개선** | `turbo.json`에 `globalDependencies`(`tsconfig.json`, `.env`) 추가. root `package.json`에 `clean`, `format`, `test` 스크립트 추가. |

---

## 실행 순서

```
Phase 0: 0-1 → 0-2 → 0-3 → 0-4 → 0-5 → 0-6 → 0-7 → 0-8 → 0-9 → 0-10
Phase 1: 1-1 → 1-3 → 1-2 → 1-5 → 1-6 → 1-4
Phase 2: 2-1 → 2-3 → 2-4 → 2-2 → 2-5 → 2-6 → 2-7
Phase 3: 순서 무관
```

각 Phase는 독립 PR로 진행하며 `pnpm type-check && pnpm lint && pnpm build` 통과를 필수 조건으로 한다.
