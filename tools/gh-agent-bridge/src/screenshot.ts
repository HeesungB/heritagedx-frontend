import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { config } from './config.ts';
import { logger } from './logger.ts';
import { octokit, repoCoords } from './github.ts';
import { spawnSync } from 'node:child_process';

const RAW_DIR = join(config.WORKTREE_ROOT, '.screenshots');

interface RouteHit {
  app: 'os' | 'back-office';
  route: string;
}

export async function runScreenshotForPr(prNumber: number, files: string[]): Promise<void> {
  const routes = inferRoutes(files);
  if (routes.length === 0) {
    logger.info({ prNumber }, '추론된 UI 라우트 없음 — 스크린샷 건너뜀');
    return;
  }
  mkdirSync(RAW_DIR, { recursive: true });

  const prWorktree = join(config.WORKTREE_ROOT, `pr-${prNumber}`);
  ensurePrWorktree(prNumber, prWorktree);

  try {
    const beforeImgs = await captureWithServer(config.REPO_DIR, routes, 'before', prNumber);
    const afterImgs = await captureWithServer(prWorktree, routes, 'after', prNumber);
    const uploads = await Promise.all([...beforeImgs, ...afterImgs].map(uploadImage));
    const byKey = Object.fromEntries(uploads.map((u) => [u.key, u.url]));

    const table = renderTable(routes, byKey);
    await octokit.issues.createComment({
      ...repoCoords,
      issue_number: prNumber,
      body: table,
    });
  } catch (err) {
    logger.error({ err }, 'screenshot pipeline 실패');
    await octokit.issues.createComment({
      ...repoCoords,
      issue_number: prNumber,
      body: `📸 스크린샷 워커 실패: ${(err as Error).message}`,
    });
  }
}

function inferRoutes(files: string[]): RouteHit[] {
  const hits: RouteHit[] = [];
  for (const f of files) {
    const m = f.match(/^apps\/(os|back-office)\/src\/app\/(.+)\/page\.tsx$/);
    if (!m) continue;
    const app = m[1] as 'os' | 'back-office';
    const segs = m[2].split('/').filter((s) => !s.startsWith('(') && !s.endsWith(')'));
    const route = '/' + segs.map((s) => (s.startsWith('[') ? '1' : s)).join('/');
    hits.push({ app, route });
  }
  // 중복 제거
  return Array.from(new Map(hits.map((h) => [`${h.app}${h.route}`, h])).values()).slice(0, 5);
}

function ensurePrWorktree(prNumber: number, path: string): void {
  // PR 머리 브랜치 fetch + worktree
  spawnSync('git', ['fetch', 'origin', `pull/${prNumber}/head:pr-${prNumber}`], {
    cwd: config.REPO_DIR,
  });
  spawnSync('git', ['worktree', 'add', '--force', path, `pr-${prNumber}`], {
    cwd: config.REPO_DIR,
  });
}

async function captureWithServer(
  appDir: string,
  routes: RouteHit[],
  label: 'before' | 'after',
  prNumber: number,
): Promise<Array<{ key: string; absPath: string }>> {
  const browser = await chromium.launch({ headless: true });
  const results: Array<{ key: string; absPath: string }> = [];
  try {
    const osRoutes = routes.filter((r) => r.app === 'os');
    const boRoutes = routes.filter((r) => r.app === 'back-office');
    if (osRoutes.length > 0) {
      const proc = startDev(appDir, 'os', config.SCREENSHOT_OS_PORT);
      try {
        for (const r of osRoutes) {
          const abs = join(RAW_DIR, `pr${prNumber}-${label}-os-${slugify(r.route)}.png`);
          await capture(browser, `http://localhost:${config.SCREENSHOT_OS_PORT}${r.route}`, abs);
          results.push({ key: `${label}-os-${r.route}`, absPath: abs });
        }
      } finally {
        proc.kill('SIGTERM');
      }
    }
    if (boRoutes.length > 0) {
      const proc = startDev(appDir, 'back-office', config.SCREENSHOT_BO_PORT);
      try {
        for (const r of boRoutes) {
          const abs = join(RAW_DIR, `pr${prNumber}-${label}-bo-${slugify(r.route)}.png`);
          await capture(browser, `http://localhost:${config.SCREENSHOT_BO_PORT}${r.route}`, abs);
          results.push({ key: `${label}-bo-${r.route}`, absPath: abs });
        }
      } finally {
        proc.kill('SIGTERM');
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}

function startDev(appDir: string, app: 'os' | 'back-office', port: number): ReturnType<typeof spawn> {
  const proc = spawn('pnpm', ['--filter', `@heritage-dx/${app}`, 'dev', '--', '-p', String(port)], {
    cwd: appDir,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: 'ignore',
    detached: false,
  });
  return proc;
}

async function capture(browser: Browser, url: string, outPath: string): Promise<void> {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page: Page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: config.SCREENSHOT_TIMEOUT_MS });
    await page.screenshot({ path: outPath, fullPage: true });
  } finally {
    await ctx.close();
  }
}

async function uploadImage(item: { key: string; absPath: string }): Promise<{ key: string; url: string }> {
  // GitHub 의 issue attachment 업로드는 공식 API 가 없으므로 임시로 raw 경로만 반환.
  // 운영에서는 Cloudflare R2 / S3 또는 gh release 첨부물 등 외부 호스팅을 권장.
  // 여기서는 file:// 링크로 임시 표기.
  return { key: item.key, url: `file://${item.absPath}` };
}

function renderTable(routes: RouteHit[], byKey: Record<string, string>): string {
  const head = '| Route | Before (main) | After (PR) |\n|---|---|---|';
  const rows = routes
    .map((r) => {
      const beforeKey = `before-${r.app === 'os' ? 'os' : 'bo'}-${r.route}`;
      const afterKey = `after-${r.app === 'os' ? 'os' : 'bo'}-${r.route}`;
      return `| \`${r.app}${r.route}\` | ![](${byKey[beforeKey] ?? '—'}) | ![](${byKey[afterKey] ?? '—'}) |`;
    })
    .join('\n');
  return `### 📸 UI 변경 미리보기\n\n${head}\n${rows}\n\n_이미지가 file:// 로 보이면 외부 호스팅(R2/S3) 설정이 필요합니다 — README 참고._`;
}

function slugify(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'root';
}
