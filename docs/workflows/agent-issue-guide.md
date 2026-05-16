# 🤖 Claude × Codex 협업 워크플로우 — 사용자 가이드

이슈 하나만 잘 적으면 Claude 와 Codex 두 AI 가 **자동으로 계획을 짜고, 토론하고, 코드를 작성해서 PR 까지 만들어 줍니다.** 이 문서는 비기술자도 처음부터 끝까지 따라할 수 있게 한국어로 정리했습니다.

> 운영 / 인프라 / 셋업 절차는 [`github-agent-bridge.md`](./github-agent-bridge.md) 를 보세요.

---

## 한눈에 보기

```
사람: 이슈 등록 (state:new 라벨)
   │
   ▼
🤖 데몬: Claude + Codex 가 동시에 계획 작성 → 댓글 게시
   ├─ 의견 일치  → state:plan-ready
   ├─ 의견 차이  → state:plan-disagree
   └─ 너무 큼   → state:split-proposed
   │
사람: /implement claude  또는  /implement codex
   │
   ▼
🤖 데몬: 코드 작성 → lint/type-check → 커밋·푸시 → PR 자동 생성
   │     UI 가 바뀌면 before/after 스크린샷 자동 첨부
   │
   ▼
🤖 반대편 에이전트: PR 자동 리뷰 코멘트
   │
사람: 추가 질문 (`/claude` `/codex`) → 만족하면 머지
```

---

## 1. 이슈 만들기 — 좋은 계획을 받는 법

### 1-1. 이슈 템플릿을 그대로 쓰세요

GitHub 의 **Issues → New issue → 🤖 Agent task (Claude + Codex)** 를 선택하면 다섯 칸짜리 템플릿이 뜹니다. 빈 칸을 채워서 등록하면 데몬이 자동으로 받아갑니다.

| 필드 | 어떻게 채우나 |
|---|---|
| **무엇을 하고 싶나요?** | 한 줄로 간단히. 기술적인 단어 몰라도 OK. "거래 상세 페이지의 hover 색이 너무 어두워요" 같이. |
| **왜 필요한가요?** | 어떤 상황·맥락에서 필요한지. **계획의 품질을 가장 크게 좌우하는 필드**. |
| **어디에서 일어나나요?** | URL, 화면 이름, 파일 경로 등 어떤 단서라도. 모르면 비워두세요. |
| **완료 기준** | 체크리스트로. 비워두면 에이전트가 추정합니다. |
| **UI 가 바뀌나요?** | "예" 면 PR 에 before/after 스크린샷 자동 첨부. |

### 1-2. AI 가 무엇을 보는지 알아두세요

이슈를 등록하면 두 AI 에게 다음 자료가 함께 전달됩니다:

| 자료 | 의미 |
|---|---|
| **이슈 본문** (제목 + 본문) | 사용자가 쓴 그대로 |
| **STRUCTURE.md** (최대 12KB) | 레포의 디렉토리·패키지 지도 |
| **CLAUDE.md** (최대 200KB) | 코드 컨벤션·금기·도메인 규칙 |
| **최근 commit 10개** | 최근에 어떤 작업이 있었는지 흐름 |
| **이슈의 이전 댓글** | 토론 맥락 |

즉 `STRUCTURE.md` 와 `CLAUDE.md` 가 최신이고 정확할수록 계획 품질이 좋아집니다. 이슈 본문에 화면 이름이나 URL 같은 힌트를 넣어주면 AI 가 관련 파일을 빠르게 찾습니다.

### 1-3. 좋은 이슈 vs 아쉬운 이슈

✅ **좋은 이슈**
> 무엇: BO 거래 상세 페이지에서 hover 색이 너무 어두워요
> 왜: 야간 사용자에게서 항목이 잘 안 보인다는 피드백을 받았습니다
> 어디: /bo/transactions/123, ClubCardV2 컴포넌트일 가능성
> 완료: hover 시 색이 한 톤 밝아진다, type-check 통과
> UI: 예

