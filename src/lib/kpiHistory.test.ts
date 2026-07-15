import { describe, expect, it } from "vitest";
import { mockDataset } from "../data/mockData";
import type { DashboardFilters, EngagementMetricKey, QuarterKey } from "../types";
import { buildDealerKpiHistoryRows, isSingleDealerKpiView } from "./kpiHistory";
import { buildDashboardModel } from "./metrics";

const dealerFilters: DashboardFilters = {
  platform: "all",
  period: "30d",
  regionId: "all",
  dealerId: "all",
  accountId: "all",
  scopeNodeIds: ["dealer:dealer-3"],
};

const metric: EngagementMetricKey = "engagement";
const quarters: QuarterKey[] = ["2026Q3", "2026Q2"];

describe("kpiHistory", () => {
  it("detects single dealer KPI views from KPI rows", () => {
    const singleDealer = buildDashboardModel(mockDataset, dealerFilters, metric, "2026Q3");
    const allDealers = buildDashboardModel(
      mockDataset,
      { platform: "all", period: "30d", regionId: "all", dealerId: "all", accountId: "all", scopeNodeIds: ["root:all"] },
      metric,
      "2026Q3",
    );

    expect(isSingleDealerKpiView(singleDealer.kpiRows)).toBe(true);
    expect(isSingleDealerKpiView(allDealers.kpiRows)).toBe(false);
  });

  it("builds current and historical KPI rows for a selected dealer", () => {
    const rows = buildDealerKpiHistoryRows(mockDataset, dealerFilters, metric, quarters);

    expect(rows.map((row) => row.quarter)).toEqual(["2026Q3", "2026Q2"]);
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.id)).size).toBe(2);
    expect(new Set(rows.map((row) => row.dealerId))).toEqual(new Set(["dealer-3"]));
    expect(rows[0].readsCurrent).not.toBe(rows[1].readsCurrent);
    expect(rows.every((row) => row.readsCompletion > 0 && row.engagementCompletion > 0 && row.newFansCompletion > 0)).toBe(true);
  });
});
