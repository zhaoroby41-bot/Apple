import { describe, expect, it } from "vitest";
import { initialKpiTargets, sortKpiTargets } from "./kpiConfig";

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
});
