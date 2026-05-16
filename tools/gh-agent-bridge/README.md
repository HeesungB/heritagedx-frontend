# gh-agent-bridge

GitHub 이슈/PR 을 Claude·Codex CLI 로 라우팅하는 **로컬 데몬**.

전체 아키텍처와 의사 결정 배경은 `docs/workflows/github-agent-bridge.md` 를 본다.

## 빠른 시작

```bash
cd tools/gh-agent-bridge
pnpm install --ignore-workspace   # 모노레포 워크스페이스와 분리해 독립 설치
cp .env.example .env              # 비밀값 채우기
pnpm dev                          # 개발 모드 (tsx watch)
```

> `--ignore-workspace` 가 빠지면 pnpm 이 상위 `pnpm-workspace.yaml` 의 `apps/*`·`packages/*` 만 보고 이 디렉토리를 건너뛰어 `node_modules` 가 생성되지 않는다.

설치 후 `better-sqlite3` 의 네이티브 빌드를 허용해야 데몬이 SQLite 큐를 사용할 수 있다:

```bash
pnpm approve-builds   # better-sqlite3, esbuild 허용
pnpm rebuild better-sqlite3
```

`pnpm start` 또는 launchd 로 항상 가동.

## 의존성

- Node 22+
- pnpm 9+
- `claude` CLI (`/Applications/cmux.app/...`)
- `codex` CLI (`~/.nvm/.../bin/codex`)
- `gh` CLI (GitHub App 토큰을 환경에 주입할 때 사용)
- `cloudflared` (webhook 외부 터널)

## 디렉토리

```
src/
  agents/           # claude/codex CLI 어댑터
  handlers/         # issue / comment / implement / pr 이벤트 핸들러
  config.ts         # zod 환경변수 검증
  db.ts             # better-sqlite3 + WAL, 이벤트/이슈/PR 상태
  github.ts         # Octokit (GitHub App) wrapper
  logger.ts
  plan.ts           # 플랜 응답 파서 + 합의 로직
  prompts.ts        # 프롬프트 템플릿 로더
  queue.ts          # p-queue 워커 풀, 이슈별 직렬화
  screenshot.ts     # Playwright before/after 캡처
  server.ts         # Fastify webhook 엔드포인트
  slash.ts          # 슬래시 커맨드 파서
  state.ts          # 라벨 상태 머신
  worktree.ts       # git worktree 관리
prompts/            # 시스템 프롬프트 (한국어 응답 강제)
launchd/            # macOS 자동 기동 plist
cloudflared/        # named tunnel 설정 예시
```

## 데몬 등록 (macOS)

```bash
cp launchd/com.heritagedx.ghbridge.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/com.heritagedx.ghbridge.plist
launchctl start com.heritagedx.ghbridge
# 로그
tail -f ~/Library/Logs/gh-agent-bridge.{out,err}.log
```

## cloudflared 셋업

`docs/workflows/github-agent-bridge.md` 의 "Cloudflare 위임 가이드" 단계를 따른다. 요약:

```bash
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create gh-bridge
cloudflared tunnel route dns gh-bridge gh-bridge.blackmarket.kr
cp cloudflared/config.yml.example ~/.cloudflared/config.yml
# <TUNNEL_UUID> 교체
sudo cloudflared service install
```

## 운영

| 동작 | 명령 |
|---|---|
| 로그 보기 | `tail -f ~/Library/Logs/gh-agent-bridge.out.log` |
| 강제 재시작 | `launchctl kickstart -k gui/$(id -u)/com.heritagedx.ghbridge` |
| webhook 재배달 | GitHub App 설정 → Recent Deliveries → Redeliver |
| 일일 예산 확인 | sqlite3 `${DB_PATH}` `SELECT * FROM budget_usage;` |

## 검증

```bash
pnpm type-check
curl -s http://127.0.0.1:7878/health
gh api repos/HeesungB/heritage-dx/hooks  # GitHub App webhook 확인
```

> _데몬 v6 — explicit repo target 검증 완료._
