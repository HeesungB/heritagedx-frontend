#!/usr/bin/env node

/**
 * 골프장 주소 배치 Geocoding 스크립트
 *
 * 골프장_정보.md에서 주소를 추출하고 네이버 Geocoding API로 좌표를 조회하여
 * src/constants/golfCourseCoordinates.json에 저장합니다.
 *
 * 사용법: node scripts/geocode-courses.mjs
 *
 * 환경변수 (.env.local에서 자동 로드):
 *   NEXT_PUBLIC_NAVER_CLIENT_ID - 네이버 클라우드 API Key ID
 *   NAVER_CLIENT_SECRET - 네이버 클라우드 API Secret
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const MD_PATH = resolve(ROOT, "골프장_정보.md");
const OUTPUT_PATH = resolve(ROOT, "src/constants/golfCourseCoordinates.json");

// .env.local 파일에서 환경변수 로드
function loadEnv() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("ERROR: NEXT_PUBLIC_NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.");
  console.error(".env.local 파일을 확인해 주세요.");
  process.exit(1);
}

// ── Step 1: 마크다운에서 주소 추출 ──

function extractAddresses() {
  const md = readFileSync(MD_PATH, "utf-8");
  const lines = md.split("\n");

  const addresses = new Set();

  for (const line of lines) {
    // 마크다운 테이블 행: | 골프장명 | 홀수 | 주소 | 회원제/퍼블릭 |
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || trimmed.startsWith("|--") || trimmed.startsWith("| 골프장명")) {
      continue;
    }

    const cols = trimmed.split("|").map((c) => c.trim()).filter(Boolean);
    if (cols.length < 3) continue;

    const address = cols[2]; // 3번째 컬럼이 주소
    if (!address || address === "주소") continue;

    addresses.add(address);
  }

  return [...addresses];
}

// ── Step 2: 네이버 Geocoding API 호출 ──

const GEOCODE_URL = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode";
const DELAY_MS = 200; // 요청 간 딜레이 (초당 5건)
const SAVE_INTERVAL = 50; // N건마다 중간 저장

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocodeAddress(address) {
  const url = `${GEOCODE_URL}?query=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: {
      "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
      "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!data.addresses || data.addresses.length === 0) {
    return null;
  }

  const { x, y } = data.addresses[0];
  return { lat: parseFloat(y), lng: parseFloat(x) };
}

// ── Step 3: 배치 실행 ──

function loadExisting() {
  if (existsSync(OUTPUT_PATH)) {
    try {
      return JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveResults(results) {
  // 키 정렬하여 저장
  const sorted = {};
  for (const key of Object.keys(results).sort()) {
    sorted[key] = results[key];
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf-8");
}

async function main() {
  console.log("=== 골프장 좌표 배치 Geocoding ===\n");

  // 주소 추출
  const allAddresses = extractAddresses();
  console.log(`골프장_정보.md에서 ${allAddresses.length}개 고유 주소 추출\n`);

  // 기존 결과 로드 (증분 처리)
  const results = loadExisting();
  const existingCount = Object.keys(results).length;
  if (existingCount > 0) {
    console.log(`기존 좌표 데이터 ${existingCount}건 로드 (스킵 대상)\n`);
  }

  // 아직 처리되지 않은 주소 필터링
  const pending = allAddresses.filter((addr) => !(addr in results));
  console.log(`처리 대상: ${pending.length}건 (전체 ${allAddresses.length} - 기존 ${existingCount})\n`);

  if (pending.length === 0) {
    console.log("모든 주소가 이미 처리되었습니다.");
    printSummary(results, allAddresses);
    return;
  }

  let success = 0;
  let failed = 0;
  const failedAddresses = [];

  for (let i = 0; i < pending.length; i++) {
    const address = pending[i];
    const progress = `[${i + 1}/${pending.length}]`;

    try {
      const coords = await geocodeAddress(address);
      results[address] = coords;

      if (coords) {
        console.log(`${progress} OK: ${address} → ${coords.lat}, ${coords.lng}`);
        success++;
      } else {
        console.log(`${progress} NOT FOUND: ${address}`);
        failed++;
        failedAddresses.push(address);
      }
    } catch (err) {
      console.error(`${progress} ERROR: ${address} → ${err.message}`);
      results[address] = null;
      failed++;
      failedAddresses.push(address);
    }

    // 중간 저장
    if ((i + 1) % SAVE_INTERVAL === 0) {
      saveResults(results);
      console.log(`  → ${i + 1}건 처리 완료, 중간 저장\n`);
    }

    // Rate limiting
    if (i < pending.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // 최종 저장
  saveResults(results);

  console.log("\n=== 완료 ===");
  console.log(`이번 실행: 성공 ${success}건, 실패 ${failed}건`);

  if (failedAddresses.length > 0) {
    console.log("\n실패 주소 목록:");
    for (const addr of failedAddresses) {
      console.log(`  - ${addr}`);
    }
  }

  printSummary(results, allAddresses);
}

function printSummary(results, allAddresses) {
  const total = Object.keys(results).length;
  const withCoords = Object.values(results).filter((v) => v !== null).length;
  const nullCoords = total - withCoords;

  console.log(`\n=== 최종 요약 ===`);
  console.log(`전체 고유 주소: ${allAddresses.length}건`);
  console.log(`좌표 파일 엔트리: ${total}건`);
  console.log(`좌표 있음: ${withCoords}건`);
  console.log(`좌표 없음 (null): ${nullCoords}건`);
  console.log(`\n출력 파일: ${OUTPUT_PATH}`);

  // 좌표 범위 검증
  const coords = Object.values(results).filter((v) => v !== null);
  if (coords.length > 0) {
    const lats = coords.map((c) => c.lat);
    const lngs = coords.map((c) => c.lng);
    console.log(`\n좌표 범위 검증 (대한민국: 위도 33~38, 경도 125~132)`);
    console.log(`  위도: ${Math.min(...lats).toFixed(4)} ~ ${Math.max(...lats).toFixed(4)}`);
    console.log(`  경도: ${Math.min(...lngs).toFixed(4)} ~ ${Math.max(...lngs).toFixed(4)}`);

    const outOfRange = coords.filter(
      (c) => c.lat < 33 || c.lat > 38 || c.lng < 125 || c.lng > 132
    );
    if (outOfRange.length > 0) {
      console.log(`  ⚠ 범위 밖 좌표: ${outOfRange.length}건`);
    } else {
      console.log(`  ✓ 모든 좌표가 대한민국 범위 내`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
