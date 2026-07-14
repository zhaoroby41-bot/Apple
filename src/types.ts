export type Platform = "all" | "xiaohongshu" | "douyin";
export type AccountPlatform = Exclude<Platform, "all">;
export type UserRole = "apple" | "dealer";
export type PeriodKey = "30d" | "60d" | "180d" | "1y";
export type QuarterKey = "2026Q2" | "2026Q3";
export type EngagementMetricKey =
  | "engagement"
  | "readsOrViews"
  | "likes"
  | "collections"
  | "comments"
  | "shares";

export interface Region {
  id: string;
  name: string;
  label: string;
}

export interface QuarterlyKpi {
  readsOrViews: number;
  engagement: number;
  newFans: number;
}

export interface Dealer {
  id: string;
  name: string;
  hasRegionLayer: boolean;
  quarterlyKpi: QuarterlyKpi;
}

export interface StoreAccount {
  id: string;
  name: string;
  dealerId: string;
  regionId: string | null;
  platform: AccountPlatform;
  city: string;
  openDate: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  dealerId?: string;
}

export interface DailyMetric {
  accountId: string;
  date: string;
  fans: number;
  newFans: number;
  contentCount: number;
  readsOrViews: number;
  likes: number;
  collections: number;
  comments: number;
  shares: number;
}

export interface MockDataset {
  regions: Region[];
  dealers: Dealer[];
  accounts: StoreAccount[];
  dailyMetrics: DailyMetric[];
  mockToday: string;
  currentUser: CurrentUser;
}

export interface DashboardFilters {
  platform: Platform;
  period: PeriodKey;
  regionId: string;
  dealerId: string;
  accountId: string;
  scopeNodeIds?: string[];
}
