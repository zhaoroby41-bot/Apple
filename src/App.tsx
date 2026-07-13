import { useMemo, useState } from "react";
import { ActiveAccountsSection } from "./components/ActiveAccountsSection";
import { EngagementTrendSection } from "./components/EngagementTrendSection";
import { FilterBar } from "./components/FilterBar";
import { FanTrendSection } from "./components/FanTrendSection";
import { KpiManagementSection } from "./components/KpiManagementSection";
import { KpiOverview } from "./components/KpiOverview";
import { OrganizationScopeTree } from "./components/OrganizationScopeTree";
import { mockDataset } from "./data/mockData";
import { buildDashboardModel } from "./lib/metrics";
import type { DashboardFilters, EngagementMetricKey } from "./types";

const initialFilters: DashboardFilters = {
  platform: "all",
  period: "30d",
  regionId: "all",
  dealerId: mockDataset.currentUser.role === "dealer" && mockDataset.currentUser.dealerId ? mockDataset.currentUser.dealerId : "all",
  accountId: "all",
};

export default function App() {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [engagementMetric, setEngagementMetric] = useState<EngagementMetricKey>("engagement");
  const model = useMemo(() => buildDashboardModel(mockDataset, filters, engagementMetric), [filters, engagementMetric]);

  return (
    <main className="app-shell">
      <section className="command-header">
        <div className="command-title">
          <div className="brand-mark" aria-hidden="true"><span /></div>
          <div>
            <p className="eyebrow">Apple Channel Social Intelligence</p>
            <h1>社交运营数据指挥台</h1>
            <p className="header-copy">按登录权限限定数据范围，沿经销商、经销商大区和门店账号追踪运营质量。</p>
          </div>
        </div>
        <div className="command-context" aria-label="Current data context">
          <span>{mockDataset.currentUser.role === "apple" ? "Apple 全域可见" : "经销商权限"}</span>
          <span>{model.scopeLabel}</span>
          <span>{model.dealerCount} 家经销商 / {model.accountCount} 个账号</span>
          <span>数据截至 {mockDataset.mockToday}</span>
        </div>
      </section>
      <FilterBar dataset={mockDataset} filters={filters} onChange={setFilters} />
      <div className="dashboard-workspace">
        <OrganizationScopeTree dataset={mockDataset} filters={filters} onChange={setFilters} />
        <div className="dashboard-content">
          <KpiOverview model={model} />
          <FanTrendSection model={model} />
          <EngagementTrendSection model={model} metric={engagementMetric} onMetricChange={setEngagementMetric} />
          <ActiveAccountsSection model={model} />
          <KpiManagementSection model={model} />
        </div>
      </div>
    </main>
  );
}
