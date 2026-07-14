import { describe, expect, it } from "vitest";
import { mockDataset } from "../data/mockData";
import { buildDashboardModel, getPeriodWindow, sumEngagement } from "./metrics";

describe("metrics", () => {
  it("returns a 60 day current window and matching previous window", () => {
    const window = getPeriodWindow("60d", "2026-07-12");
    expect(window.currentStart).toBe("2026-05-14");
    expect(window.currentEnd).toBe("2026-07-12");
    expect(window.previousStart).toBe("2026-03-15");
    expect(window.previousEnd).toBe("2026-05-13");
  });

  it("sums engagement with collections included", () => {
    expect(sumEngagement({ likes: 10, collections: 4, comments: 3, shares: 2 })).toBe(19);
  });

  it("models dealer-owned optional regions under store accounts", () => {
    const firstDealerAccounts = mockDataset.accounts.filter((account) => account.dealerId === "dealer-1");
    const countsByRegion = firstDealerAccounts.reduce<Record<string, number>>((counts, account) => {
      const key = account.regionId ?? "direct";
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});

    expect(firstDealerAccounts).toHaveLength(20);
    expect(countsByRegion.central).toBe(5);
    expect(countsByRegion.south).toBe(3);
    expect(countsByRegion.north).toBe(10);
    expect(countsByRegion.east).toBe(2);
    expect(mockDataset.accounts.filter((account) => account.dealerId !== "dealer-1").every((account) => account.regionId === null)).toBe(true);
  });

  it("models quarterly KPI report at dealer group grain", () => {
    const model = buildDashboardModel(
      mockDataset,
      { platform: "all", period: "30d", regionId: "all", dealerId: "all", accountId: "all" },
      "engagement",
    );
    const countsByGroup = model.kpiRows.reduce<Record<string, number>>((counts, row) => {
      counts[row.kpiGroup] = (counts[row.kpiGroup] ?? 0) + 1;
      return counts;
    }, {});

    expect(model.kpiRows).toHaveLength(55);
    expect(countsByGroup["一组"]).toBe(5);
    expect(countsByGroup["二组"]).toBe(11);
    expect(countsByGroup["三组"]).toBe(21);
    expect(countsByGroup["四组"]).toBe(18);

    const rowsByGroup = model.kpiRows.reduce<Record<string, typeof model.kpiRows>>((groups, row) => {
      groups[row.kpiGroup] = [...(groups[row.kpiGroup] ?? []), row];
      return groups;
    }, {});

    Object.values(rowsByGroup).forEach((rows) => {
      expect(new Set(rows.map((row) => row.readsTarget))).toHaveLength(1);
      expect(new Set(rows.map((row) => row.engagementTarget))).toHaveLength(1);
      expect(new Set(rows.map((row) => row.newFansTarget))).toHaveLength(1);
    });
    rowsByGroup["一组"].forEach((row) => {
      expect(row.readsTarget).toBe(3600000);
      expect(row.engagementTarget).toBe(340000);
      expect(row.newFansTarget).toBe(46000);
    });
  });

  it("switches KPI rows by selected quarter", () => {
    const filters = { platform: "all" as const, period: "30d" as const, regionId: "all", dealerId: "all", accountId: "all" };
    const q2 = buildDashboardModel(mockDataset, filters, "engagement", "2026Q2");
    const q3 = buildDashboardModel(mockDataset, filters, "engagement", "2026Q3");

    expect(q2.kpiQuarterLabel).toBe("2026Q2");
    expect(q2.kpiWindow).toEqual({ start: "2026-04-01", end: "2026-06-30" });
    expect(q3.kpiWindow).toEqual({ start: "2026-07-01", end: "2026-07-12" });
    expect(q2.kpiRows[0].readsCurrent).not.toBe(q3.kpiRows[0].readsCurrent);
  });

  it("includes previous-quarter performance and quarter-over-quarter deltas in KPI rows", () => {
    const model = buildDashboardModel(
      mockDataset,
      { platform: "all", period: "30d", regionId: "all", dealerId: "all", accountId: "all" },
      "engagement",
      "2026Q3",
    );
    const row = model.kpiRows[0];

    expect(row.readsPreviousQuarter).toBeGreaterThan(0);
    expect(row.engagementPreviousQuarter).toBeGreaterThan(0);
    expect(row.newFansPreviousQuarter).toBeGreaterThan(0);
    expect(row.readsQuarterPercent).toBe((row.readsCurrent - row.readsPreviousQuarter) / row.readsPreviousQuarter);
    expect(row.engagementQuarterPercent).toBe((row.engagementCurrent - row.engagementPreviousQuarter) / row.engagementPreviousQuarter);
    expect(row.newFansQuarterPercent).toBe((row.newFansCurrent - row.newFansPreviousQuarter) / row.newFansPreviousQuarter);
  });

  it("models realistic KPI completion distribution by dealer group", () => {
    const model = buildDashboardModel(
      mockDataset,
      { platform: "all", period: "30d", regionId: "all", dealerId: "all", accountId: "all" },
      "engagement",
      "2026Q3",
    );
    const rowsByGroup = model.kpiRows.reduce<Record<string, typeof model.kpiRows>>((groups, row) => {
      groups[row.kpiGroup] = [...(groups[row.kpiGroup] ?? []), row];
      return groups;
    }, {});
    const completion = (row: (typeof model.kpiRows)[number]) => row.overallCompletion;
    const average = (rows: typeof model.kpiRows) => rows.reduce((sum, row) => sum + completion(row), 0) / rows.length;
    const countAtLeast = (rows: typeof model.kpiRows, threshold: number) => rows.filter((row) => completion(row) >= threshold).length;
    const countBelow = (rows: typeof model.kpiRows, threshold: number) => rows.filter((row) => completion(row) < threshold).length;
    const metricCompletionSpread = (rows: typeof model.kpiRows) => {
      const reads = rows.reduce((sum, row) => sum + row.readsCurrent, 0) / rows.reduce((sum, row) => sum + row.readsTarget, 0);
      const engagement = rows.reduce((sum, row) => sum + row.engagementCurrent, 0) / rows.reduce((sum, row) => sum + row.engagementTarget, 0);
      const newFans = rows.reduce((sum, row) => sum + row.newFansCurrent, 0) / rows.reduce((sum, row) => sum + row.newFansTarget, 0);
      return Math.max(reads, engagement, newFans) - Math.min(reads, engagement, newFans);
    };

    expect(countAtLeast(rowsByGroup["一组"], 1)).toBeGreaterThan(rowsByGroup["一组"].length / 2);
    expect(countAtLeast(rowsByGroup["一组"], 1.1)).toBeGreaterThanOrEqual(1);

    expect(countAtLeast(rowsByGroup["二组"], 0.6)).toBeGreaterThan(rowsByGroup["二组"].length / 2);
    expect(countAtLeast(rowsByGroup["二组"], 1)).toBeGreaterThanOrEqual(1);
    expect(countBelow(rowsByGroup["二组"], 0.6)).toBeGreaterThanOrEqual(1);

    expect(countAtLeast(rowsByGroup["三组"], 0.6)).toBeGreaterThan(rowsByGroup["三组"].length / 2);
    expect(countBelow(rowsByGroup["三组"], 0.6)).toBeGreaterThanOrEqual(1);

    expect(countBelow(rowsByGroup["四组"], 0.6)).toBeGreaterThan(rowsByGroup["四组"].length / 2);
    expect(countAtLeast(rowsByGroup["四组"], 0.6)).toBeGreaterThanOrEqual(1);

    expect(average(rowsByGroup["一组"])).toBeGreaterThan(average(rowsByGroup["二组"]));
    expect(average(rowsByGroup["二组"])).toBeGreaterThan(average(rowsByGroup["三组"]));
    expect(average(rowsByGroup["三组"])).toBeGreaterThan(average(rowsByGroup["四组"]));
    Object.values(rowsByGroup).forEach((rows) => {
      expect(metricCompletionSpread(rows)).toBeGreaterThanOrEqual(0.06);
    });
  });

  it("filters dashboard accounts by selected platform", () => {
    const base = { period: "30d" as const, regionId: "all", dealerId: "all", accountId: "all" };
    const all = buildDashboardModel(mockDataset, { ...base, platform: "all" }, "engagement");
    const douyin = buildDashboardModel(mockDataset, { ...base, platform: "douyin" }, "engagement");

    expect(all.accountCount).toBe(200);
    expect(douyin.accountCount).toBe(mockDataset.accounts.filter((account) => account.platform === "douyin").length);
    expect(douyin.accountCount).toBeLessThan(all.accountCount);
  });

  it("aggregates trend charts into a single all-platform series when all platforms are selected", () => {
    const base = { period: "30d" as const, regionId: "all", dealerId: "all", accountId: "all" };
    const all = buildDashboardModel(mockDataset, { ...base, platform: "all" }, "engagement");
    const xiaohongshu = buildDashboardModel(mockDataset, { ...base, platform: "xiaohongshu" }, "engagement");
    const douyin = buildDashboardModel(mockDataset, { ...base, platform: "douyin" }, "engagement");
    const date = all.fanTrend[0].date;
    const allPoint = all.fanTrend.find((point) => point.date === date);
    const xiaohongshuPoint = xiaohongshu.fanTrend.find((point) => point.date === date);
    const douyinPoint = douyin.fanTrend.find((point) => point.date === date);

    expect(new Set(all.fanTrend.map((point) => point.platform))).toEqual(new Set(["all"]));
    expect(allPoint?.fans).toBe((xiaohongshuPoint?.fans ?? 0) + (douyinPoint?.fans ?? 0));
    expect(allPoint?.engagement).toBe((xiaohongshuPoint?.engagement ?? 0) + (douyinPoint?.engagement ?? 0));
  });

  it("filters dashboard accounts by multiple dealer and region scope nodes", () => {
    const model = buildDashboardModel(
      mockDataset,
      {
        platform: "all",
        period: "30d",
        regionId: "all",
        dealerId: "all",
        accountId: "all",
        scopeNodeIds: ["dealer:dealer-2", "region:dealer-1:north"],
      },
      "engagement",
    );
    const expectedCount = mockDataset.accounts.filter(
      (account) => account.dealerId === "dealer-2" || (account.dealerId === "dealer-1" && account.regionId === "north"),
    ).length;

    expect(model.accountCount).toBe(expectedCount);
    expect(model.dealerCount).toBe(2);
  });

  it("filters KPI report rows by selected platform", () => {
    const base = { period: "30d" as const, regionId: "all", dealerId: "all", accountId: "all" };
    const xiaohongshu = buildDashboardModel(mockDataset, { ...base, platform: "xiaohongshu" }, "engagement", "2026Q3");
    const douyin = buildDashboardModel(mockDataset, { ...base, platform: "douyin" }, "engagement", "2026Q3");

    expect(xiaohongshu.kpiRows.reduce((sum, row) => sum + row.accountCount, 0)).toBe(
      mockDataset.accounts.filter((account) => account.platform === "xiaohongshu").length,
    );
    expect(douyin.kpiRows.reduce((sum, row) => sum + row.accountCount, 0)).toBe(
      mockDataset.accounts.filter((account) => account.platform === "douyin").length,
    );
    expect(douyin.kpiRows.length).toBeLessThan(xiaohongshu.kpiRows.length);
  });

  it("models varied account activity instead of every account active", () => {
    const model = buildDashboardModel(
      mockDataset,
      { platform: "all", period: "30d", regionId: "all", dealerId: "all", accountId: "all" },
      "engagement",
    );
    const totals = model.activeDistribution.reduce(
      (sum, row) => ({
        active: sum.active + row.active,
        lowActive: sum.lowActive + row.lowActive,
        inactive: sum.inactive + row.inactive,
      }),
      { active: 0, lowActive: 0, inactive: 0 },
    );

    expect(model.activeRate).toBeLessThan(1);
    expect(totals.lowActive).toBeGreaterThan(0);
    expect(totals.inactive).toBeGreaterThan(0);
  });

  it("ranks dealers by active account count descending", () => {
    const model = buildDashboardModel(
      mockDataset,
      { platform: "all", period: "30d", regionId: "all", dealerId: "all", accountId: "all" },
      "engagement",
    );

    model.rankingRows.slice(1).forEach((row, index) => {
      expect(model.rankingRows[index].activeCount).toBeGreaterThanOrEqual(row.activeCount);
    });
  });

  it("sorts impact rows by current value and avoids zero-current rows", () => {
    const model = buildDashboardModel(
      mockDataset,
      { platform: "all", period: "30d", regionId: "all", dealerId: "all", accountId: "all" },
      "engagement",
    );

    expect(model.engagementImpactRows.every((row) => row.current > 0)).toBe(true);
    model.engagementImpactRows.slice(1).forEach((row, index) => {
      expect(model.engagementImpactRows[index].current).toBeGreaterThanOrEqual(row.current);
    });
    expect(model.engagementImpactRows.some((row) => row.delta > 0)).toBe(true);
    expect(model.engagementImpactRows.some((row) => row.delta < 0)).toBe(true);
  });

  it("builds team impact rows at dealer and region grain", () => {
    const model = buildDashboardModel(
      mockDataset,
      { platform: "all", period: "30d", regionId: "all", dealerId: "all", accountId: "all", scopeNodeIds: ["root:all"] },
      "engagement",
    );

    expect(model.fanTeamImpactRows.length).toBeGreaterThan(0);
    expect(model.engagementTeamImpactRows.length).toBeGreaterThan(0);
    expect(model.fanTeamImpactRows[0]).toMatchObject({ account: "一级经销商55家", teamLevel: "root", impactShare: 1 });
    expect(model.fanTeamImpactRows.some((row) => row.account === "浙江迈风网络科技有限公司" && row.teamLevel === "dealer")).toBe(true);
    expect(model.engagementTeamImpactRows.some((row) => row.account === "华北" && row.dealer === "上海凯知信息科技有限公司" && row.teamLevel === "region")).toBe(true);
    expect(model.engagementTeamImpactRows.some((row) => row.account === "华北大区")).toBe(false);
    expect(model.engagementTeamImpactRows.every((row) => row.current > 0)).toBe(true);
  });
});
