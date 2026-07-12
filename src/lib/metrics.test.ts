import { describe, expect, it } from "vitest";
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
});
