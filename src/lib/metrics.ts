import type {
  AccountPlatform,
  DailyMetric,
  DashboardFilters,
  Dealer,
  EngagementMetricKey,
  MockDataset,
  PeriodKey,
  StoreAccount,
} from "../types";

export interface PeriodWindow {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  days: number;
}

export interface MetricTotals {
  fans: number;
  newFans: number;
  contentCount: number;
  readsOrViews: number;
  likes: number;
  collections: number;
  comments: number;
  shares: number;
  engagement: number;
}

export interface MetricComparison {
  current: MetricTotals;
  previous: MetricTotals;
  delta: MetricTotals;
  percent: MetricTotals;
}

export interface TrendPoint {
  date: string;
  platform: AccountPlatform | "all";
  fans: number;
  newFans: number;
  contentCount: number;
  readsOrViews: number;
  likes: number;
  collections: number;
  comments: number;
  shares: number;
  engagement: number;
}

export interface ImpactRow {
  id: string;
  account: string;
  platform: string;
  platformId: AccountPlatform;
  region: string;
  dealer: string;
  previous: number;
  current: number;
  delta: number;
  percent: number;
  impactShare: number;
}

export type ActiveStatus = "活跃" | "低活跃" | "未活跃";

export interface RankingRow {
  id: string;
  rank: number;
  account: string;
  platform: string;
  region: string;
  dealer: string;
  contentCount: number;
  newFans: number;
  readsOrViews: number;
  engagement: number;
  activeStatus: ActiveStatus;
}

export interface ActiveDistributionRow {
  key: string;
  region: string;
  platform: string;
  active: number;
  lowActive: number;
  inactive: number;
}

export interface KpiRow {
  id: string;
  region: string;
  dealer: string;
  account: string;
  readsTarget: number;
  readsCurrent: number;
  readsCompletion: number;
  engagementTarget: number;
  engagementCurrent: number;
  engagementCompletion: number;
  newFansTarget: number;
  newFansCurrent: number;
  newFansCompletion: number;
  overallCompletion: number;
  status: "On Track" | "Watch" | "At Risk";
}

export interface KpiCardModel {
  id: string;
  label: string;
  value: number;
  previous?: number;
  delta?: number;
  percent?: number;
  valueType?: "number" | "percent";
}

export interface DashboardModel {
  window: PeriodWindow;
  accountCount: number;
  dealerCount: number;
  scopeLabel: string;
  comparison: MetricComparison;
  kpis: KpiCardModel[];
  fanTrend: TrendPoint[];
  engagementTrend: TrendPoint[];
  fanImpactRows: ImpactRow[];
  engagementImpactRows: ImpactRow[];
  activeDistribution: ActiveDistributionRow[];
  rankingRows: RankingRow[];
  kpiRows: KpiRow[];
  activeRate: number;
  quarterlyKpiCompletion: number;
}

const periodDays: Record<PeriodKey, number> = {
  "7d": 7,
  "15d": 15,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

const platformLabels: Record<AccountPlatform, string> = {
  xiaohongshu: "小红书",
  douyin: "抖音",
};

const emptyTotals = (): MetricTotals => ({
  fans: 0,
  newFans: 0,
  contentCount: 0,
  readsOrViews: 0,
  likes: 0,
  collections: 0,
  comments: 0,
  shares: 0,
  engagement: 0,
});

export function sumEngagement(metric: Pick<DailyMetric, "likes" | "collections" | "comments" | "shares">): number {
  return metric.likes + metric.collections + metric.comments + metric.shares;
}

function toDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const value = toDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return toIsoDate(value);
}

export function getPeriodWindow(period: PeriodKey, today: string): PeriodWindow {
  const days = periodDays[period];
  const currentEnd = today;
  const currentStart = addDays(today, -(days - 1));
  const previousEnd = addDays(currentStart, -1);
  const previousStart = addDays(previousEnd, -(days - 1));
  return { currentStart, currentEnd, previousStart, previousEnd, days };
}

