import type {
  AccountPlatform,
  DailyMetric,
  DashboardFilters,
  Dealer,
  EngagementMetricKey,
  MockDataset,
  PeriodKey,
  QuarterKey,
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
  dealer: string;
  accountCount: number;
  activeCount: number;
  lowActiveCount: number;
  inactiveCount: number;
  activeAccountRate: number;
  contentCount: number;
  newFans: number;
  readsOrViews: number;
  engagement: number;
}

export interface ActiveDistributionRow {
  key: string;
  dealer: string;
  active: number;
  lowActive: number;
  inactive: number;
}

export interface KpiRow {
  id: string;
  kpiGroup: string;
  dealerId: string;
  dealer: string;
  accountCount: number;
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
  kpiQuarter: QuarterKey;
  kpiQuarterLabel: string;
  kpiWindow: { start: string; end: string };
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

function buildTrend(metricsByAccount: Map<string, DailyMetric[]>, accounts: StoreAccount[], start: string, end: string) {
  const rows = new Map<string, TrendPoint>();

  accounts.forEach((account) => {
    const metrics = metricsByAccount.get(account.id) ?? [];
    metrics.forEach((metric) => {
      if (!isWithin(metric.date, start, end)) return;
      const platform = account.platform;
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

function accountActivityStatus(currentTotals: MetricTotals, engagementMedian: number): ActiveStatus {
  const hasAnySignal = currentTotals.contentCount > 0 || currentTotals.engagement > 0;
  if (!hasAnySignal) return "未活跃";
  if (currentTotals.contentCount < 2 || currentTotals.engagement < engagementMedian) return "低活跃";
  return "活跃";
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

function kpiGroupForDealerIndex(index: number) {
  if (index < 5) return "一组";
  if (index < 16) return "二组";
  if (index < 37) return "三组";
  return "四组";
}

function currentQuarterKey(today: string): QuarterKey {
  const date = toDate(today);
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${date.getUTCFullYear()}Q${quarter}` as QuarterKey;
}

function getQuarterWindow(quarter: QuarterKey, today: string) {
  const year = Number(quarter.slice(0, 4));
  const quarterIndex = Number(quarter.slice(5)) - 1;
  const start = new Date(Date.UTC(year, quarterIndex * 3, 1));
  const quarterEnd = new Date(Date.UTC(year, quarterIndex * 3 + 3, 0));
  const todayDate = toDate(today);
  const end = quarterEnd.getTime() > todayDate.getTime() ? todayDate : quarterEnd;
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
  };
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

  const visibleRows = rows.filter((row) => row.current > 0);
  const totalAbsoluteDelta = visibleRows.reduce((sum, row) => sum + Math.abs(row.delta), 0);
  return visibleRows
    .map((row) => ({ ...row, impactShare: totalAbsoluteDelta === 0 ? 0 : Math.abs(row.delta) / totalAbsoluteDelta }))
    .sort((a, b) => b.current - a.current || Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 12);
}

export function buildDashboardModel(dataset: MockDataset, filters: DashboardFilters, metric: EngagementMetricKey, kpiQuarter: QuarterKey = currentQuarterKey(dataset.mockToday)): DashboardModel {
  const window = getPeriodWindow(filters.period, dataset.mockToday);
  const accounts = filterAccounts(dataset, filters);
  const metricsByAccount = groupDailyMetrics(dataset);
  const dealerMap = new Map(dataset.dealers.map((dealer) => [dealer.id, dealer]));
  const dealerIndexMap = new Map(dataset.dealers.map((dealer, index) => [dealer.id, index]));

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
    statusByAccount.set(account.id, accountActivityStatus(currentTotals, engagementMedian));
  });

  const activeCount = Array.from(statusByAccount.values()).filter((status) => status === "活跃").length;
  const activeRate = accounts.length === 0 ? 0 : activeCount / accounts.length;
  const uniqueDealers = new Set(accounts.map((account) => account.dealerId));
  const fanTrend = buildTrend(metricsByAccount, accounts, window.currentStart, window.currentEnd);
  const engagementTrend = fanTrend;

  const rankingRows = accountPeriodTotals
    .reduce<Map<string, RankingRow>>((rows, { account, currentTotals }) => {
      const existing =
        rows.get(account.dealerId) ??
        ({
          id: account.dealerId,
          rank: 0,
          dealer: dealerMap.get(account.dealerId)?.name ?? account.dealerId,
          accountCount: 0,
          activeCount: 0,
          lowActiveCount: 0,
          inactiveCount: 0,
          activeAccountRate: 0,
          contentCount: 0,
          newFans: 0,
          readsOrViews: 0,
          engagement: 0,
        } satisfies RankingRow);
      existing.accountCount += 1;
      const status = statusByAccount.get(account.id);
      if (status === "活跃") existing.activeCount += 1;
      else if (status === "低活跃") existing.lowActiveCount += 1;
      else existing.inactiveCount += 1;
      existing.contentCount += currentTotals.contentCount;
      existing.newFans += currentTotals.newFans;
      existing.readsOrViews += currentTotals.readsOrViews;
      existing.engagement += currentTotals.engagement;
      rows.set(account.dealerId, existing);
      return rows;
    }, new Map())
    .values();

  const dealerRankingRows = Array.from(rankingRows)
    .map((row) => ({ ...row, activeAccountRate: row.accountCount === 0 ? 0 : row.activeCount / row.accountCount }))
    .sort((a, b) => b.activeCount - a.activeCount || b.lowActiveCount - a.lowActiveCount || b.engagement - a.engagement)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const activeDistributionMap = new Map<string, ActiveDistributionRow>();
  accounts.forEach((account) => {
    const dealer = dealerMap.get(account.dealerId)?.name ?? account.dealerId;
    const key = dealer;
    const row = activeDistributionMap.get(key) ?? { key, dealer, active: 0, lowActive: 0, inactive: 0 };
    const status = statusByAccount.get(account.id);
    if (status === "低活跃") row.lowActive += 1;
    else if (status === "活跃") row.active += 1;
    else row.inactive += 1;
    activeDistributionMap.set(key, row);
  });

  const quarterWindow = getQuarterWindow(kpiQuarter, dataset.mockToday);
  const allAccountCountsByDealer = dealerAccountCounts(dataset.accounts);
  const kpiRows = Array.from(
    accountPeriodTotals
      .reduce<
        Map<
          string,
          {
            dealer: Dealer;
            accountCount: number;
            totals: MetricTotals;
          }
        >
      >((rows, { account }) => {
        const dealer = dealerMap.get(account.dealerId) as Dealer;
        const row = rows.get(account.dealerId) ?? { dealer, accountCount: 0, totals: emptyTotals() };
        const metrics = metricsByAccount.get(account.id) ?? [];
        const quarterTotals = aggregateAccountPeriod(metrics, quarterWindow.start, quarterWindow.end);
        row.accountCount += 1;
        addTotals(row.totals, quarterTotals);
        rows.set(account.dealerId, row);
        return rows;
      }, new Map())
      .values(),
  ).map(({ dealer, accountCount, totals }) => {
    const dealerIndex = dealerIndexMap.get(dealer.id) ?? 0;
    const dealerAccountCount = allAccountCountsByDealer.get(dealer.id) ?? accountCount;
    const visibleShare = dealerAccountCount === 0 ? 1 : accountCount / dealerAccountCount;
    const readsTarget = dealer.quarterlyKpi.readsOrViews * visibleShare;
    const engagementTarget = dealer.quarterlyKpi.engagement * visibleShare;
    const newFansTarget = dealer.quarterlyKpi.newFans * visibleShare;
    const readsCompletion = readsTarget === 0 ? 0 : totals.readsOrViews / readsTarget;
    const engagementCompletion = engagementTarget === 0 ? 0 : totals.engagement / engagementTarget;
    const newFansCompletion = newFansTarget === 0 ? 0 : totals.newFans / newFansTarget;
    const overallCompletion = (readsCompletion + engagementCompletion + newFansCompletion) / 3;
    return {
      id: `kpi-${dealer.id}`,
      kpiGroup: kpiGroupForDealerIndex(dealerIndex),
      dealerId: dealer.id,
      dealer: dealer.name,
      accountCount,
      readsTarget,
      readsCurrent: totals.readsOrViews,
      readsCompletion,
      engagementTarget,
      engagementCurrent: totals.engagement,
      engagementCompletion,
      newFansTarget,
      newFansCurrent: totals.newFans,
      newFansCompletion,
      overallCompletion,
    };
  });

  const kpiTotals = kpiRows.reduce(
    (totals, row) => ({
      readsTarget: totals.readsTarget + row.readsTarget,
      readsCurrent: totals.readsCurrent + row.readsCurrent,
      engagementTarget: totals.engagementTarget + row.engagementTarget,
      engagementCurrent: totals.engagementCurrent + row.engagementCurrent,
      newFansTarget: totals.newFansTarget + row.newFansTarget,
      newFansCurrent: totals.newFansCurrent + row.newFansCurrent,
    }),
    { readsTarget: 0, readsCurrent: 0, engagementTarget: 0, engagementCurrent: 0, newFansTarget: 0, newFansCurrent: 0 },
  );
  const quarterlyKpiCompletion =
    kpiRows.length === 0
      ? 0
      : ((kpiTotals.readsTarget === 0 ? 0 : kpiTotals.readsCurrent / kpiTotals.readsTarget) +
          (kpiTotals.engagementTarget === 0 ? 0 : kpiTotals.engagementCurrent / kpiTotals.engagementTarget) +
          (kpiTotals.newFansTarget === 0 ? 0 : kpiTotals.newFansCurrent / kpiTotals.newFansTarget)) /
        3;

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
    activeDistribution: Array.from(activeDistributionMap.values()).sort((a, b) => b.active - a.active || b.lowActive - a.lowActive),
    rankingRows: dealerRankingRows,
    kpiRows,
    kpiQuarter,
    kpiQuarterLabel: kpiQuarter,
    kpiWindow: { start: quarterWindow.start, end: quarterWindow.end },
    activeRate,
    quarterlyKpiCompletion,
  };
}
