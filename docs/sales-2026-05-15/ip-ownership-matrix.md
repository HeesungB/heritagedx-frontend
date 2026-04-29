# Heritage DX — 개발/디자인 산출물 귀속 현황표

> 소스코드·디자인 산출물·계정이 현재 누구 명의로 관리되고 있는지 정리한 표입니다.
> 코드베이스에서 직접 확인 가능한 항목은 채워두었고, 외부 정보가 필요한 항목은 **❓ 사용자 확인 필요** 로 표시했습니다.
> 비밀번호/API Key/Secret 값은 포함하지 않습니다. 계정 소유자·관리자·접근권한·제작자·법인 귀속 여부만 다룹니다.
> 최종 업데이트: 2026-04-24 (작성: Heesung)

## 컬럼 설명

- **현재 명의/소유**: 현재 관리 주체
- **법인 귀속 필요**: 2026-05-15 이후 법인(헤리티지DX)으로 이전이 필요한지
- **출처**: 확인 근거 (코드베이스 내 파일). `❓ 사용자 확인 필요` = 외부 정보로만 확인 가능

---

## 1. 소스코드 / 레포지토리

| 항목 | 현재 명의/소유 | 법인 귀속 필요 | 출처 |
|------|----------------|----------------|------|
| 프론트엔드 레포 (heritagedx-frontend) | **GitHub Organization: `HeritageDX`** | ❓ 조직 owner 법인 명의 확인 | `.git/config` remote = `git@github.com:HeritageDX/heritagedx-frontend.git` |
| 백엔드/API 레포 | ❓ 사용자 확인 필요 | ❓ | 프론트 레포에서만 확인 가능 |
| GitHub Organization Owner | ❓ 사용자 확인 필요 | ✅ 개인 계정이면 법인 전환 권장 | GitHub 외부 |
| 주요 커밋 author | **HeesungB** (단일 기여자) | — | `git log --format='%an'` |
| 외주 개발 계약 존재 여부 | ❓ 사용자 확인 필요 | ✅ 있으면 계약서 저작권·2차적저작물작성권 조항 검토 | 코드베이스에서 판별 불가 |
| 라이선스 파일 (LICENSE/NOTICE) | **미존재** | ⚠️ 내부 전용이라도 사내 LICENSE 문구 추가 권장 | 루트 디렉토리 |

## 2. 배포 / 호스팅 / 도메인

| 항목 | 현재 명의/소유 | 법인 귀속 필요 | 출처 |
|------|----------------|----------------|------|
| CI/CD | **GitHub Actions** (HeritageDX 조직) | — | `.github/workflows/deploy.yml` |
| 런타임 호스팅 | **GCP Cloud Run** (리전: asia-northeast1) | ✅ GCP 프로젝트 법인 명의 확인 | 배포 워크플로우 |
| 컨테이너 레지스트리 | **GCP Artifact Registry** | ✅ 위와 동일 | 배포 워크플로우 |
| GCP 프로젝트 소유자 / 결제 계정 | ❓ 사용자 확인 필요 | ✅ | GCP 콘솔 외부 |
| Firebase (Auth/Messaging) | 프로젝트 사용 중 | ✅ 프로젝트 ownership 확인 | `firebase-messaging-sw.js`, 배포 시크릿 |
| API 도메인 `api.heritage-dx.com` | — (DNS 레코드 존재) | ✅ | `apps/os/next.config.ts` 프록시 설정 |
| 루트 도메인 `heritage-dx.com` 등록업체/소유자 | ❓ 사용자 확인 필요 | ✅ | DNS/WHOIS 외부 |
| DNS 관리 주체 (Route53/Cloudflare/Naver 등) | ❓ 사용자 확인 필요 | ✅ | 외부 |
| OAuth 공급자 | **Naver OAuth** (`NEXT_PUBLIC_NAVER_CLIENT_ID`) | ✅ 네이버 개발자센터 앱 소유 계정 확인 | 환경변수 |

## 3. 웹사이트 / 랜딩 / 마케팅