⚠️ **아쉬운 이슈**
> 거래 페이지 좀 고쳐주세요

(어디가 / 왜 / 어떻게 되어야 하는지 알 수 없어서 AI 가 추측에 의존 → 계획이 막연해지거나 엉뚱한 방향으로 갈 수 있습니다.)

---

## 2. 계획(plan) 댓글 읽는 법

이슈를 등록하고 30~120초 기다리면 두 AI 가 각자 계획 댓글을 답니다.

각 댓글의 구조:

```
### 🤖 Claude 가 본 작업 요약
> (👈 일반인용 한 줄 요약. 여기만 읽어도 무엇을 하려는지 알 수 있어요)

▼ 📋 기술 세부 (개발자용)         ← 클릭해서 펼칠 수 있습니다
   - 작업 규모: small (작은 변경)
   - 접근 방법: ...
   - 건드릴 파일: path/a.ts, path/b.ts
   - 수행 단계: 1, 2, 3...
   - 위험 요소: ...

(자유 산문 — 좀 더 자세한 설명)

💬 궁금한 점은 댓글에 /claude <질문> 또는 /codex <질문> 으로 물어보세요
```

### 작업 규모(size) 의미

| 값 | 의미 |
|---|---|
| `small` | 한두 파일을 50줄 미만 정도 고치는 작은 변경 |
| `medium` | 한 패키지/앱 안에서 50~300줄 정도, 가벼운 리팩토링 가능 |
| `large` | 300줄 이상, 여러 패키지를 가로지르거나 마이그레이션이 필요한 큰 변경 |

### 두 AI 가 다 작성하면 — 🤝 합의 댓글

세 번째 댓글이 **합의** 결과입니다:

- ✅ **`state:plan-ready`**: 두 AI 가 같은 사이즈로 보고 의견 일치. `/implement claude` 또는 `/implement codex` 로 시작.
- ⚠️ **`state:plan-disagree`**: 사이즈 판단이 다름. 댓글로 결정하거나 `/both` 로 더 물어보세요.
- 🔀 **`state:split-proposed`**: 둘 다 "큰 작업" 으로 봄. `/approve-split` 으로 자동 분해, `/reject-split` 으로 단일 PR 진행.

---

## 3. 추가 질문하기 — 슬래시 커맨드

댓글 첫 줄에 슬래시 명령을 적으면 AI 가 답합니다:

| 명령 | 동작 |
|---|---|
| `/claude <질문>` | Claude 에게만 |
| `/codex <질문>` | Codex 에게만 |
| `/both <질문>` | 두 AI 모두에게 (병렬) |
| `/help` | 슬래시 명령 도움말 게시 |

### 자주 쓰는 질문 예시

```
/both 이 계획에서 빠질 수 있는 엣지 케이스는 뭐가 있을까?
/claude 위험 요소를 좀 더 자세히 설명해 줘
/codex 다른 접근 방법도 있을까?
/both 이 변경이 다른 화면에도 영향을 줄 수 있어?
/claude 비전공자에게 한 줄로 다시 설명해 줘
```

> 💡 첫 줄만 슬래시 명령으로 인식됩니다. 두 번째 줄부터는 자유롭게 적어도 됩니다.

---

## 4. 구현 시작하기

계획을 검토하고 진행할 결정이 섰다면 댓글에:

```
/implement claude
```

또는

```
/implement codex
```

를 적으면 됩니다. 그 뒤로 일어나는 일:

1. 데몬이 별도 작업 디렉토리(`worktree`) 를 만듭니다 — 기존 코드는 안 건드려요
2. 선택된 에이전트가 코드를 작성합니다
3. `lint` 와 `type-check` 가 자동으로 돕니다 (실패하면 한 번 자가 수정)
4. 커밋·푸시 후 **PR 이 자동 생성**됩니다 (`agent:claude` 또는 `agent:codex` 라벨)
5. **반대편 에이전트가 PR 을 자동 리뷰**합니다
6. UI 변경이 있으면 before/after 스크린샷이 PR 코멘트로 첨부됩니다

