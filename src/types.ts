export type Platform = "all" | "xiaohongshu" | "douyin";
export type AccountPlatform = Exclude<Platform, "all">;
export type ViewMode = "apple" | "region" | "dealer" | "store";
export type PeriodKey = "7d" | "15d" | "30d" | "3m" | "6m" | "1y";
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
  regionId: string;
  quarterlyKpi: QuarterlyKpi;
}

export interface StoreAccount {
  id: string;
  name: string;
  dealerId: string;
  regionId: string;
  platform: AccountPlatform;
  city: string;
  openDate: string;
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
}

export interface DashboardFilters {
  viewMode: ViewMode;
  platform: Platform;
  period: PeriodKey;
  regionId: string;
  dealerId: string;
  accountId: string;
}