function isWithin(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

export function filterAccounts(dataset: MockDataset, filters: DashboardFilters): StoreAccount[] {
  return dataset.accounts.filter((account) => {
    if (dataset.currentUser.role === "dealer" && dataset.currentUser.dealerId && account.dealerId !== dataset.currentUser.dealerId) return false;
    if (filters.platform !== "all" && account.platform !== filters.platform) return false;
    if (filters.regionId !== "all" && (filters.regionId === "direct" ? account.regionId !== null : account.regionId !== filters.regionId)) return false;
    if (filters.dealerId !== "all" && account.dealerId !== filters.dealerId) return false;
    if (filters.accountId !== "all" && account.id !== filters.accountId) return false;
    return true;
  });
}

function metricValue(totals: MetricTotals, metric: EngagementMetricKey) {
  return totals[metric];
}

function groupDailyMetrics(dataset: MockDataset) {
  const map = new Map<string, DailyMetric[]>();
  dataset.dailyMetrics.forEach((metric) => {
    const existing = map.get(metric.accountId) ?? [];
    existing.push(metric);
    map.set(metric.accountId, existing);
  });
  return map;
}

function aggregateAccountPeriod(metrics: DailyMetric[], start: string, end: string): MetricTotals {
  const totals = emptyTotals();
  let lastFans = 0;

  metrics.forEach((metric) => {
    if (!isWithin(metric.date, start, end)) return;
    lastFans = metric.fans;
    totals.newFans += metric.newFans;
    totals.contentCount += metric.contentCount;
    totals.readsOrViews += metric.readsOrViews;
    totals.likes += metric.likes;
    totals.collections += metric.collections;
    totals.comments += metric.comments;
    totals.shares += metric.shares;
  });

  totals.fans = lastFans;
  totals.engagement = totals.likes + totals.collections + totals.comments + totals.shares;
  return totals;
}

function addTotals(target: MetricTotals, source: MetricTotals) {
  target.fans += source.fans;
  target.newFans += source.newFans;
  target.contentCount += source.contentCount;
  target.readsOrViews += source.readsOrViews;
  target.likes += source.likes;
  target.collections += source.collections;
  target.comments += source.comments;
  target.shares += source.shares;
  target.engagement += source.engagement;
}

function compareTotals(current: MetricTotals, previous: MetricTotals): MetricComparison {
  const delta = emptyTotals();
  const percent = emptyTotals();
  (Object.keys(current) as Array<keyof MetricTotals>).forEach((key) => {
    delta[key] = current[key] - previous[key];
    percent[key] = previous[key] === 0 ? 0 : delta[key] / previous[key];
  });
  return { current, previous, delta, percent };
}

function buildTrend(metricsByAccount: Map<string, DailyMetric[]>, accounts: StoreAccount[], start: string, end: string, platformMode: "all" | "split") {
  const rows = new Map<string, TrendPoint>();

  accounts.forEach((account) => {
    const metrics = metricsByAccount.get(account.id) ?? [];
    metrics.forEach((metric) => {
      if (!isWithin(metric.date, start, end)) return;
      const platform = platformMode === "split" ? account.platform : "all";
      const key = `${metric.date}-${platform}`;
      const existing = rows.get(key) ?? {
        date: metric.date,
        platform,
        ...emptyTotals(),
      };
      existing.fans += metric.fans;
      existing.newFans += metric.newFans;
      existing.contentCount += metric.contentCount;
      existing.readsOrViews += metric.readsOrViews;
      existing.likes += metric.likes;
      existing.collections += metric.collections;
      existing.comments += metric.comments;
      existing.shares += metric.shares;
      existing.engagement += sumEngagement(metric);
      rows.set(key, existing);
    });
  });

  return Array.from(rows.values()).sort((a, b) => a.date.localeCompare(b.date) || a.platform.localeCompare(b.platform));
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function getScopeLabel(dataset: MockDataset, filters: DashboardFilters) {
  const region = dataset.regions.find((item) => item.id === filters.regionId);
  const dealer = dataset.dealers.find((item) => item.id === filters.dealerId);
  const account = dataset.accounts.find((item) => item.id === filters.accountId);
  if (account) return account.name;
  if (dealer && region) return `${dealer.name} / ${region.label}`;
  if (dealer && filters.regionId === "direct") return `${dealer.name} / 未分大区`;
  if (dealer) return dealer.name;
  if (region) return region.label;
  if (filters.regionId === "direct") return "未分大区门店";
  return dataset.currentUser.role === "apple" ? "Apple 全经销商" : "当前经销商";
}

function regionLabel(regionMap: Map<string, { label: string }>, regionId: string | null) {
  return regionId ? regionMap.get(regionId)?.label ?? regionId : "未分大区";
}

function dealerAccountCounts(accounts: StoreAccount[]) {
  const counts = new Map<string, number>();
  accounts.forEach((account) => counts.set(account.dealerId, (counts.get(account.dealerId) ?? 0) + 1));
  return counts;
}

function statusForCompletion(completion: number, expectedQuarterProgress: number): KpiRow["status"] {
  if (completion >= expectedQuarterProgress - 0.05) return "On Track";
  if (completion >= expectedQuarterProgress - 0.2) return "Watch";
  return "At Risk";
}

function getQuarterStart(today: string) {
  const date = toDate(today);
  const month = date.getUTCMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  return toIsoDate(new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1)));
}

