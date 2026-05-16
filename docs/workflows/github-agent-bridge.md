# GitHub × Claude/Codex 협업 워크플로우 (gh-agent-bridge)

> 👤 **사용자 가이드**(이슈 만드는 법·슬래시 명령·plan 댓글 읽기): [`agent-issue-guide.md`](./agent-issue-guide.md)
> 🛠 **이 문서**: 운영자용 — Cloudflare 위임, GitHub App 생성, cloudflared 터널, launchd 등록, 트러블슈팅

GitHub 이슈를 시작점으로 **Claude CLI 와 Codex CLI 가 협업**하여 플랜·토론·구현·상호 리뷰까지 진행하는 로컬 데몬형 자동화. 무거운 LLM 호출은 사용자 PC 에서 돌고, GitHub Actions 는 가벼운 라벨링·트리거만 담당한다.

## 사용자 워크플로우

```
이슈 등록  ──▶  state:new (Actions)
               │
               ▼
       데몬: 양 에이전트 병렬 플랜 작성 → 합의 게시
               │
       ┌───────┴────────┐
       ▼                ▼
  size 합의             둘 다 large
       │                │
       │                ▼
       │            분해 제안 → /approve-split or /reject-split
       │
       ▼
  사용자 대화: /claude, /codex, /both 로 토론
       │
       ▼
  /implement claude   또는   /implement codex
       │
       ▼
  데몬: worktree 안에서 에이전트 CLI 호출
        → lint/type-check (실패 시 1회 자가 수정)
        → 커밋·푸시·gh pr create (agent:<name> 라벨)
       │
       ▼
  PR opened → 반대편 에이전트가 자동 리뷰 코멘트
              + (UI 변경 시) Playwright 스크린샷 before/after 게시
       │
       ▼
  PR 댓글에서 /claude·/codex 추가 토론 → 사용자가 직접 머지
```

## 슬래시 커맨드

| 명령 | 동작 |
|---|---|
| `/claude <text>` | Claude 에게만 질문 |
| `/codex <text>` | Codex 에게만 질문 |
| `/both <text>` | 두 에이전트 모두에게 (병렬) |
| `/implement claude\|codex` | 해당 에이전트가 구현 시작 → PR 생성 |
| `/approve-split` | 분해 제안 승인 → sub-issue 자동 생성 |
| `/reject-split` | 분해 거절, 단일 PR 진행 |
| `/cancel` | 현재 작업 취소 |
| `/screenshot <route>` | 특정 라우트 강제 캡처 |
| `/handoff claude\|codex` | PR 작성자 변경 |
| `/help` | 도움말 |

> 댓글 **첫 줄**만 슬래시 커맨드로 인식한다. 봇 자신의 코멘트는 무시.

## 상태 라벨

| 라벨 | 의미 |
|---|---|
| `state:new` | 데몬이 플랜 작업 큐잉 대상 |
| `state:planning` | 에이전트 플랜 작업 중 |
| `state:plan-ready` | 두 플랜 완성, 단일 PR 가능 |
| `state:plan-disagree` | 의견 차, 사용자 결정 대기 |
| `state:split-proposed` | 분해 제안 게시 |
| `state:implementing:<agent>` | 구현 중 |
| `state:awaiting-review` | PR open, 상호 리뷰 대기 |
| `state:reviewed` | 리뷰 완료 |
| `agent:claude` / `agent:codex` | 작성·관여 에이전트 표기 |

---

## 최초 셋업 가이드

### 1) Cloudflare 위임 (옵션 A: blackmarket.kr 전체)

기존 가비아 DNS 의 모든 레코드는 Cloudflare 가 임포트하므로 정상 운영 중이던 서비스(34.64.136.14 등)는 그대로 유지된다.

