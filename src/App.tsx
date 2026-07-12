import { useMemo, useState } from "react";
import { ActiveAccountsSection } from "./components/ActiveAccountsSection";
import { EngagementTrendSection } from "./components/EngagementTrendSection";
import { FilterBar } from "./components/FilterBar";
import { FanTrendSection } from "./components/FanTrendSection";
import { KpiManagementSection } from "./components/KpiManagementSection";
import { KpiOverview } from "./components/KpiOverview";
import { mockDataset } from "./data/mockData";
import { buildDashboardModel } from "./lib/metrics";
import type { DashboardFilters, EngagementMetricKey } from "./types";

const initialFilters: DashboardFilters = {
  viewMode: "apple",
  platform: "all",
  period: "30d",
  regionId: "all",
  dealerId: "all",
  accountId: "all",
};

export default function App() {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [engagementMetric, setEngagementMetric] = useState<EngagementMetricKey>("engagement");
  const model = useMemo(() => buildDashboardModel(mockDataset, filters, engagementMetric), [filters, engagementMetric]);

  return (
    <main className="app-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Apple Social Operations</p>
          <h1>小红书与抖音运营数据看板</h1>
          <p className="header-copy">
            当前范围：{model.scopeLabel} · {model.dealerCount} 家经销商 · {model.accountCount} 个账号
          </p>
        </div>
        <div className="header-stat">
          <span>经销商</span>
          <strong>{mockDataset.dealers.length}</strong>
        </div>
        <div className="header-stat">
          <span>门店账号</span>
          <strong>{mockDataset.accounts.length}</strong>
        </div>
      </section>
      <FilterBar dataset={mockDataset} filters={filters} onChange={setFilters} />
      <KpiOverview model={model} />
      <FanTrendSection model={model} />
      <EngagementTrendSection model={model} metric={engagementMetric} onMetricChange={setEngagementMetric} />
      <ActiveAccountsSection model={model} />
      <KpiManagementSection model={model} />
    </main>
  );
}
