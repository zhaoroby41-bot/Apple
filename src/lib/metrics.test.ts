import { describe, expect, it } from "vitest";
import { mockDataset } from "../data/mockData";
import { getPeriodWindow, sumEngagement } from "./metrics";

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
});