1. https://dash.cloudflare.com 가입 (무료 플랜)
2. **Add a site** → `blackmarket.kr` → Free 플랜 선택
3. Cloudflare 가 스캔한 기존 레코드 검토 — 누락된 A/MX/TXT 가 없는지 확인하고 **Continue**
4. Cloudflare 가 발급한 네임서버 2개 메모 (예: `noah.ns.cloudflare.com`, `lana.ns.cloudflare.com`)
5. https://my.gabia.com 로그인 → 서비스 관리 → 도메인 → `blackmarket.kr` → **네임서버 변경** → Cloudflare NS 2개 입력 → 저장
6. 전파 확인: 터미널에서 `dig NS blackmarket.kr` 결과가 Cloudflare NS 로 바뀌면 완료 (보통 10분, 최대 24시간)
7. Cloudflare 대시보드 상단이 **Active** 가 되면 다음 단계 진행

### 2) cloudflared named tunnel

```bash
brew install cloudflared
cloudflared tunnel login                 # 브라우저로 blackmarket.kr 위임 인증
cloudflared tunnel create gh-bridge      # UUID 발급, ~/.cloudflared/<UUID>.json 저장
cloudflared tunnel route dns gh-bridge gh-bridge.blackmarket.kr  # CNAME 자동 생성
```

`~/.cloudflared/config.yml` 작성 (`tools/gh-agent-bridge/cloudflared/config.yml.example` 복사 후 `<TUNNEL_UUID>` 교체):

```yaml
tunnel: gh-bridge
credentials-file: /Users/heesungbae/.cloudflared/<UUID>.json
ingress:
  - hostname: gh-bridge.blackmarket.kr
    service: http://127.0.0.1:7878
  - service: http_status:404
```

검증 후 자동 기동:

```bash
cloudflared tunnel run gh-bridge   # 우선 포어그라운드 동작 확인 (Ctrl+C)
sudo cloudflared service install   # launchd 등록
```

### 3) GitHub App 생성

PAT 대신 GitHub App 사용 (rate-limit 분리, 권한 좁힘).

1. https://github.com/settings/apps/new
2. **GitHub App name**: `heritagedx-gh-agent-bridge`
3. **Homepage URL**: `https://gh-bridge.blackmarket.kr`
4. **Webhook**
   - **Active**: 체크
   - **Webhook URL**: `https://gh-bridge.blackmarket.kr/webhook`
   - **Webhook secret**: 임의 32바이트 hex (`openssl rand -hex 32`) — `.env` 의 `GITHUB_WEBHOOK_SECRET` 와 동일하게
5. **Repository permissions**
   - Issues: Read & write
   - Pull requests: Read & write
   - Contents: Read & write
   - Metadata: Read
6. **Subscribe to events**: Issues, Issue comment, Pull request, Pull request review
7. **Where can this GitHub App be installed?**: Only on this account
8. 생성 후 **Generate a private key** → `app-private-key.pem` 다운로드 → `~/.config/gh-agent-bridge/` 로 이동 + `chmod 600`
9. 같은 페이지 좌측 **Install App** → `heritage-dx` 리포만 선택 → Install
10. 설치 후 URL `/settings/installations/<id>` 의 `<id>` 가 **GITHUB_APP_INSTALLATION_ID**, App settings 의 App ID 가 **GITHUB_APP_ID**

### 4) 데몬 설치 + 가동

```bash
cd tools/gh-agent-bridge
pnpm install --ignore-workspace   # 모노레포 워크스페이스와 분리해 독립 설치
pnpm approve-builds               # better-sqlite3 / esbuild 네이티브 빌드 허용 (인터랙티브)
pnpm rebuild better-sqlite3       # 첫 install 시 ignored 됐다면 한 번 재빌드
cp .env.example .env
# 다음 값을 채운다:
#   GITHUB_APP_ID / GITHUB_APP_INSTALLATION_ID / GITHUB_APP_PRIVATE_KEY_PATH
#   GITHUB_WEBHOOK_SECRET (위에서 생성한 hex)
pnpm dev                       # 우선 개발 모드로 부팅 확인
curl -s http://127.0.0.1:7878/health
```