| 항목 | 현재 명의/소유 | 법인 귀속 필요 | 출처 |
|------|----------------|----------------|------|
| OS 앱 내 랜딩 (`apps/os/`) | 위 레포와 동일 (GitHub HeritageDX) | — | 코드 내재 |
| 별도 마케팅 랜딩 (Framer/Webflow 등) 존재 여부 | ❓ 사용자 확인 필요 | ❓ | 코드베이스에 Framer/Webflow 링크 없음. `framer-motion`(애니메이션 라이브러리)만 의존성에 있음 |
| Framer 프로젝트 소유자 | ❓ 사용자 확인 필요 | ❓ | 외부 |
| 마케팅 사이트 도메인 | ❓ 사용자 확인 필요 | ❓ | 외부 |

## 4. 디자인 산출물

| 항목 | 현재 명의/소유 | 법인 귀속 필요 | 출처 |
|------|----------------|----------------|------|
| Figma 워크스페이스 / 파일 | ❓ 사용자 확인 필요 | ✅ | 외부. 코드에는 Figma 링크 없음 |
| Figma 계정 소유자 | ❓ 사용자 확인 필요 | ✅ | 외부 |
| UI/UX 시안 제작자 | ❓ 사용자 확인 필요 | ✅ 외주면 2차적저작물작성권 양도 필수 | 외부 |
| 디자인 시스템 (`@heritage-dx/ui`, `@heritage-dx/tailwind-config`) 제작자 | ❓ (package.json author 필드 비어있음) | ✅ | `packages/ui/package.json` |
| 외부 UI 라이브러리 의존 | **@wonderflow/** 시리즈 (v14.3.0) — Wanda Design System (by Wonderflow B.V.) | ✅ 상업적 사용 가능 (아래 §4-1 참조) | 루트 `package.json` + `node_modules/@wonderflow/*/package.json` |
| 데모 화면 제작자 | ❓ 사용자 확인 필요 | ✅ | 외부 |
| 외주 디자인 계약서 / 저작권 양도 서면 | ❓ 사용자 확인 필요 | ✅ 필수 | 외부 |

### 4-1. @wonderflow (Wanda Design System) 라이선스 상세

| 항목 | 내용 |
|------|------|
| 저작권자 | **Wonderflow B.V.** (네덜란드, AI 기반 고객 피드백 분석 SaaS 기업) |
| 프로젝트명 | **Wanda Design System** |
| 공식 저장소 | https://github.com/wonderflow-bv/wanda |
| 공식 사이트 | https://design.wonderflow.ai |
| 사용 중인 패키지 | `@wonderflow/config`, `@wonderflow/react-components`, `@wonderflow/symbols`, `@wonderflow/themes`, `@wonderflow/tokens` (모두 v14.3.0) |
| 선언된 라이선스 (package.json) | **Apache License 2.0** (5개 패키지 모두) |
| 실제 LICENSE 파일 내용 | **MIT License** (Copyright © 2021 Wonderflow) — `@wonderflow/config` 에만 포함. 나머지 4개 패키지는 LICENSE 파일 미동봉 |

#### ⚠️ 라이선스 표기 불일치

`package.json` 은 Apache-2.0 을 선언하지만, 실제 동봉된 LICENSE 파일은 MIT 텍스트입니다. **둘 다 상업적 이용과 재배포를 허용하는 permissive 라이선스**이므로 실제 사용에는 무방하나, 엄밀한 대응을 위해서는 업스트림 정책을 한 번 확인하는 것이 안전합니다 (GitHub repo `LICENSE` 파일과 `package.json` 중 어느 쪽이 공식인지).

#### Heritage DX 에서의 준수 사항 (MIT·Apache-2.0 공통)

| 요구사항 | 필수 조치 |
|----------|-----------|
| 저작권 표시 유지 | 배포물(JS 번들 등)에 원저작권 문구(`Copyright © 2021 Wonderflow`) 보존 |
| 라이선스 문구 첨부 | 제품 About/Credits 화면 또는 별도 `THIRD_PARTY_LICENSES.md` 에 MIT/Apache-2.0 원문 포함 |
| 상표 사용 금지 | "Wonderflow" / "Wanda" 이름·로고를 헤리티지 DX 홍보물에 **사용하지 않음** (MIT·Apache 모두 상표 권한 비부여) |
| 수정사항 고지 (Apache-2.0 시) | Wanda 컴포넌트를 소스 수준에서 수정했다면 수정한 사실을 NOTICE 또는 주석에 기록 |
| 특허 조항 (Apache-2.0) | Wonderflow 가 보유한 특허가 있다면 사용자에게 자동 라이선스 허여 — 분쟁 시 보호됨 |

#### 허용되는 것 ✅

- 상업적 이용 / 사내 SaaS 판매
- 소스 수정 / 독자 빌드
- 재배포 (라이선스 문구 유지 조건)
- 비공개 파생 제품 제작
- 참존 외 고객사 확대

#### 허용되지 않는 것 ❌

- Wonderflow / Wanda 상표·로고 사용 (마케팅 자료에 "Wanda로 구축" 표기 시 사전 허가 필요)
- "보증(Warranty)" 제공 주장 — 라이선스는 AS-IS 조건이라 2차 배포 시 자체 보증 필요

#### 권장 이행 체크리스트

- [ ] `apps/os` / `apps/back-office` 에 `THIRD_PARTY_LICENSES.md` 또는 About 화면 추가 (Wonderflow 저작권 + 라이선스 원문)
- [ ] 빌드 번들에 라이선스 주석 보존되는지 (Next.js 기본값으로 보존됨 — 수동 제거 방지)
- [ ] 마케팅/세일즈 자료에 "Wonderflow"·"Wanda" 이름 미사용 확인
- [ ] 업스트림 LICENSE 불일치건 트래킹 티켓 생성 (실무 영향 없음, 기록용)

---

## 5. 참존(Chamzone) 관련 요소 — 외부 공개 전 점검

코드베이스에서 **참존/참존회원권** 문자열이 다음 위치에 남아 있습니다. 세일즈 데모 시 노출 여부·법률 검토 필요:

| 위치 | 노출 형태 | 처리 권장 |
|------|-----------|-----------|
| `apps/os/src/components/MembershipInfoSheet.tsx` | "참존회원권" 언급 | 범용 텍스트/데모 데이터로 대체 검토 |
| `apps/os/src/components/EstimateSheet.tsx` | 견적서 기본값 "참존회원권" | 데모 조직명 동적 치환 확인 |
| `docs/api/admin/users.md` | `organizationName: "참존회원권"` | 내부 문서 — 대외 자료와 분리 |

## 6. 법률 검토 필요 항목 (외부 공개 문구)

| 항목 | 상태 | 비고 |
|------|------|------|
| 개인정보처리방침 / 이용약관 | ❓ 사용자 확인 필요 | OS 앱 루트에서 별도 라우트 미검출 |
| "시세" 문구의 금융투자 광고 규제 저촉 여부 | ❓ 법무 검토 | 회원권을 투자상품처럼 서술하지 않도록 확인 |
| "최저가/최고가" 등 단정 표현 | ❓ | `MarketPriceSummary` 내 문구 확인 필요 |
| 고객사(참존) 로고/상표 사용 권한 | ❓ 사용자 확인 필요 | 외부 데모 시 사용 허락 서면 필요 |
| 환불/수수료 안내 | ❓ | 거래내역 화면의 수수료 계산식 노출 시 |

---

## 7. 사용자 입력 요청 항목 (요약)

아래 항목만 공유해주시면 본 표를 **확정본**으로 마감할 수 있습니다. (비번/시크릿 제외)

- [ ] GitHub `HeritageDX` 조직 Owner 계정 (법인/개인)
- [ ] 백엔드/API 레포 존재 여부 및 위치
- [ ] GCP 프로젝트 소유자·결제 계정 명의
- [ ] `heritage-dx.com` 도메인 등록업체 및 소유자
- [ ] DNS 관리 주체 (Route53/Cloudflare/Naver 등)
- [ ] Firebase 프로젝트 소유 계정
- [ ] 네이버 개발자센터 앱 소유 계정
- [ ] Figma 워크스페이스명·소유 계정
- [ ] Framer 프로젝트 존재 여부 및 소유 계정
- [ ] UI/UX·디자인 시스템·데모 화면 제작자 (내부/외주 여부)
- [ ] 외주 계약서 저작권·2차적저작물작성권 조항 정리 상태
- [ ] 참존 상표/로고 사용 허락 서면
- [ ] 개인정보처리방침/이용약관 준비 상태