라벨은 `state:implementing:claude` (또는 `:codex`) → `state:awaiting-review` 로 진행됩니다.

---

## 5. PR 받은 뒤

PR 페이지에서:

- 자동 리뷰 코멘트 (반대편 AI 의 의견) 를 읽어보세요.
- 이해 안 되는 부분은 PR 댓글에 `/claude` 또는 `/codex` 로 물어보세요.
- UI 변경이면 스크린샷을 확인하세요.
- 만족하면 **머지** 버튼을 누르세요.
- 수정이 필요하면 PR 댓글에 그대로 적으면 됩니다 — 데몬이 후속 처리는 아직 자동화되지 않아 사람 손이 필요한 경우도 있습니다.

---

## 6. 작업 분해 — 큰 작업일 때

두 AI 가 모두 "큰 작업" 으로 판단하면 합의 댓글이 분해를 제안합니다.

```
/approve-split
```

→ 데몬이 두 plan 의 `steps` 를 합쳐서 sub-issue 최대 3개를 자동 생성합니다. 각 sub-issue 는 별도 worktree 에서 **병렬로 처리**됩니다.

```
/reject-split
```

→ 분해 없이 단일 PR 로 진행. 그 뒤 `/implement claude|codex` 로 시작.

---

## 7. 한 장 요약 — 자주 쓰는 명령

| 명령 | 언제 |
|---|---|
| `/claude <질문>` | Claude 에게만 질문 |
| `/codex <질문>` | Codex 에게만 질문 |
| `/both <질문>` | 두 AI 동시 질문 |
| `/implement claude` | Claude 가 구현 시작 |
| `/implement codex` | Codex 가 구현 시작 |
| `/approve-split` | 큰 작업 자동 분해 승인 |
| `/reject-split` | 분해 거절, 단일 PR |
| `/help` | 슬래시 도움말 |

---

## 8. 상태 라벨 한 장 요약

| 라벨 | 의미 |
|---|---|
| `state:new` | 데몬이 plan 작업 큐에 잡을 대상 (이슈를 만들 때 자동 부여) |
| `state:planning` | 에이전트들이 plan 작성 중 |
| `state:plan-ready` | 두 plan 완성 + 의견 일치, `/implement` 가능 |
| `state:plan-disagree` | 두 의견 차이, 사용자 결정 대기 |
| `state:split-proposed` | 큰 작업, 분해 결정 대기 |
| `state:implementing:claude` / `:codex` | 구현 중 |
| `state:awaiting-review` | PR 자동 생성, 상호 리뷰 진행 중 |
| `state:reviewed` | 리뷰 완료, 사용자 머지 결정 대기 |
| `agent:claude` / `agent:codex` | 해당 에이전트가 작성·관여한 PR |

---

## 9. 문제가 생기면

| 증상 | 원인·조치 |
|---|---|
| 이슈 등록 후 1~2분 지나도 댓글이 없어요 | 데몬이 안 돌고 있거나 cloudflared 터널이 끊겼을 수 있어요. 운영자에게 확인 요청. |
| plan 댓글에 "파싱 실패" 가 떴어요 | 한쪽 AI 응답이 형식을 벗어났음. 한 번 더 처리하려면 이슈를 close 했다가 reopen 하거나 새 이슈를 만들어 보세요. |
| `/implement` 후 PR 이 안 생겨요 | 데몬 로그에 lint/type-check 실패가 보일 수 있어요. 운영자가 `~/Library/Logs/gh-agent-bridge.{out,err}.log` 를 확인합니다. |
| 비용이 걱정돼요 | `.env` 의 `DAILY_BUDGET_USD` 가 일일 캡. 운영자가 `budget_usage` 테이블로 모니터링합니다. |
| 운영자 가이드는 어디? | [`github-agent-bridge.md`](./github-agent-bridge.md) (Cloudflare / GitHub App / launchd / cloudflared 셋업) |
