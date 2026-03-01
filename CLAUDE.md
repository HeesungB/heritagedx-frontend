# Heritage DX — Claude Code 가이드

## 필수 확인 사항

1. **작업 전 `STRUCTURE.md`를 반드시 확인할 것** — 프로젝트의 구조, 패키지 의존성, 아키텍처 패턴을 이해한 후 작업을 시작한다.
2. **작업 후 `STRUCTURE.md` 업데이트** — 새 파일/패키지 추가, 아키텍처 변경 등이 있으면 `STRUCTURE.md`에 반영한다.

## 프로젝트 구조

- **모노레포**: pnpm workspace + Turborepo
- **앱**: `apps/os` (공개 사이트, 포트 3000), `apps/back-office` (관리자, 포트 3001)
- **패키지**: `packages/` 하위 8개 공유 패키지

## 핵심 패턴

### Repository Pattern (`@heritage-dx/api`)
- API 호출은 **Repository 인터페이스** 기반으로 추상화
- General (공개 API) / Admin (관리자 API) / Server (ISR) 3가지 카테고리
- **팩토리 함수**로 구현체 생성 → **React Context**로 주입 → **hooks**로 소비
- 새 API 엔드포인트 추가 시: 인터페이스 → 구현체 → 팩토리에 등록 → Context에 훅 추가

### 타입
- 공유 타입: `@heritage-dx/types`
- 앱 전용 타입: 각 앱의 `src/types/`

### 스타일링
- Tailwind CSS 3.4 + 공유 테마 (`@heritage-dx/tailwind-config`)

## 명령어

```bash
pnpm build          # 전체 빌드
pnpm dev            # 개발 서버 (OS: 3000, BO: 3001)
pnpm lint           # 린트
pnpm type-check     # 타입 체크
```

## Clean Up

작업 시작 전 기존 개발 서버가 실행 중이면 종료한다.

```bash
# 포트 3000 (OS) / 3001 (Back Office) 사용 중인 프로세스 종료
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
```
