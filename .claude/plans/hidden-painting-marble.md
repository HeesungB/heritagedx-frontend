# GCP Cloud Run 사전 준비 — 실행 계획

## Context

`docs/gcp-setup-guide.md`의 사전 준비 단계를 실행하여 GCP 인프라를 세팅한다.
gcloud CLI는 이미 설치/인증 완료 상태.

## 현재 상태

| 항목 | 상태 | 값 |
|------|------|-----|
| GCP Project ID | **완료** | `heritage-dx-frontend` |
| GCP Account | **완료** | `operations@heritagedx.com` |
| Project Number | **확인됨** | `329590487976` |
| Region | **완료** | `asia-northeast3` |
| 필수 API 3개 | **미완료** | 활성화 필요 |
| Artifact Registry | **미완료** | 저장소 생성 필요 |
| Service Account | **미완료** | 생성 + 권한 부여 필요 |
| Workload Identity | **미완료** | Pool + Provider + 바인딩 필요 |
| GitHub Secrets | **미완료** | 5개 시크릿 등록 필요 (git remote 미설정) |

## 실행 단계

### Step 1: 필수 API 활성화
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com
```

### Step 2: Artifact Registry 저장소 생성
```bash
gcloud artifacts repositories create heritage-dx \
  --repository-format=docker \
  --location=asia-northeast3 \
  --description="Heritage DX Docker images"
```

### Step 3: 서비스 계정 생성 + IAM 역할 부여
```bash
# 생성
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"

# 3개 역할 부여
PROJECT_ID=heritage-dx-frontend
SA_EMAIL=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" --role="roles/iam.serviceAccountUser"
```

### Step 4: Workload Identity Federation
```bash
# Pool 생성
gcloud iam workload-identity-pools create github-pool \
  --location="global" --display-name="GitHub Actions Pool"

# Provider 생성
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub OIDC Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"

# 바인딩
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/329590487976/locations/global/workloadIdentityPools/github-pool/attribute.repository/heritagedx/heritage-dx"
```

### Step 5: GitHub Secrets 등록
GitHub 리포: `heritagedx/heritage-dx`. `gh secret set`으로 등록.

GCP 관련 3개는 자동으로 값을 넣고, 네이버 API 2개는 사용자에게 값을 물어서 등록.

| Secret | 값 |
|--------|-----|
| `GCP_PROJECT_ID` | `heritage-dx-frontend` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/329590487976/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `github-actions@heritage-dx-frontend.iam.gserviceaccount.com` |
| `NEXT_PUBLIC_NAVER_CLIENT_ID` | 사용자에게 질문하여 입력 |
| `NAVER_CLIENT_SECRET` | 사용자에게 질문하여 입력 |

### Step 6: deploy.yml 업데이트
가이드의 프로젝트 ID가 `heritage-dx-prod`로 되어있으나 실제는 `heritage-dx-frontend`이므로, deploy.yml에서 시크릿 참조로 이미 올바르게 처리됨 (변경 불필요).

## 검증
각 단계 완료 후 가이드의 검증 명령어로 확인.