`launchd` 등록:

```bash
cp launchd/com.heritagedx.ghbridge.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/com.heritagedx.ghbridge.plist
launchctl start com.heritagedx.ghbridge
tail -f ~/Library/Logs/gh-agent-bridge.out.log
```

### 5) Playwright 브라우저 설치 (UI 스크린샷용)

```bash
cd tools/gh-agent-bridge
pnpm exec playwright install chromium
```

### 6) 스모크 테스트

리포에 `agent-sandbox` 등 안전한 라벨로 더미 이슈를 만든다:

```bash
gh issue create --repo HeesungB/heritage-dx \
  --title "[Agent] hello world 확인용" \
  --body "ClubCardV2 의 hover 색을 한 톤 어둡게 바꿔주세요." \
  --label "state:new"
```

30~60초 안에 이슈에 Claude / Codex 플랜 코멘트가 게시되면 M1 까지 정상.

---

## 운영

| 동작 | 명령 |
|---|---|
| 로그 확인 | `tail -f ~/Library/Logs/gh-agent-bridge.*.log` |
| 데몬 재시작 | `launchctl kickstart -k gui/$(id -u)/com.heritagedx.ghbridge` |
| 큐 상태 | `sqlite3 ~/.local/share/gh-agent-bridge/state.db "SELECT * FROM events ORDER BY id DESC LIMIT 20;"` |
| 일일 예산 사용량 | `sqlite3 $DB_PATH "SELECT * FROM budget_usage;"` |
| webhook 재배달 | GitHub App → Advanced → Recent Deliveries → Redeliver |
| 터널 상태 | `cloudflared tunnel info gh-bridge` |
| 데몬 중지 | `launchctl unload ~/Library/LaunchAgents/com.heritagedx.ghbridge.plist` |

### 데몬 다운 시 이벤트 복구

1. `state.db` 의 `events` 테이블에 미처리 항목이 있으면 데몬 재기동 시 자동 resume.
2. webhook 자체가 유실됐다면 GitHub App **Recent Deliveries** → 해당 이벤트 **Redeliver**.

### 비용 통제

`.env` 의 `DAILY_BUDGET_USD` 가 일일 캡 (양 에이전트 합산). 초과 시 데몬이 코멘트로 "예산 초과로 대기" 게시 후 새 작업을 보류한다.

---

## 트러블슈팅

| 증상 | 원인·조치 |
|---|---|
| 코멘트로 슬래시를 써도 무응답 | `.env` 의 `ALLOWED_LOGINS` 에 본인 GitHub login 이 포함됐는지, 첫 줄에 슬래시인지 확인 |
| 401 bad signature | `GITHUB_WEBHOOK_SECRET` 가 GitHub App 의 Webhook secret 과 다름 |
| Cloudflare Active 가 안 됨 | 가비아에서 NS 가 정말로 Cloudflare 로 변경됐는지 `dig +short NS blackmarket.kr` 로 확인. TTL 끝날 때까지 대기 |
| `cloudflared tunnel run` 이 1033 에러 | DNS 라우팅이 아직 안 됨 — `cloudflared tunnel route dns ...` 다시 |
| 스크린샷이 file:// 로만 보임 | 이미지를 외부에 호스팅하도록 `screenshot.ts` 의 `uploadImage` 를 Cloudflare R2 또는 gh release 첨부물로 확장 필요 |
| `pnpm lint` 가 worktree 에서 실패 | 의존성이 worktree 에 없을 수 있음 — worktree 의 첫 실행 전에 `pnpm install` 또는 root 의 `node_modules` 를 심볼릭 링크 |

---

## 참고

- 데몬 코드: `tools/gh-agent-bridge/`
- 워크플로우 트리거: `.github/workflows/agent-route.yml`
- 이슈 템플릿: `.github/ISSUE_TEMPLATE/agent-task.yml`
- PR 템플릿: `.github/PULL_REQUEST_TEMPLATE.md`
