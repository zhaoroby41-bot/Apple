import type { AccountPlatform, DailyMetric, Dealer, MockDataset, Region, StoreAccount } from "../types";

const mockToday = "2026-07-12";

const regions: Region[] = [
  { id: "east", name: "East China", label: "华东" },
  { id: "south", name: "South China", label: "华南" },
  { id: "north", name: "North China", label: "华北" },
  { id: "central", name: "Central China", label: "华中" },
];

const cityByRegion: Record<string, string[]> = {
  east: ["上海", "杭州", "南京", "苏州", "宁波"],
  south: ["广州", "深圳", "厦门", "佛山", "珠海"],
  north: ["北京", "天津", "青岛", "济南", "石家庄"],
  central: ["武汉", "长沙", "郑州", "合肥", "南昌"],
};

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function isoDateDaysBefore(endDate: string, daysBefore: number) {
  const date = new Date(`${endDate}T00:00:00`);
  date.setDate(date.getDate() - daysBefore);
  return date.toISOString().slice(0, 10);
}

function createDealers(): Dealer[] {
  const names = [
    "星辰数码", "远景零售", "启新科技", "卓越体验", "云端数码", "诚品零售", "新联科技", "都会优选", "智享生活", "天际零售", "朗悦数码",
  ];

  return Array.from({ length: 55 }, (_, index) => {
    const scale = 0.85 + (index % 7) * 0.08;
    return {
      id: `dealer-${index + 1}`,
      name: `${names[index % names.length]} ${String(index + 1).padStart(2, "0")}`,
      hasRegionLayer: index === 0 || index % 5 !== 0,
      quarterlyKpi: {
        readsOrViews: Math.round(720000 * scale),
        engagement: Math.round(68000 * scale),
        newFans: Math.round(9200 * scale),
      },
    };
  });
}

function createAccounts(dealers: Dealer[]): StoreAccount[] {
  const accounts: StoreAccount[] = [];
  const accountCounts = dealers.map((_, index) => {
    if (index === 0) return 20;
    if (index === 1) return 12;
    if (index === 2) return 10;
    if (index >= 3 && index <= 12) return 5;
    if (index >= 13 && index <= 36) return 3;
    return 2;
  });
  let globalIndex = 0;

  dealers.forEach((dealer, dealerIndex) => {
    for (let localIndex = 0; localIndex < accountCounts[dealerIndex]; localIndex += 1) {
      let region: Region | null = null;
      if (dealer.hasRegionLayer) {
        if (dealerIndex === 0) {
          const firstDealerRegions = [
            ...Array(5).fill("central"),
            ...Array(3).fill("south"),
            ...Array(10).fill("north"),
            ...Array(2).fill("east"),
          ];
          region = regions.find((item) => item.id === firstDealerRegions[localIndex]) ?? regions[0];
        } else {
          region = regions[(dealerIndex + localIndex) % regions.length];
        }
      }
      const cities = region ? cityByRegion[region.id] : ["直营网点", "城市旗舰店", "购物中心店", "授权体验店"];
      const platform: AccountPlatform = globalIndex % 10 < 7 ? "xiaohongshu" : "douyin";
      accounts.push({
        id: `account-${globalIndex + 1}`,
        name: `${cities[localIndex % cities.length]} Apple ${platform === "xiaohongshu" ? "小红书" : "抖音"}门店号 ${String(globalIndex + 1).padStart(3, "0")}`,
        dealerId: dealer.id,
        regionId: region?.id ?? null,
        platform,
        city: cities[localIndex % cities.length],
        openDate: isoDateDaysBefore(mockToday, 365 + (globalIndex % 180)),
      });
      globalIndex += 1;
    }
  });
  return accounts;
}

function createDailyMetrics(accounts: StoreAccount[]): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  const random = seededRandom(20260712);

  accounts.forEach((account, accountIndex) => {
    const platformBoost = account.platform === "xiaohongshu" ? 1 : 1.18;
    const accountScale = 0.65 + (accountIndex % 13) * 0.075;
    const currentPeriodProfile = accountIndex % 17 === 0 ? "inactive" : accountIndex % 11 === 0 || accountIndex % 13 === 0 ? "low" : "normal";
    let fans = Math.round(2100 + accountIndex * 19 + random() * 1400);

    for (let day = 364; day >= 0; day -= 1) {
      const date = isoDateDaysBefore(mockToday, day);
      const weekday = new Date(`${date}T00:00:00`).getDay();
      const campaignPulse = day < 45 && accountIndex % 9 === 0 ? 1.55 : 1;
      const quietAccount = accountIndex % 23 === 0 ? 0.32 : 1;
      const isCurrentPeriod = day < 30;
      const suppressed = isCurrentPeriod && currentPeriodProfile === "inactive";
      const lowActivity = isCurrentPeriod && currentPeriodProfile === "low";
      const contentThreshold = lowActivity ? 0.92 : 0.58;
      const activityScale = suppressed ? 0 : lowActivity ? 0.1 : 1;
      const contentCount = suppressed ? 0 : random() > contentThreshold ? 1 + (lowActivity ? 0 : random() > 0.9 ? 1 : 0) : 0;
      const readsBase = contentCount ? 2200 + random() * 9500 : suppressed ? 0 : random() * 900;
      const readsOrViews = Math.round(readsBase * platformBoost * accountScale * campaignPulse * quietAccount * activityScale);
      const likes = Math.round(readsOrViews * (0.035 + random() * 0.035));
      const collections = account.platform === "xiaohongshu" ? Math.round(readsOrViews * (0.012 + random() * 0.02)) : 0;
      const comments = Math.round(readsOrViews * (0.004 + random() * 0.012));
      const shares = Math.round(readsOrViews * (0.003 + random() * 0.01));
      const newFans = suppressed ? 0 : Math.max(0, Math.round(readsOrViews * (0.002 + random() * 0.004) + (weekday === 5 ? 8 : 0) * activityScale));
      fans += newFans;

      metrics.push({
        accountId: account.id,
        date,
        fans,
        newFans,
        contentCount,
        readsOrViews,
        likes,
        collections,
        comments,
        shares,
      });
    }
  });

  return metrics;
}

const dealers = createDealers();
const accounts = createAccounts(dealers);

export const mockDataset: MockDataset = {
  regions,
  dealers,
  accounts,
  dailyMetrics: createDailyMetrics(accounts),
  mockToday,
  currentUser: {
    id: "user-apple-ops",
    name: "Apple 渠道运营",
    role: "apple",
  },
};
