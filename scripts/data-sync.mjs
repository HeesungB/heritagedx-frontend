#!/usr/bin/env node

/**
 * Heritage DX — Data Sync CLI
 *
 * API 응답을 로컬에 동기화하는 스크립트.
 *
 * Usage:
 *   node scripts/data-sync.mjs all          # 4가지 모두 실행
 *   node scripts/data-sync.mjs fetch        # API → JSON
 *   node scripts/data-sync.mjs validate     # 타입 검증
 *   node scripts/data-sync.mjs warm         # ISR 캐시 워밍
 *   node scripts/data-sync.mjs seed         # Entity 시드 생성
 *
 * Options:
 *   --resume          club-details 중단 재개
 *   --delay=200       요청 간 딜레이 (ms)
 *   --concurrency=3   ISR 워밍 동시 요청 수
 *   --verbose         상세 로그
 *
 * Env:
 *   SYNC_EMAIL        관리자 이메일
 *   SYNC_PASSWORD     비밀번호
 *   SYNC_API_BASE     API 베이스 URL (기본: https://api.heritage-dx.com)
 *   SYNC_OS_BASE      OS 사이트 URL (ISR 워밍용)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(__dirname, "data");
const RAW_DIR = resolve(DATA_DIR, "raw");
const ENTITIES_DIR = resolve(DATA_DIR, "entities");

// ────────────────────────────────────────
// .env.local 로드
// ────────────────────────────────────────

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = resolve(ROOT, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv();

// ────────────────────────────────────────
// CLI 파싱
// ────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.find((a) => !a.startsWith("--")) ?? "all";
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.slice(2).split("=");
      return [k, v ?? "true"];
    }),
);

const CONFIG = {
  apiBase: process.env.SYNC_API_BASE ?? "https://api.heritage-dx.com",
  osBase: process.env.SYNC_OS_BASE ?? "",
  email: process.env.SYNC_EMAIL ?? "",
  password: process.env.SYNC_PASSWORD ?? "",
  resume: "resume" in flags,
  delay: Number(flags.delay) || 200,
  concurrency: Number(flags.concurrency) || 3,
  verbose: "verbose" in flags,
};

// ────────────────────────────────────────
// 유틸리티
// ────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function progress(current, total, label) {
  const pct = ((current / total) * 100).toFixed(1);
  process.stdout.write(`\r  [${current}/${total}] ${pct}% ${label}`);
  if (current === total) process.stdout.write("\n");
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeJSON(filePath, data) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function readJSON(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function log(msg) {
  console.log(msg);
}

function verbose(msg) {
  if (CONFIG.verbose) console.log(`  [verbose] ${msg}`);
}

// ────────────────────────────────────────
// 인증 (Cookie 캡처)
// ────────────────────────────────────────

let authCookie = "";
let authTimestamp = 0;

async function authenticate() {
  if (!CONFIG.email || !CONFIG.password) {
    throw new Error("SYNC_EMAIL / SYNC_PASSWORD 환경변수를 설정하세요.");
  }

  log("인증 중...");
  const res = await fetch(`${CONFIG.apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: CONFIG.email, password: CONFIG.password }),
    redirect: "manual",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`로그인 실패 (${res.status}): ${text}`);
  }

  // Set-Cookie 헤더 캡처
  const cookies = res.headers.getSetCookie?.() ?? [];
  if (cookies.length === 0) {
    // Fallback: raw 헤더에서 파싱
    const raw = res.headers.get("set-cookie");
    if (raw) cookies.push(...raw.split(/,(?=\s*\w+=)/));
  }

  authCookie = cookies.map((c) => c.split(";")[0]).join("; ");
  authTimestamp = Date.now();

  if (!authCookie) {
    throw new Error("로그인 응답에 Set-Cookie 헤더가 없습니다.");
  }

  log("인증 성공");
  verbose(`Cookie: ${authCookie.slice(0, 60)}...`);
}

async function ensureFreshAuth() {
  const elapsed = Date.now() - authTimestamp;
  if (elapsed > 12 * 60 * 1000) {
    verbose("토큰 갱신 중...");
    const res = await fetch(`${CONFIG.apiBase}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: authCookie },
    });

    if (!res.ok) {
      log("토큰 갱신 실패, 재로그인...");
      await authenticate();
      return;
    }

    const cookies = res.headers.getSetCookie?.() ?? [];
    if (cookies.length > 0) {
      authCookie = cookies.map((c) => c.split(";")[0]).join("; ");
    }
    authTimestamp = Date.now();
    verbose("토큰 갱신 완료");
  }
}

function authHeaders() {
  return { Cookie: authCookie };
}

// ────────────────────────────────────────
// API 요청
// ────────────────────────────────────────

async function fetchJSON(endpoint) {
  await ensureFreshAuth();
  const url = `${CONFIG.apiBase}${endpoint}`;
  verbose(`GET ${url}`);

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });

  if (!res.ok) {
    throw new Error(`API 오류 ${res.status}: ${endpoint}`);
  }

  const json = await res.json();

  // API 응답 정규화: { success, data } 구조 처리
  if (json.success !== undefined && json.data !== undefined) {
    if (json.meta) return { ...json.data, meta: json.meta };
    return json.data;
  }
  return json;
}

async function fetchAllPages(endpoint, listKey, limit = 100) {
  let allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const data = await fetchJSON(`${endpoint}${sep}page=${page}&limit=${limit}`);
    const items = data[listKey] ?? [];
    allItems = [...allItems, ...items];

    const pagination = data.pagination;
    if (!pagination) break;

    // clubs: hasNext 기반 / trades: currentPage < totalPages 기반
    if ("hasNext" in pagination) {
      hasMore = pagination.hasNext;
    } else if ("currentPage" in pagination) {
      hasMore = pagination.currentPage < pagination.totalPages;
    } else {
      hasMore = false;
    }

    page++;
    if (hasMore) await sleep(CONFIG.delay);
  }

  return allItems;
}

// ────────────────────────────────────────
// Mapper 함수 (JS 포팅)
// ────────────────────────────────────────

// --- helpers ---

function coerceToNumber(val) {
  if (val == null) return null;
  if (typeof val === "number") return val;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

function normalizeGreenFee(val) {
  if (val == null) return {};
  if (typeof val === "number") return { "기본": val };
  return val;
}

// --- document mappers ---

function mapDocumentDtoToEntity(dto) {
  return {
    id: dto.id ?? "",
    clubDocumentId: dto.clubDocumentId ?? null,
    docCode: dto.docCode ?? null,
    name: dto.name ?? dto.cleanName ?? "",
    fileName: dto.fileName ?? null,
    fileDescription: dto.fileDescription ?? null,
    minCount: dto.minCount ?? 1,
    unit: dto.unit ?? "부",
    isMandatory: dto.isMandatory ?? dto.required ?? false,
    notes: Array.isArray(dto.notes) ? dto.notes.join(", ") : (dto.notes ?? ""),
    displayOrder: dto.displayOrder ?? 0,
    condition: dto.condition ?? null,
    clubRequirement: dto.clubRequirement ?? null,
    downloadUrl: dto.downloadUrl ?? null,
    downloadUrlExpiresAt: dto.downloadUrlExpiresAt ?? null,
  };
}

function mapGlobalDocumentDtoToEntity(dto) {
  return {
    id: dto.id,
    name: dto.name,
    fileName: dto.fileName ?? null,
    fileDescription: dto.fileDescription ?? null,
    downloadUrl: dto.downloadUrl ?? null,
    downloadUrlExpiresAt: dto.downloadUrlExpiresAt ?? null,
  };
}

function mapCustomerDocumentDtoToEntity(dto) {
  return {
    id: dto.id,
    clubId: dto.clubId ?? null,
    name: dto.name,
    description: dto.description ?? null,
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
  };
}

function mapMembershipDocumentDtoToEntity(dto) {
  return {
    id: dto.id,
    membershipId: dto.membershipId,
    name: dto.name,
    fileName: dto.fileName,
    fileDescription: dto.fileDescription,
    downloadUrl: dto.downloadUrl,
    downloadUrlExpiresAt: dto.downloadUrlExpiresAt,
  };
}

function mapDocumentsSummaryDtoToEntity(dto) {
  return {
    totalDocuments: dto.totalDocuments,
    mandatoryDocuments: dto.mandatoryDocuments,
    optionalDocuments: dto.optionalDocuments,
  };
}

// --- membership mapper ---

function mapMembershipDtoToEntity(dto) {
  return {
    id: dto.id,
    clubId: dto.clubId,
    membershipType: dto.membershipType,
    membershipName: dto.membershipName ?? null,
    weekdayGreenFee: dto.weekdayGreenFee ?? {},
    weekendGreenFee: dto.weekendGreenFee ?? {},
    caddyFee: dto.caddyFee ?? null,
    cartFee: dto.cartFee ?? null,
    reservationNotes: dto.reservationNotes ?? null,
    weekendReservationDifficulty: coerceToNumber(dto.weekendReservationDifficulty),
    memberDaySchedule: dto.memberDaySchedule ?? null,
    recentMarketPrice: dto.recentMarketPrice ?? null,
    recentPriceUpdateDate: dto.recentPriceUpdateDate ?? null,
    avgMarketPrice3y: dto.avgMarketPrice3y ?? null,
    dealerPriceRange: dto.dealerPriceRange ?? null,
    minTransactionUnit: dto.minTransactionUnit ?? null,
    transactionTendency: dto.transactionTendency ?? null,
    recentTransactionType: dto.recentTransactionType ?? null,
    tradableTypeSummary: dto.tradableTypeSummary ?? null,
    registrationDifficulty: dto.registrationDifficulty ?? null,
    additionalDocumentFrequency: dto.additionalDocumentFrequency ?? null,
    balanceRisk: dto.balanceRisk ?? null,
    transactionRiskMemo: dto.transactionRiskMemo ?? null,
    hasAssociateMember: dto.hasAssociateMember ?? false,
    associateMemberCondition: dto.associateMemberCondition ?? null,
    associateMemberWeekdayFee: dto.associateMemberWeekdayFee ?? null,
    associateMemberWeekendFee: dto.associateMemberWeekendFee ?? null,
    hasFamilyMember: dto.hasFamilyMember ?? false,
    familyMemberCondition: dto.familyMemberCondition ?? null,
    familyMemberWeekdayFee: dto.familyMemberWeekdayFee ?? null,
    familyMemberWeekendFee: dto.familyMemberWeekendFee ?? null,
    registeredPersonCount: dto.registeredPersonCount ?? null,
    canDelegate: dto.canDelegate ?? false,
    delegationWeekdayRule: dto.delegationWeekdayRule ?? null,
    delegationWeekendRule: dto.delegationWeekendRule ?? null,
    delegationRestriction: dto.delegationRestriction ?? null,
    initialSalePrice: dto.initialSalePrice ?? null,
    initialSaleYear: dto.initialSaleYear ?? null,
    initialSaleMethod: dto.initialSaleMethod ?? null,
    estimatedSalePrice: dto.estimatedSalePrice ?? null,
    estimatedPriceDate: dto.estimatedPriceDate ?? null,
    admissionAge: dto.admissionAge ?? null,
    memberBenefits: dto.memberBenefits ?? null,
    specialNotes: dto.specialNotes ?? null,
    transferManagerName: dto.transferManagerName ?? null,
    transferManagerPhone: dto.transferManagerPhone ?? null,
    buyerDocuments: dto.buyerDocuments ?? null,
    sellerDocuments: dto.sellerDocuments ?? null,
    isActive: dto.isActive,
    displayOrder: dto.displayOrder,
    documents: (dto.documents ?? []).map(mapMembershipDocumentDtoToEntity),
  };
}

// --- scenario mapper ---

function mapScenarioWithDocsDtoToEntity(dto) {
  return {
    scenario: {
      scenarioCode: dto.scenario.scenarioCode,
      name: dto.scenario.name,
      description: dto.scenario.description ?? null,
    },
    documentsLocal: dto.documentsLocal.map(mapDocumentDtoToEntity),
    summary: mapDocumentsSummaryDtoToEntity(dto.summary),
  };
}

// --- club mappers ---

function mapClubDtoToEntity(dto) {
  return {
    code: dto.code,
    name: dto.name,
    region: dto.region ?? "",
    contact: dto.contact ?? "",
    holes: dto.holes ?? undefined,
    operationTypes: dto.operationTypes ?? [],
  };
}

function mapClubDetailDtoToEntity(dto) {
  const contacts = (dto.contacts ?? []).map((c) => ({
    id: c.id,
    phoneNumber: c.phoneNumber ?? null,
    fax: c.fax ?? null,
    email: c.email ?? null,
    contactPerson: c.contactPerson ?? null,
    department: c.department ?? null,
    isPrimary: c.isPrimary ?? false,
  }));

  const bankAccounts = (dto.bankAccounts ?? []).map((b) => ({
    id: b.id,
    bankName: b.bankName ?? null,
    accountNumber: b.accountNumber ?? null,
    accountHolder: b.accountHolder ?? null,
  }));

  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    companyName: dto.companyName ?? null,
    region: dto.region ?? "",
    address: dto.address ?? "",
    memo: dto.memo ?? null,
    updatedAt: dto.updatedAt ?? null,
    basicInfo: {
      openingDate: dto.openingDate ?? null,
      holes: dto.holes ?? null,
      totalLength: dto.totalLength ?? null,
      memberCount: coerceToNumber(dto.memberCount),
      courseNames: dto.courseNames ?? [],
      courseComposition: dto.courseComposition ?? null,
      cityAccessibility: dto.cityAccessibility ?? null,
      introduction: dto.introduction ?? null,
      facilities: dto.facilities ?? null,
    },
    costs: {
      registrationFee: dto.registrationFee ?? null,
      stampDuty: dto.stampDuty ?? null,
      agencyFee: dto.agencyFee ?? null,
      otherCosts: dto.otherCosts ?? null,
      taxOfficial: dto.taxOfficial ?? null,
      weekdayGreenFee: normalizeGreenFee(dto.weekdayGreenFee),
      weekendGreenFee: normalizeGreenFee(dto.weekendGreenFee),
      caddyFee: dto.caddyFee ?? null,
      cartFee: dto.cartFee ?? null,
    },
    marketInfo: {
      recentMarketPrice: dto.recentMarketPrice ?? null,
      recentPriceUpdateDate: dto.recentPriceUpdateDate ?? null,
      avgMarketPrice3y: dto.avgMarketPrice3y ?? null,
      dealerPriceRange: dto.dealerPriceRange ?? null,
      transactionTendency: dto.transactionTendency ?? null,
      tradableTypeSummary: dto.tradableTypeSummary ?? null,
      minTransactionUnit: dto.minTransactionUnit ?? null,
      recentTransactionType: dto.recentTransactionType ?? null,
      balanceRisk: coerceToNumber(dto.balanceRisk),
      registrationDifficulty: coerceToNumber(dto.registrationDifficulty),
      dealerMemo: dto.dealerMemo ?? null,
      membershipInfo: dto.membershipInfo ?? null,
    },
    registration: {
      registrationHours: dto.registrationHours ?? null,
      registrationProcedure: dto.registrationProcedure ?? null,
      documentLink: dto.documentLink ?? null,
      submissionMethods: dto.submissionMethods ?? [],
      processingTime: dto.processingTime ?? null,
      externalUrl: dto.externalUrl ?? null,
      reservationNotes: dto.reservationNotes ?? null,
    },
    contacts,
    bankAccounts,
    memberships: (dto.memberships ?? []).map(mapMembershipDtoToEntity),
    scenarios: (dto.scenarios ?? []).map(mapScenarioWithDocsDtoToEntity),
    documentsGlobal: (dto.documentsGlobal ?? []).map(mapGlobalDocumentDtoToEntity),
    documentsCustomer: (dto.documentsCustomer ?? []).map(mapCustomerDocumentDtoToEntity),
  };
}

// --- trade memo mapper ---

function mapTradeMemoToEntity(dto) {
  return {
    id: dto.id,
    clubId: dto.clubId,
    clubName: dto.clubName,
    membershipType: dto.membershipType,
    tradeType: dto.tradeType,
    customerName: dto.customerName,
    contact: dto.contact,
    offerPrice: coerceToNumber(dto.offerPrice),
    offerPriceNote: dto.offerPriceNote,
    desiredPrice: coerceToNumber(dto.desiredPrice),
    desiredPriceNote: dto.desiredPriceNote,
    notes: dto.notes,
    registrationDate: dto.registrationDate,
    tradeDate: dto.tradeDate,
    remarks: dto.remarks,
    isDone: dto.isDone,
    createdByName: dto.createdByName ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

// --- trade record mapper ---

function mapTradeRecordToEntity(dto) {
  return {
    id: dto.id,
    clubName: dto.clubName ?? "",
    tradeType: dto.tradeType,
    customer: {
      name: dto.customerName,
      contact: dto.contact,
    },
    trade: {
      membershipName: dto.membershipName,
      contractDate: dto.contractDate,
      amount: dto.amount,
      tradingPartner: dto.tradingPartner,
      tradeAmount: dto.tradeAmount,
      commission: dto.commission,
      contractFee: dto.contractFee,
      actualTransactionDate: dto.actualTransactionDate,
    },
    financials: {
      marketProfit: dto.marketProfit,
      total: dto.total,
      expense: dto.expense,
      netProfit: dto.netProfit,
    },
    tax: {
      taxTransfer: dto.taxTransfer,
      taxAcquisition: dto.taxAcquisition,
      invoiceSales: dto.invoiceSales,
      invoicePurchase: dto.invoicePurchase,
    },
    balance: {
      balanceDate: dto.balanceDate,
      balanceCompleted: dto.balanceCompleted,
    },
    manager: dto.manager,
    description: dto.description,
    remarks: dto.remarks,
    createdByName: dto.createdByName ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

// ────────────────────────────────────────
// Mode 1: Fetch (API → JSON)
// ────────────────────────────────────────

async function modeFetch() {
  log("\n=== Mode 1: Fetch (API -> JSON) ===\n");
  ensureDir(resolve(RAW_DIR, "club-details"));

  // 1. 클럽 목록
  log("클럽 목록 가져오는 중...");
  const clubs = await fetchAllPages("/api/clubs", "clubs");
  writeJSON(resolve(RAW_DIR, "clubs-list.json"), clubs);
  log(`  클럽 목록: ${clubs.length}개 저장`);

  // 2. 클럽 상세
  log(`클럽 상세 가져오는 중... (${clubs.length}개)`);
  const detailDir = resolve(RAW_DIR, "club-details");
  let fetched = 0;
  let skipped = 0;
  const failed = [];

  for (let i = 0; i < clubs.length; i++) {
    const club = clubs[i];
    const filePath = resolve(detailDir, `${club.code}.json`);

    if (CONFIG.resume && existsSync(filePath)) {
      skipped++;
      continue;
    }

    try {
      const detail = await fetchJSON(`/api/clubs/${club.code}`);
      writeJSON(filePath, detail);
      fetched++;
      progress(fetched + skipped, clubs.length, club.name);
    } catch (err) {
      failed.push({ code: club.code, name: club.name, error: err.message });
      verbose(`실패: ${club.code} - ${err.message}`);
    }

    if (i < clubs.length - 1) await sleep(CONFIG.delay);
  }

  log(`  클럽 상세: ${fetched}개 저장, ${skipped}개 스킵, ${failed.length}개 실패`);
  if (failed.length > 0) {
    log("  실패 목록:");
    for (const f of failed) log(`    - ${f.code} (${f.name}): ${f.error}`);
  }

  // 3. 거래 메모 (consultations)
  log("거래 메모 가져오는 중...");
  const memos = await fetchAllPages("/api/consultations", "trades");
  writeJSON(resolve(RAW_DIR, "consultations.json"), memos);
  log(`  거래 메모: ${memos.length}개 저장`);

  // 4. 거래 내역 (membership-trades)
  log("거래 내역 가져오는 중...");
  const records = await fetchAllPages("/api/membership-trades", "trades");
  writeJSON(resolve(RAW_DIR, "membership-trades.json"), records);
  log(`  거래 내역: ${records.length}개 저장`);

  log("\nFetch 완료!");
}

// ────────────────────────────────────────
// Mode 2: Validate (타입 검증)
// ────────────────────────────────────────

const KEY_MANIFESTS = {
  club: {
    name: "Club (목록)",
    keys: ["code", "name", "region", "contact", "holes", "operationTypes"],
  },
  clubDetail: {
    name: "ClubDetail (상세)",
    keys: [
      "id", "code", "name", "companyName", "region", "address", "memo", "updatedAt",
      "openingDate", "holes", "totalLength", "memberCount", "courseNames",
      "courseComposition", "cityAccessibility", "introduction", "facilities",
      "registrationFee", "stampDuty", "agencyFee", "otherCosts", "taxOfficial",
      "weekdayGreenFee", "weekendGreenFee", "caddyFee", "cartFee",
      "recentMarketPrice", "recentPriceUpdateDate", "avgMarketPrice3y",
      "dealerPriceRange", "transactionTendency", "tradableTypeSummary",
      "minTransactionUnit", "recentTransactionType", "balanceRisk",
      "registrationDifficulty", "dealerMemo", "membershipInfo",
      "registrationHours", "registrationProcedure", "documentLink",
      "submissionMethods", "processingTime", "externalUrl", "reservationNotes",
      "contacts", "bankAccounts", "memberships", "scenarios",
      "documentsGlobal", "documentsCustomer",
    ],
  },
  tradeMemo: {
    name: "TradeMemo (거래 메모)",
    keys: [
      "id", "clubId", "clubName", "membershipType", "tradeType",
      "customerName", "contact", "offerPrice", "offerPriceNote",
      "desiredPrice", "desiredPriceNote", "notes", "registrationDate",
      "tradeDate", "remarks", "isDone", "createdByName", "createdAt", "updatedAt",
    ],
  },
  tradeRecord: {
    name: "TradeRecord (거래 내역)",
    keys: [
      "id", "clubName", "tradeType", "customerName", "contact",
      "membershipName", "contractDate", "amount", "tradingPartner",
      "tradeAmount", "commission", "contractFee", "actualTransactionDate",
      "marketProfit", "total", "expense", "netProfit",
      "taxTransfer", "taxAcquisition", "invoiceSales", "invoicePurchase",
      "balanceDate", "balanceCompleted",
      "manager", "description", "remarks", "createdByName", "createdAt", "updatedAt",
    ],
  },
};

const COERCE_TO_NUMBER_KEYS = [
  "offerPrice", "desiredPrice", "memberCount",
  "balanceRisk", "registrationDifficulty", "weekendReservationDifficulty",
];

function validateSamples(items, manifest) {
  const samples = items.slice(0, Math.min(5, items.length));
  const results = [];

  for (const sample of samples) {
    const sampleKeys = Object.keys(sample);
    const missing = manifest.keys.filter((k) => !(k in sample));
    const extra = sampleKeys.filter((k) => !manifest.keys.includes(k));

    const typeIssues = [];
    for (const key of manifest.keys) {
      if (!(key in sample) || sample[key] == null) continue;
      if (COERCE_TO_NUMBER_KEYS.includes(key)) {
        const val = sample[key];
        if (typeof val !== "number" && typeof val !== "string") {
          typeIssues.push({ key, expected: "number|string", actual: typeof val });
        }
      }
    }

    results.push({
      id: sample.id ?? sample.code ?? "unknown",
      missing,
      extra,
      typeIssues,
    });
  }

  return {
    entity: manifest.name,
    sampleCount: samples.length,
    results,
    summary: {
      missingKeys: [...new Set(results.flatMap((r) => r.missing))],
      extraKeys: [...new Set(results.flatMap((r) => r.extra))],
      typeIssueKeys: [...new Set(results.flatMap((r) => r.typeIssues.map((t) => t.key)))],
    },
  };
}

async function modeValidate() {
  log("\n=== Mode 2: Validate (타입 검증) ===\n");

  const report = { timestamp: new Date().toISOString(), validations: [] };

  // 클럽 목록
  const clubs = readJSON(resolve(RAW_DIR, "clubs-list.json"));
  if (clubs) {
    report.validations.push(validateSamples(clubs, KEY_MANIFESTS.club));
    log(`  Club 목록: ${clubs.length}개 중 ${Math.min(5, clubs.length)}개 샘플 검증`);
  } else {
    log("  Club 목록: raw 데이터 없음 (fetch 먼저 실행)");
  }

  // 클럽 상세
  const detailDir = resolve(RAW_DIR, "club-details");
  if (existsSync(detailDir)) {
    const files = readdirSync(detailDir).filter((f) => f.endsWith(".json"));
    const details = files.slice(0, 5).map((f) => readJSON(resolve(detailDir, f)));
    if (details.length > 0) {
      report.validations.push(validateSamples(details, KEY_MANIFESTS.clubDetail));
      log(`  ClubDetail 상세: ${files.length}개 중 ${details.length}개 샘플 검증`);
    }
  }

  // 거래 메모
  const memos = readJSON(resolve(RAW_DIR, "consultations.json"));
  if (memos) {
    report.validations.push(validateSamples(memos, KEY_MANIFESTS.tradeMemo));
    log(`  TradeMemo: ${memos.length}개 중 ${Math.min(5, memos.length)}개 샘플 검증`);
  }

  // 거래 내역
  const records = readJSON(resolve(RAW_DIR, "membership-trades.json"));
  if (records) {
    report.validations.push(validateSamples(records, KEY_MANIFESTS.tradeRecord));
    log(`  TradeRecord: ${records.length}개 중 ${Math.min(5, records.length)}개 샘플 검증`);
  }

  writeJSON(resolve(DATA_DIR, "validation-report.json"), report);

  // 요약
  let hasIssues = false;
  for (const v of report.validations) {
    const { missingKeys, extraKeys, typeIssueKeys } = v.summary;
    if (missingKeys.length > 0 || typeIssueKeys.length > 0) {
      hasIssues = true;
      log(`\n  [!] ${v.entity}:`);
      if (missingKeys.length > 0) log(`      누락 키: ${missingKeys.join(", ")}`);
      if (extraKeys.length > 0) log(`      추가 키: ${extraKeys.join(", ")}`);
      if (typeIssueKeys.length > 0) log(`      타입 불일치: ${typeIssueKeys.join(", ")}`);
    }
  }

  if (!hasIssues) log("\n  모든 타입 검증 통과!");
  log(`\n  리포트: ${resolve(DATA_DIR, "validation-report.json")}`);
}

// ────────────────────────────────────────
// Mode 3: ISR Warm (캐시 워밍)
// ────────────────────────────────────────

async function modeWarm() {
  log("\n=== Mode 3: ISR Warm (캐시 워밍) ===\n");

  if (!CONFIG.osBase) {
    log("  SYNC_OS_BASE 환경변수가 설정되지 않았습니다. 스킵.");
    return;
  }

  const clubs = readJSON(resolve(RAW_DIR, "clubs-list.json"));
  if (!clubs || clubs.length === 0) {
    log("  클럽 목록 없음 (fetch 먼저 실행)");
    return;
  }

  const codes = clubs.map((c) => c.code);
  log(`  ${codes.length}개 골프장 ISR 워밍 시작 (동시 요청: ${CONFIG.concurrency})`);

  const results = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < codes.length; i += CONFIG.concurrency) {
    const batch = codes.slice(i, i + CONFIG.concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (code) => {
        const url = `${CONFIG.osBase}/clubs?club=${code}`;
        const start = Date.now();
        const res = await fetch(url);
        const elapsed = Date.now() - start;
        return { code, status: res.status, elapsed };
      }),
    );

    for (let j = 0; j < batchResults.length; j++) {
      const r = batchResults[j];
      if (r.status === "fulfilled") {
        results.push(r.value);
        if (r.value.status === 200) success++;
        else failed++;
      } else {
        results.push({ code: batch[j], status: 0, error: r.reason?.message });
        failed++;
      }
    }

    progress(Math.min(i + CONFIG.concurrency, codes.length), codes.length, "ISR warming...");
    if (i + CONFIG.concurrency < codes.length) await sleep(CONFIG.delay);
  }

  const report = {
    timestamp: new Date().toISOString(),
    osBase: CONFIG.osBase,
    total: codes.length,
    success,
    failed,
    results,
  };

  writeJSON(resolve(DATA_DIR, "isr-warm-report.json"), report);
  log(`\n  ISR 워밍 완료: ${success}개 성공, ${failed}개 실패`);
}

// ────────────────────────────────────────
// Mode 4: Seed (Entity 생성)
// ────────────────────────────────────────

async function modeSeed() {
  log("\n=== Mode 4: Seed (Entity 생성) ===\n");
  ensureDir(ENTITIES_DIR);

  // 1. 클럽 목록
  const rawClubs = readJSON(resolve(RAW_DIR, "clubs-list.json"));
  if (rawClubs) {
    const entities = rawClubs.map(mapClubDtoToEntity);
    writeJSON(resolve(ENTITIES_DIR, "clubs.json"), entities);
    log(`  clubs.json: ${entities.length}개`);
  } else {
    log("  clubs: raw 데이터 없음");
  }

  // 2. 클럽 상세
  const detailDir = resolve(RAW_DIR, "club-details");
  if (existsSync(detailDir)) {
    const files = readdirSync(detailDir).filter((f) => f.endsWith(".json"));
    const detailMap = {};
    let mapped = 0;
    const errors = [];

    for (const f of files) {
      const code = f.replace(".json", "");
      try {
        const raw = readJSON(resolve(detailDir, f));
        detailMap[code] = mapClubDetailDtoToEntity(raw);
        mapped++;
      } catch (err) {
        errors.push({ code, error: err.message });
      }
    }

    writeJSON(resolve(ENTITIES_DIR, "club-details.json"), detailMap);
    log(`  club-details.json: ${mapped}개 (${errors.length}개 실패)`);
    if (errors.length > 0) {
      for (const e of errors) verbose(`    실패: ${e.code} - ${e.error}`);
    }
  } else {
    log("  club-details: raw 데이터 없음");
  }

  // 3. 거래 메모
  const rawMemos = readJSON(resolve(RAW_DIR, "consultations.json"));
  if (rawMemos) {
    const entities = rawMemos.map(mapTradeMemoToEntity);
    writeJSON(resolve(ENTITIES_DIR, "trade-memos.json"), entities);
    log(`  trade-memos.json: ${entities.length}개`);
  } else {
    log("  trade-memos: raw 데이터 없음");
  }

  // 4. 거래 내역
  const rawRecords = readJSON(resolve(RAW_DIR, "membership-trades.json"));
  if (rawRecords) {
    const entities = rawRecords.map(mapTradeRecordToEntity);
    writeJSON(resolve(ENTITIES_DIR, "trade-records.json"), entities);
    log(`  trade-records.json: ${entities.length}개`);
  } else {
    log("  trade-records: raw 데이터 없음");
  }

  log("\nSeed 완료!");
}

// ────────────────────────────────────────
// 메타 저장
// ────────────────────────────────────────

function saveMeta() {
  const meta = {
    timestamp: new Date().toISOString(),
    mode,
    config: {
      apiBase: CONFIG.apiBase,
      osBase: CONFIG.osBase,
      delay: CONFIG.delay,
      concurrency: CONFIG.concurrency,
    },
  };

  if (existsSync(RAW_DIR)) {
    const clubsRaw = readJSON(resolve(RAW_DIR, "clubs-list.json"));
    meta.counts = {
      clubs: clubsRaw?.length ?? 0,
      clubDetails: existsSync(resolve(RAW_DIR, "club-details"))
        ? readdirSync(resolve(RAW_DIR, "club-details")).filter((f) => f.endsWith(".json")).length
        : 0,
      consultations: readJSON(resolve(RAW_DIR, "consultations.json"))?.length ?? 0,
      membershipTrades: readJSON(resolve(RAW_DIR, "membership-trades.json"))?.length ?? 0,
    };
  }

  writeJSON(resolve(DATA_DIR, "_meta.json"), meta);
}

// ────────────────────────────────────────
// 메인
// ────────────────────────────────────────

const MODES = {
  fetch: modeFetch,
  validate: modeValidate,
  warm: modeWarm,
  seed: modeSeed,
  all: async () => {
    await modeFetch();
    await modeValidate();
    await modeSeed();
    await modeWarm();
  },
};

async function main() {
  log("=== Heritage DX -- Data Sync ===");
  log(`모드: ${mode}`);
  verbose(JSON.stringify(CONFIG, null, 2));

  if (!MODES[mode]) {
    log(`\n알 수 없는 모드: ${mode}`);
    log("사용 가능: all, fetch, validate, warm, seed");
    process.exit(1);
  }

  // fetch/all 모드에서만 인증 필요
  if (mode === "fetch" || mode === "all") {
    await authenticate();
  }

  await MODES[mode]();
  saveMeta();
  log("\n완료!");
}

main().catch((err) => {
  console.error("\n[Fatal]", err.message);
  if (CONFIG.verbose) console.error(err.stack);
  process.exit(1);
});
