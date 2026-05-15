// Entities (re-export for convenience)
export type {
  FetchStatus,
  PaginationState,
  ClubEntity,
  ClubDetailEntity,
  ClubContactEntity,
  BankAccountEntity,
  ConsultationEntity,
  ConsultationApprovalStructuralField,
  ConsultationApprovalFillableField,
  ConsultationApprovalMissingFields,
  ConsultationAiInput,
  ConsultationAiDraft,
  ConsultationAiCandidate,
  ConsultationAiMatchInfo,
  ConsultationAiMissingField,
  ConsultationAiResponse,
  MembershipTradeEntity,
  MembershipEntity,
  ScenarioEntity,
  ScenarioSide,
  ScenarioOwnerType,
  ScenarioWithDocsEntity,
  DocumentsSummaryEntity,
  ScenarioMatchFilters,
  ScenarioBasicCode,
  ScenarioAccentTokens,
  DocumentEntity,
  GlobalDocumentEntity,
  CustomerDocumentEntity,
  MembershipDocumentEntity,
  OrganizationEntity,
  UserRole,
  UserEntity,
  AdminUserEntity,
  EmployeeEntity,
  ClubDocumentEntity,
  ClubScenarioDocumentEntity,
  CustomerEntity,
  CustomerHistorySummaryEntity,
  CustomerHistoryRecentConsultationEntity,
  CustomerHistoryRecentMembershipTradeEntity,
  CustomerGradeKey,
  OwnedMembershipEntity,
  OwnedMembershipStatusKey,
  SettlementEntity,
  SettlementCellKey,
} from "./entities/index";
export {
  scenarioMatchesFilters,
  findMatchingScenario,
  SCENARIO_BASIC_LABEL,
  SCENARIO_BASIC_ACCENT,
  getScenarioBasicLabel,
  getScenarioBasicAccent,
  isDocumentExpired,
  isDocumentDownloadable,
  collectMissingConsultationApprovalFields,
  flattenMemoHistoryNotes,
  decodeMemoEntries,
  appendCustomerMemoEntry,
  CUSTOMER_GRADE_LABEL,
  getCustomerGradeLabel,
  OWNED_MEMBERSHIP_STATUS_LABEL,
  getOwnedMembershipStatusLabel,
  EMPTY_SETTLEMENT_ENTITY,
  SETTLEMENT_CELL_KEYS,
} from "./entities/index";
export type { CustomerMemoEntry } from "./entities/index";

// Stores
export {
  createClubStore,
  createConsultationStore,
  createMembershipTradeStore,
  createConsultationAdminStore,
  createMembershipTradeAdminStore,
  createCustomerStore,
  createSettlementStore,
} from "./stores";
export type {
  ClubStore,
  ClubStoreState,
  ConsultationStore,
  ConsultationStoreState,
  MembershipTradeStore,
  MembershipTradeStoreState,
  ConsultationAdminStore,
  ConsultationAdminStoreState,
  MembershipTradeAdminStore,
  MembershipTradeAdminStoreState,
  CustomerStore,
  CustomerStoreState,
  CustomerCreateResult,
  RequestApprovalResult,
  SettlementStore,
  SettlementStoreState,
} from "./stores";

// Hooks
export {
  useClubs,
  useClubDetail,
  useConsultations,
  useMembershipTrades,
  useConsultationsAdmin,
  useMembershipTradesAdmin,
  useScenarioOptions,
  useScenarioDocuments,
  useGlobalDocuments,
  useClubDocuments,
  useClaims,
  useKpi,
  useKpiSummary,
  useKpiSeries,
  useKpiByEmployee,
  useUsers,
  useUserMutations,
  useMyOrganization,
  useNotices,
  useNoticeMutations,
  useMarketPrices,
  invalidateNoticesCache,
  invalidateMarketPricesCache,
  invalidateScenarioOptionsCache,
  invalidateUsersCache,
  invalidateMyOrganizationCache,
  useCustomers,
  useFavoriteConsultations,
  useRecentSearches,
  useFavoriteClubs,
  useTopClubs,
  useSettlements,
  useInvalidate,
} from "./hooks";
export type {
  ScenarioOptionsData,
  ScenarioDocumentsData,
  NoticesPagination,
  MarketPricePeriod,
  MarketPricePoint,
  UseFavoriteConsultationsResult,
  UseRecentSearchesResult,
  RecentSearchItem,
  UseFavoriteClubsResult,
  FavoriteClubItem,
  FavoriteClubMeta,
  UseTopClubsResult,
  TopClubLookupItem,
  CacheTag,
} from "./hooks";

