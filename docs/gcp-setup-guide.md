# GCP Cloud Run 배포 사전 준비 가이드

Heritage DX 모노레포를 GCP Cloud Run에 배포하기 위한 사전 설정 가이드.
GitHub Actions에서 키 파일 없이 안전하게 GCP에 인증하는 **Workload Identity Federation** 방식을 사용한다.

---

## 목차

1. [GCP 프로젝트 생성](#1-gcp-프로젝트-생성)
2. [gcloud CLI 설치 및 초기화](#2-gcloud-cli-설치-및-초기화)
3. [필수 API 활성화](#3-필수-api-활성화)
4. [Artifact Registry 저장소 생성](#4-artifact-registry-저장소-생성)
5. [서비스 계정 생성 및 권한 부여](#5-서비스-계정-생성-및-권한-부여)
6. [Workload Identity Federation 설정](#6-workload-identity-federation-설정)
7. [GitHub Repository Secrets 등록](#7-github-repository-secrets-등록)
8. [설정 검증](#8-설정-검증)

---

## 1. GCP 프로젝트 생성

### Google Cloud Console에서 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 상단 프로젝트 선택 드롭다운 클릭 → **새 프로젝트**
3. 프로젝트 정보 입력:
   - **프로젝트 이름**: `Heritage DX` (자유롭게 설정)
   - **프로젝트 ID**: `heritage-dx-prod` (전역 고유, 변경 불가)
   - **결제 계정**: 결제 계정 선택 (없으면 먼저 생성)
4. **만들기** 클릭

### 또는 gcloud CLI로 생성

```bash
gcloud projects create heritage-dx-prod --name="Heritage DX"
```

### 결제 계정 연결

결제 계정이 연결되어 있지 않으면 Cloud Run을 사용할 수 없다.

1. [결제 페이지](https://console.cloud.google.com/billing) 접속
2. 결제 계정이 없으면 **계정 만들기**로 생성
3. 프로젝트에 결제 계정 연결:
   ```bash
   # 결제 계정 목록 확인
   gcloud billing accounts list

   # 프로젝트에 결제 계정 연결
   gcloud billing projects link heritage-dx-prod \
     --billing-account=XXXXXX-XXXXXX-XXXXXX
   ```

> 이후 모든 명령어에서 `heritage-dx-prod`를 본인의 프로젝트 ID로 대체한다.

---

## 2. gcloud CLI 설치 및 초기화

### 설치

```bash
# macOS (Homebrew)
brew install google-cloud-sdk

# 또는 공식 설치 스크립트
curl https://sdk.cloud.google.com | bash
```

설치 후 새 터미널을 열거나 `source ~/.zshrc` 실행.

### 초기화

```bash
# 로그인
gcloud auth login

# 프로젝트 설정
gcloud config set project heritage-dx-prod

# 리전 기본값 설정 (서울)
gcloud config set run/region asia-northeast3

# 설정 확인
gcloud config list
```

출력 예시:
```
[core]
project = heritage-dx-prod

[run]
region = asia-northeast3
```

---

## 3. 필수 API 활성화

Cloud Run 배포에 필요한 3개 API를 활성화한다.

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com
```

| API | 용도 |
|-----|------|
| `run.googleapis.com` | Cloud Run 서비스 배포/관리 |
| `artifactregistry.googleapis.com` | Docker 이미지 저장소 |
| `iamcredentials.googleapis.com` | Workload Identity Federation 토큰 발급 |

활성화 확인:
```bash
gcloud services list --enabled --filter="NAME:(run OR artifactregistry OR iamcredentials)"
```

3개 모두 출력되면 정상.

---

## 4. Artifact Registry 저장소 생성

Docker 이미지를 저장할 저장소를 생성한다.

```bash
gcloud artifacts repositories create heritage-dx \
  --repository-format=docker \
  --location=asia-northeast3 \
  --description="Heritage DX Docker images"
```

생성 확인:
```bash
gcloud artifacts repositories describe heritage-dx \
  --location=asia-northeast3
```

출력 예시:
```
Encryption: Google-managed key
Repository Size: 0.000MB
createTime: '2026-03-01T...'
format: DOCKER
mode: STANDARD_REPOSITORY
name: projects/heritage-dx-prod/locations/asia-northeast3/repositories/heritage-dx
```

> 이미지 경로 형식: `asia-northeast3-docker.pkg.dev/heritage-dx-prod/heritage-dx/os:latest`

---

## 5. 서비스 계정 생성 및 권한 부여

GitHub Actions가 GCP 리소스에 접근할 때 사용할 서비스 계정을 만든다.

### 5.1 서비스 계정 생성

```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"
```

생성 확인:
```bash
gcloud iam service-accounts list --filter="email:github-actions"
```

출력:
```
EMAIL                                                    DISABLED
github-actions@heritage-dx-prod.iam.gserviceaccount.com  False
```

### 5.2 IAM 역할 부여

서비스 계정에 3개의 역할을 부여한다.

```bash
PROJECT_ID=heritage-dx-prod
SA_EMAIL=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

# 1) Cloud Run 관리자 — 서비스 배포/업데이트
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

# 2) Artifact Registry 쓰기 — Docker 이미지 push
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# 3) 서비스 계정 사용자 — Cloud Run이 서비스 계정을 사용할 수 있도록
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"
```

| 역할 | 설명 |
|------|------|
| `roles/run.admin` | Cloud Run 서비스 생성, 업데이트, 삭제 |
| `roles/artifactregistry.writer` | Artifact Registry에 Docker 이미지 push |
| `roles/iam.serviceAccountUser` | Cloud Run 서비스에 서비스 계정 연결 |

권한 확인:
```bash
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SA_EMAIL}" \
  --format="table(bindings.role)"
```

출력:
```
ROLE
roles/artifactregistry.writer
roles/iam.serviceAccountUser
roles/run.admin
```

---

## 6. Workload Identity Federation 설정

GitHub Actions에서 GCP 서비스 계정 키 파일(JSON) 없이 인증하는 방식.
GitHub OIDC 토큰 → GCP 임시 토큰으로 교환하는 구조.

```
GitHub Actions Runner
  ↓ OIDC 토큰 발급 (GitHub이 서명)
Workload Identity Pool (GCP)
  ↓ 토큰 검증 + 매핑
Workload Identity Provider (GitHub OIDC 검증)
  ↓ 임시 GCP 토큰 발급
Service Account (github-actions@...)
  ↓ 권한으로 리소스 접근
Cloud Run / Artifact Registry
```

### 6.1 Workload Identity Pool 생성

```bash
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

### 6.2 OIDC Provider 생성

```bash
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub OIDC Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"
```

| 파라미터 | 설명 |
|----------|------|
| `--issuer-uri` | GitHub OIDC 토큰 발급자 URL (고정값) |
| `--attribute-mapping` | GitHub 토큰의 claim을 GCP 속성으로 매핑 |
| `google.subject=assertion.sub` | GitHub 토큰의 subject를 GCP subject로 매핑 |
| `attribute.repository=assertion.repository` | GitHub 리포 이름을 커스텀 속성으로 매핑 |

### 6.3 서비스 계정에 Workload Identity 바인딩

특정 GitHub 리포지토리에서만 서비스 계정을 사용할 수 있도록 제한한다.

```bash
PROJECT_ID=heritage-dx-prod
SA_EMAIL=github-actions@${PROJECT_ID}.iam.gserviceaccount.com
GITHUB_OWNER=your-github-username    # GitHub 사용자명 또는 조직명
GITHUB_REPO=heritage-dx              # GitHub 리포지토리명

# 프로젝트 번호 조회 (Workload Identity 경로에 필요)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"

# 바인딩
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${GITHUB_OWNER}/${GITHUB_REPO}"
```

> `GITHUB_OWNER`와 `GITHUB_REPO`를 실제 값으로 반드시 변경할 것.
> 예: `your-github-username/heritage-dx` → `heesungbae/heritage-dx`

### 6.4 Workload Identity Provider 전체 경로 확인

GitHub Secrets에 등록할 Provider 경로를 확인한다.

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

echo "Workload Identity Provider:"
echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
```

이 값을 메모해둔다. 다음 단계에서 GitHub Secret으로 등록한다.

---

## 7. GitHub Repository Secrets 등록

GitHub Actions 워크플로우에서 사용할 시크릿을 등록한다.

### GitHub 웹 UI에서 등록

1. GitHub 리포지토리 페이지 → **Settings** 탭
2. 좌측 메뉴 **Secrets and variables** → **Actions**
3. **New repository secret** 클릭하여 아래 5개 등록

### 또는 GitHub CLI로 등록

```bash
# GitHub CLI 설치 (이미 설치되어 있으면 생략)
brew install gh
gh auth login

# 시크릿 등록
gh secret set GCP_PROJECT_ID --body "heritage-dx-prod"

gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER \
  --body "projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider"

gh secret set GCP_SERVICE_ACCOUNT \
  --body "github-actions@heritage-dx-prod.iam.gserviceaccount.com"

gh secret set NEXT_PUBLIC_NAVER_CLIENT_ID --body "your-naver-client-id"

gh secret set NAVER_CLIENT_SECRET --body "your-naver-client-secret"
```

### 시크릿 목록

| Secret 이름 | 값 | 확인 방법 |
|-------------|-----|----------|
| `GCP_PROJECT_ID` | GCP 프로젝트 ID (예: `heritage-dx-prod`) | `gcloud config get-value project` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Provider 전체 경로 | [6.4단계](#64-workload-identity-provider-전체-경로-확인)에서 확인 |
| `GCP_SERVICE_ACCOUNT` | 서비스 계정 이메일 | `gcloud iam service-accounts list --filter="email:github-actions"` |
| `NEXT_PUBLIC_NAVER_CLIENT_ID` | 네이버 클라우드 플랫폼 클라이언트 ID | [네이버 클라우드 콘솔](https://console.ncloud.com/) |
| `NAVER_CLIENT_SECRET` | 네이버 클라우드 플랫폼 클라이언트 시크릿 | [네이버 클라우드 콘솔](https://console.ncloud.com/) |

등록 확인:
```bash
gh secret list
```

출력:
```
GCP_PROJECT_ID                    Updated 2026-03-01
GCP_SERVICE_ACCOUNT               Updated 2026-03-01
GCP_WORKLOAD_IDENTITY_PROVIDER    Updated 2026-03-01
NAVER_CLIENT_SECRET               Updated 2026-03-01
NEXT_PUBLIC_NAVER_CLIENT_ID       Updated 2026-03-01
```

---

## 8. 설정 검증

모든 설정이 올바른지 확인하는 체크리스트.

### 8.1 GCP 리소스 확인

```bash
PROJECT_ID=heritage-dx-prod

# 프로젝트 확인
gcloud projects describe $PROJECT_ID --format="value(projectId, lifecycleState)"

# API 활성화 확인
gcloud services list --enabled --filter="NAME:(run OR artifactregistry OR iamcredentials)" --format="value(NAME)"

# Artifact Registry 저장소 확인
gcloud artifacts repositories list --location=asia-northeast3 --format="value(REPOSITORY)"

# 서비스 계정 확인
gcloud iam service-accounts list --filter="email:github-actions" --format="value(EMAIL)"

# 서비스 계정 IAM 역할 확인
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --format="value(bindings.role)"

# Workload Identity Pool 확인
gcloud iam workload-identity-pools list --location=global --format="value(NAME)"

# Workload Identity Provider 확인
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool=github-pool \
  --location=global \
  --format="value(NAME)"
```

### 8.2 한번에 확인하는 스크립트

```bash
#!/bin/bash
PROJECT_ID=heritage-dx-prod
SA_EMAIL=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

echo "=== 1. Project ==="
gcloud projects describe $PROJECT_ID --format="value(projectId)" 2>/dev/null && echo "OK" || echo "FAIL"

echo ""
echo "=== 2. APIs ==="
for api in run.googleapis.com artifactregistry.googleapis.com iamcredentials.googleapis.com; do
  gcloud services list --enabled --filter="NAME:${api}" --format="value(NAME)" 2>/dev/null | grep -q "$api" && echo "$api: OK" || echo "$api: FAIL"
done

echo ""
echo "=== 3. Artifact Registry ==="
gcloud artifacts repositories describe heritage-dx --location=asia-northeast3 --format="value(name)" 2>/dev/null && echo "OK" || echo "FAIL"

echo ""
echo "=== 4. Service Account ==="
gcloud iam service-accounts describe $SA_EMAIL --format="value(email)" 2>/dev/null && echo "OK" || echo "FAIL"

echo ""
echo "=== 5. IAM Roles ==="
ROLES=$(gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SA_EMAIL}" \
  --format="value(bindings.role)" 2>/dev/null)
for role in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  echo "$ROLES" | grep -q "$role" && echo "$role: OK" || echo "$role: FAIL"
done

echo ""
echo "=== 6. Workload Identity ==="
gcloud iam workload-identity-pools describe github-pool --location=global --format="value(name)" 2>/dev/null && echo "Pool: OK" || echo "Pool: FAIL"
gcloud iam workload-identity-pools providers describe github-provider --workload-identity-pool=github-pool --location=global --format="value(name)" 2>/dev/null && echo "Provider: OK" || echo "Provider: FAIL"

echo ""
echo "=== 7. Provider Full Path (for GitHub Secret) ==="
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
```

### 8.3 최종 배포 테스트

모든 설정이 완료되면 `main` 브랜치에 push하여 GitHub Actions 워크플로우가 정상 동작하는지 확인한다.

```bash
git add .
git commit -m "chore: add GCP Cloud Run deployment"
git push origin main
```

1. GitHub 리포지토리 → **Actions** 탭에서 워크플로우 실행 확인
2. `Deploy OS` / `Deploy Back Office` 두 job이 모두 성공하는지 확인
3. [Cloud Run 콘솔](https://console.cloud.google.com/run)에서 서비스 URL 확인 후 접속

---

## 트러블슈팅

### "Permission denied" 에러

서비스 계정 권한이 누락된 경우. [5.2 IAM 역할 부여](#52-iam-역할-부여) 재확인.

### "Workload Identity Pool does not exist" 에러

Pool이나 Provider 생성이 안 된 경우. [6단계](#6-workload-identity-federation-설정) 재확인.

### "Unable to retrieve access token" 에러

GitHub Secret의 `GCP_WORKLOAD_IDENTITY_PROVIDER` 값이 잘못된 경우가 대부분.
`projects/{PROJECT_NUMBER}/...` 형식인지, **Project Number** (숫자)를 사용했는지 확인.
Project ID (문자열)와 Project Number (숫자)를 혼동하지 않도록 주의.

```bash
# Project Number 확인
gcloud projects describe heritage-dx-prod --format="value(projectNumber)"
```

### "Repository not found" 에러 (Artifact Registry)

리전이 일치하는지 확인. 저장소는 `asia-northeast3`에 생성, 워크플로우도 같은 리전 사용.

### GitHub Actions에서 "Resource not found" (Workload Identity)

서비스 계정 바인딩의 `GITHUB_OWNER/GITHUB_REPO` 값이 실제 리포지토리와 일치하는지 확인.
대소문자가 정확히 일치해야 한다.
