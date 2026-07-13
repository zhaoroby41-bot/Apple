import { describe, expect, it } from "vitest";
import { mockDataset } from "../data/mockData";
import { buildDashboardModel, getPeriodWindow, sumEngagement } from "./metrics";

describe("metrics", () => {
  it("returns a 7 day current window and matching previous window", () => {
    const window = getPeriodWindow("7d", "2026-07-12");
    expect(window.currentStart).toBe("2026-07-06");
    expect(window.currentEnd).toBe("2026-07-12");
    expect(window.previousStart).toBe("2026-06-29");
    expect(window.previousEnd).toBe("2026-07-05");
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
    expect(mockDataset.accounts.some((account) => account.regionId === null)).toBe(true);
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

  it("filters dashboard accounts by selected platform", () => {
    const base = { period: "30d" as const, regionId: "all", dealerId: "all", accountId: "all" };
    const all = buildDashboardModel(mockDataset, { ...base, platform: "all" }, "engagement");
    const douyin = buildDashboardModel(mockDataset, { ...base, platform: "douyin" }, "engagement");

    expect(all.accountCount).toBe(200);
    expect(douyin.accountCount).toBe(mockDataset.accounts.filter((account) => account.platform === "douyin").length);
    expect(douyin.accountCount).toBeLessThan(all.accountCount);
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
});
