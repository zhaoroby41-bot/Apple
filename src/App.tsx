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
        <div className="command-summary" aria-label="Current scope summary">
          <div>
            <span>权限</span>
            <strong>{mockDataset.currentUser.role === "apple" ? "Apple 全域" : "经销商"}</strong>
          </div>
          <div>
            <span>范围</span>
            <strong>{model.scopeLabel}</strong>
          </div>
          <div>
            <span>覆盖</span>
            <strong>{model.dealerCount} 家 / {model.accountCount} 号</strong>
          </div>
          <div>
            <span>周期锚点</span>
            <strong>{mockDataset.mockToday}</strong>
          </div>
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
