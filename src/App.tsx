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
      <section className="dashboard-hero">
        <div className="hero-main">
          <div className="brand-mark" aria-hidden="true">
            <span />
          </div>
          <p className="eyebrow">Apple Channel Social Intelligence</p>
          <h1>社交运营数据指挥台</h1>
          <p className="header-copy">以角色权限限定可见数据，再沿经销商、可选大区和门店账号层级持续观察小红书与抖音运营质量。</p>
          <div className="scope-strip">
            <span>{mockDataset.currentUser.role === "apple" ? "Apple 权限：全经销商可见" : "经销商权限：仅本经销商可见"}</span>
            <span>{model.scopeLabel}</span>
            <span>{model.dealerCount} 家经销商</span>
            <span>{model.accountCount} 个账号</span>
            <span>Mock date {mockDataset.mockToday}</span>
          </div>
        </div>
        <div className="hero-metrics" aria-label="Network summary">
          <div className="hero-stat">
            <span>Dealers</span>
            <strong>{mockDataset.dealers.length}</strong>
            <small>经销商网络</small>
          </div>
          <div className="hero-stat">
            <span>Stores</span>
            <strong>{mockDataset.accounts.length}</strong>
            <small>门店专业号</small>
          </div>
          <div className="hero-stat hero-stat-wide">
            <span>Platforms</span>
            <strong>2</strong>
            <small>小红书 / 抖音</small>
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
