import { describe, expect, it } from "vitest";
import { initialDealerGroups, initialKpiTargets, sortKpiTargets } from "./kpiConfig";

describe("kpiConfig", () => {
  it("sorts KPI targets by recent quarter then dealer group order", () => {
    const rows = sortKpiTargets(initialKpiTargets);

    expect(rows.slice(0, 4).map((row) => `${row.quarter}-${row.groupName}`)).toEqual([
      "2026Q3-一组",
      "2026Q3-二组",
      "2026Q3-三组",
      "2026Q3-四组",
    ]);
    expect(rows.slice(4, 8).map((row) => `${row.quarter}-${row.groupName}`)).toEqual([
      "2026Q2-一组",
      "2026Q2-二组",
      "2026Q2-三组",
      "2026Q2-四组",
    ]);
  });

  it("assigns all 55 dealers to KPI groups without duplicates", () => {
    const dealerIds = initialDealerGroups.flatMap((group) => group.dealerIds);

    expect(dealerIds).toHaveLength(55);
    expect(new Set(dealerIds)).toHaveLength(55);
    expect(dealerIds[0]).toBe("dealer-1");
    expect(dealerIds[dealerIds.length - 1]).toBe("dealer-55");
  });
});