function getQuarterProgress(today: string) {
  const date = toDate(today);
  const start = toDate(getQuarterStart(today));
  const month = date.getUTCMonth();
  const quarterEnd = new Date(Date.UTC(date.getUTCFullYear(), Math.floor(month / 3) * 3 + 3, 0));
  return (date.getTime() - start.getTime()) / (quarterEnd.getTime() - start.getTime());
}

function buildImpactRows(
  dataset: MockDataset,
  accounts: StoreAccount[],
  metricsByAccount: Map<string, DailyMetric[]>,
  window: PeriodWindow,
  metric: "fans" | EngagementMetricKey,
): ImpactRow[] {
  const regions = new Map(dataset.regions.map((region) => [region.id, region]));
  const dealers = new Map(dataset.dealers.map((dealer) => [dealer.id, dealer]));
  const rows = accounts.map((account) => {
    const metrics = metricsByAccount.get(account.id) ?? [];
    const currentTotals = aggregateAccountPeriod(metrics, window.currentStart, window.currentEnd);
    const previousTotals = aggregateAccountPeriod(metrics, window.previousStart, window.previousEnd);
    const current = metric === "fans" ? currentTotals.fans : metricValue(currentTotals, metric);
    const previous = metric === "fans" ? previousTotals.fans : metricValue(previousTotals, metric);
    const delta = current - previous;
    return {
      id: `${account.id}-${metric}`,
      account: account.name,
      platform: platformLabels[account.platform],
      platformId: account.platform,
      region: regionLabel(regions, account.regionId),
      dealer: dealers.get(account.dealerId)?.name ?? account.dealerId,
      previous,
      current,
      delta,
      percent: previous === 0 ? 0 : delta / previous,
      impactShare: 0,
    };
  });

  const totalAbsoluteDelta = rows.reduce((sum, row) => sum + Math.abs(row.delta), 0);
  return rows
    .map((row) => ({ ...row, impactShare: totalAbsoluteDelta === 0 ? 0 : Math.abs(row.delta) / totalAbsoluteDelta }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 12);
}

export function buildDashboardModel(dataset: MockDataset, filters: DashboardFilters, metric: EngagementMetricKey): DashboardModel {
  const window = getPeriodWindow(filters.period, dataset.mockToday);
  const accounts = filterAccounts(dataset, filters);
  const metricsByAccount = groupDailyMetrics(dataset);
  const dealerMap = new Map(dataset.dealers.map((dealer) => [dealer.id, dealer]));
  const regionMap = new Map(dataset.regions.map((region) => [region.id, region]));

  const current = emptyTotals();
  const previous = emptyTotals();
  const accountPeriodTotals = accounts.map((account) => {
    const metrics = metricsByAccount.get(account.id) ?? [];
    const currentTotals = aggregateAccountPeriod(metrics, window.currentStart, window.currentEnd);
    const previousTotals = aggregateAccountPeriod(metrics, window.previousStart, window.previousEnd);
    addTotals(current, currentTotals);
    addTotals(previous, previousTotals);
    return { account, currentTotals, previousTotals };
  });

  const comparison = compareTotals(current, previous);
  const engagementValues = accountPeriodTotals.map(({ currentTotals }) => currentTotals.engagement).filter((value) => value > 0);
  const engagementMedian = median(engagementValues);

  const statusByAccount = new Map<string, ActiveStatus>();
  accountPeriodTotals.forEach(({ account, currentTotals }) => {
    const status: ActiveStatus =
      currentTotals.contentCount > 0 && currentTotals.engagement < engagementMedian
        ? "低活跃"
        : currentTotals.contentCount > 0 || currentTotals.engagement > 0
          ? "活跃"
          : "未活跃";
    statusByAccount.set(account.id, status);
  });

  const activeCount = Array.from(statusByAccount.values()).filter((status) => status !== "未活跃").length;
  const activeRate = accounts.length === 0 ? 0 : activeCount / accounts.length;
  const uniqueDealers = new Set(accounts.map((account) => account.dealerId));
  const platformMode = filters.platform === "all" ? "split" : "all";
  const fanTrend = buildTrend(metricsByAccount, accounts, window.currentStart, window.currentEnd, platformMode);
  const engagementTrend = fanTrend;

  const rankingRows = accountPeriodTotals
    .map(({ account, currentTotals }) => ({
      id: account.id,
      rank: 0,
      account: account.name,
      platform: platformLabels[account.platform],
      region: regionLabel(regionMap, account.regionId),
      dealer: dealerMap.get(account.dealerId)?.name ?? account.dealerId,
      contentCount: currentTotals.contentCount,
      newFans: currentTotals.newFans,
      readsOrViews: currentTotals.readsOrViews,
      engagement: currentTotals.engagement,
      activeStatus: statusByAccount.get(account.id) ?? "未活跃",
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const activeDistributionMap = new Map<string, ActiveDistributionRow>();
  accounts.forEach((account) => {
    const region = regionLabel(regionMap, account.regionId);
    const platform = platformLabels[account.platform];
    const key = `${region}-${platform}`;
    const row = activeDistributionMap.get(key) ?? { key, region, platform, active: 0, lowActive: 0, inactive: 0 };
    const status = statusByAccount.get(account.id);
    if (status === "低活跃") row.lowActive += 1;
    else if (status === "活跃") row.active += 1;
    else row.inactive += 1;
    activeDistributionMap.set(key, row);
  });

  const quarterStart = getQuarterStart(dataset.mockToday);
  const expectedQuarterProgress = getQuarterProgress(dataset.mockToday);
  const allAccountCountsByDealer = dealerAccountCounts(dataset.accounts);
  const kpiRows = accountPeriodTotals.map(({ account }) => {
    const dealer = dealerMap.get(account.dealerId) as Dealer;
    const metrics = metricsByAccount.get(account.id) ?? [];
    const quarterTotals = aggregateAccountPeriod(metrics, quarterStart, dataset.mockToday);
    const dealerAccountCount = allAccountCountsByDealer.get(account.dealerId) ?? 1;
    const readsTarget = dealer.quarterlyKpi.readsOrViews / dealerAccountCount;
    const engagementTarget = dealer.quarterlyKpi.engagement / dealerAccountCount;
    const newFansTarget = dealer.quarterlyKpi.newFans / dealerAccountCount;
    const readsCompletion = Math.min(1.2, quarterTotals.readsOrViews / readsTarget);
    const engagementCompletion = Math.min(1.2, quarterTotals.engagement / engagementTarget);
    const newFansCompletion = Math.min(1.2, quarterTotals.newFans / newFansTarget);
    const overallCompletion = (readsCompletion + engagementCompletion + newFansCompletion) / 3;
    return {
      id: `kpi-${account.id}`,
      region: regionLabel(regionMap, account.regionId),
      dealer: dealer.name,
      account: account.name,
      readsTarget,
      readsCurrent: quarterTotals.readsOrViews,
      readsCompletion,
      engagementTarget,
      engagementCurrent: quarterTotals.engagement,
      engagementCompletion,
      newFansTarget,
      newFansCurrent: quarterTotals.newFans,
      newFansCompletion,
      overallCompletion,
      status: statusForCompletion(overallCompletion, expectedQuarterProgress),
    };
  });

  const quarterlyKpiCompletion = kpiRows.length === 0 ? 0 : kpiRows.reduce((sum, row) => sum + row.overallCompletion, 0) / kpiRows.length;

  return {
    window,
    accountCount: accounts.length,
    dealerCount: uniqueDealers.size,
    scopeLabel: getScopeLabel(dataset, filters),
    comparison,
    kpis: [
      { id: "fans", label: "粉丝总量", value: current.fans, previous: previous.fans, delta: comparison.delta.fans, percent: comparison.percent.fans },
      { id: "content", label: "作品数量", value: current.contentCount, previous: previous.contentCount, delta: comparison.delta.contentCount, percent: comparison.percent.contentCount },
      { id: "engagement", label: "互动总量", value: current.engagement, previous: previous.engagement, delta: comparison.delta.engagement, percent: comparison.percent.engagement },
      { id: "active", label: "活跃账号率", value: activeRate, valueType: "percent" },
      { id: "kpi", label: "季度 KPI 完成率", value: quarterlyKpiCompletion, valueType: "percent" },
    ],
    fanTrend,
    engagementTrend,
    fanImpactRows: buildImpactRows(dataset, accounts, metricsByAccount, window, "fans"),
    engagementImpactRows: buildImpactRows(dataset, accounts, metricsByAccount, window, metric),
    activeDistribution: Array.from(activeDistributionMap.values()),
    rankingRows,
    kpiRows,
    activeRate,
    quarterlyKpiCompletion,
  };
}
