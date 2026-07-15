import type { DashboardFilters, EngagementMetricKey, MockDataset, QuarterKey } from "../types";
import { buildDashboardModel, type KpiRow } from "./metrics";

export type DealerKpiHistoryRow = KpiRow & {
  quarter: QuarterKey;
};

export function isSingleDealerKpiView(rows: KpiRow[]) {
  return rows.length === 1;
}

export function buildDealerKpiHistoryRows(
  dataset: MockDataset,
  filters: DashboardFilters,
  metric: EngagementMetricKey,
  quarters: QuarterKey[],
): DealerKpiHistoryRow[] {
  return quarters.flatMap((quarter) =>
    buildDashboardModel(dataset, filters, metric, quarter).kpiRows.map((row) => ({
      ...row,
      id: `${quarter}-${row.id}`,
      quarter,
    })),
  );
}