// Auth domain
export {
  ROLE_LABELS,
  ROLE_BADGE_VARIANTS,
  canManageOrg,
  canAccessUsersPage,
  canDeleteConsultation,
  canDeleteTrade,
  getAssignableRoles,
} from "./domain/auth";
export type {
  RoleBadgeVariant,
  AssignableRoleOption,
  DeletableConsultation,
} from "./domain/auth";

// KPI domain
export {
  PRESET_GROUPS,
  getDateRange,
  getMonthBuckets,
  getDailyBuckets,
  getWeeklyBuckets,
  getTimeBuckets,
  toConsultationDateField,
} from "./domain/kpi";
export type {
  PeriodPreset,
  DateField,
  KpiFilters,
  PresetGroupItem,
  DateRange,
  TimeBucket,
  KpiSummary,
  TrendDataPoint,
  EmployeeKpiData,
  KpiMetric,
} from "./domain/kpi";

// Tax domain
export {
  calculateTax,
  getScenarioLabel,
  getResultLabel,
  DEFAULT_TAX_SETTINGS,
  DEFAULT_BROKERAGE_FEE_RATE,
  TAX_DESCRIPTIONS,
  CAPITAL_GAINS_TAX_BRACKETS,
  CORPORATE_TAX_BRACKETS,
} from "./domain/tax";
export type {
  EntityType,
  TransactionType,
  TaxScenario,
  TaxBracket,
  TaxTypeSettings,
  StampDutyBracket,
  TaxRateSettings,
  CalculatorInput,
  TaxCalculationItem,
  CalculationResult,
} from "./domain/tax";

// Mappers (re-export for server-side usage convenience)
export {
  mapClubDtoToEntity,
  mapClubDetailDtoToEntity,
  pickClubUpdatePayload,
  CLUB_UPDATE_ALLOWED_FIELDS,
  mapConsultationDtoToEntity,
  mapConsultationEntityToInput,
  buildClubMembershipPair,
  mapMembershipTradeDtoToEntity,
  mapMembershipTradeEntityToInput,
  mapCustomerDtoToEntity,
  mapCustomerHistorySummaryDtoToEntity,
  mapCustomerEntityToInput,
  mapCustomerEntityToUpdateInput,
  mapOwnedMembershipDtoToEntity,
  mapOwnedMembershipEntityToInput,
  mapSettlementDtoToEntity,
  mapSettlementEntityToInput,
  mapSettlementEntityToUpdateInput,
  normalizePagination,
} from "./mappers/index";
export type { ClubUpdateField } from "./mappers/index";

// Approval workflow constants/types (re-export from @heritage-dx/types so views
// don't need to import the types package directly)
export {
  APPROVAL_STATUS,
  APPROVAL_ACTIONS,
  TRADE_WORKFLOW_STATUS,
  PROGRESS_STATUS,
  REQUEST_TYPES,
} from "@heritage-dx/types";
export type {
  ApprovalStatus,
  WorkflowStatus,
  TradeWorkflowStatus,
  ProgressStatus,
  ApprovalAction,
  UserApprovalAction,
  UserConsultationAction,
  AdminConsultationAction,
  AdminTradeAction,
  ApprovalActionInput,
  RequestType,
} from "@heritage-dx/types";

// Consultation progress helpers
export {
  isConsultationCompleted,
  isInTradeStage,
  canRequestApproval,
  isUnderReview,
} from "./domain/consultation-progress";

// Trade record display helpers
export {
  getTradeWorkflowMeta,
  canAdvanceTradeToTaxFiling,
  canAdvanceTradeToCompleted,
  canRejectTradeRecord,
  formatTradeRecordPrice,
  getTradeRecordGroupLabel,
  groupTradeRecordsByContractMonth,
  getTradeRecordCounts,
} from "./domain/trade-records";
export type {
  TradeRecordWorkflowTone,
  TradeRecordWorkflowMeta,
  TradeRecordWorkflowLike,
  TradeRecordCountLike,
  TradeRecordDateLike,
  GroupedTradeRecords,
  TradeRecordCounts,
} from "./domain/trade-records";


// 고객 update 입력 타입 — 뷰의 인라인 편집(`InlineField`) 콜백에서 사용
export type { CustomerUpdateInput } from "@heritage-dx/types";

// Settlement DTO/Input — 뷰가 @heritage-dx/store 만 import 하도록 재노출
export type {
  Settlement,
  SettlementInput,
  SettlementUpdateInput,
  SettlementDraftResponse,
  SettlementEntityType,
  SettlementRoute,
  SettlementsResponse,
} from "@heritage-dx/types";

// 상담 메모 (notes JSONB) 타입 — 뷰는 @heritage-dx/store 경유로만 import
export type {
  ConsultationNoteEntry,
  ConsultationNotes,
  ConsultationNoteInput,
} from "@heritage-dx/types";
