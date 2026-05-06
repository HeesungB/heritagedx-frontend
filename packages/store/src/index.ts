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
  useCustomers,
  useFavoriteConsultations,
  useRecentSearches,
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
  mapConsultationDtoToEntity,
  mapConsultationEntityToInput,
  buildClubMembershipPair,
  mapMembershipTradeDtoToEntity,
  mapMembershipTradeEntityToInput,
  mapCustomerDtoToEntity,
  mapCustomerHistorySummaryDtoToEntity,
  mapCustomerEntityToInput,
  mapCustomerEntityToUpdateInput,
  normalizePagination,
} from "./mappers/index";

// Approval workflow constants/types (re-export from @heritage-dx/types so views
// don't need to import the types package directly)
export { APPROVAL_STATUS, APPROVAL_ACTIONS } from "@heritage-dx/types";
export type {
  ApprovalStatus,
  WorkflowStatus,
  ApprovalAction,
  UserApprovalAction,
  UserConsultationAction,
  AdminConsultationAction,
  AdminTradeAction,
  ApprovalActionInput,
} from "@heritage-dx/types";

// 고객 update 입력 타입 — 뷰의 인라인 편집(`InlineField`) 콜백에서 사용
export type { CustomerUpdateInput } from "@heritage-dx/types";

// 상담 메모 (notes JSONB) 타입 — 뷰는 @heritage-dx/store 경유로만 import
export type {
  ConsultationNoteEntry,
  ConsultationNotes,
  ConsultationNoteInput,
} from "@heritage-dx/types";
