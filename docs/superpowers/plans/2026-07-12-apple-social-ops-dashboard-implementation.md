# Apple Social Operations Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable DevExtreme React prototype for Apple social operations reporting across Xiaohongshu and Douyin, using deterministic mock data.

**Architecture:** Create a Vite + React + TypeScript single-page dashboard. Keep mock data generation, metric aggregation, filter state, and visual sections in separate files so the prototype can later be wired to real Xiaohongshu and Douyin APIs without replacing the UI. Use DevExtreme React charts, grids, selectors, and progress components for the primary interface.

**Tech Stack:** React, TypeScript, Vite, DevExtreme React, DevExtreme CSS, local deterministic mock data, Vitest for metric tests.

## Global Constraints

- The prototype must be a runnable frontend app with mock data.
- The dashboard must include Apple, region, dealer, and store account viewing modes.
- The dashboard must include Xiaohongshu, Douyin, and All Platforms filters.
- Period selectors must include 7 days, 15 days, 30 days, 3 months, 6 months, and 1 year.
- Mock data must include 55 dealers and 200 store accounts.
- Mock data must include four regions: East China, South China, North China, Central China, with Chinese labels shown in the UI.
- Mock daily metrics must cover at least 365 days.
- Xiaohongshu remains the primary platform emphasis, while Douyin is included in filters, charts, and data model.
- Visual style must be Apple-inspired: light background, black text, subtle gray hierarchy, restrained blue interaction accent, green/red only for data deltas, panels with 8px or smaller radius, no decorative gradients.
- No real API integration, authentication, backend persistence, export workflow, or scheduled reporting in this prototype.

---

## File Structure

- Create `package.json`: scripts and dependencies.
- Create `index.html`: Vite entry.
- Create `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`: TypeScript and Vite config.
- Create `src/main.tsx`: React entry point and DevExtreme CSS imports.
- Create `src/App.tsx`: dashboard shell, filter state, derived data wiring.
- Create `src/types.ts`: shared domain and UI types.
- Create `src/data/mockData.ts`: deterministic regions, dealers, store accounts, daily metrics, and KPI targets.
- Create `src/lib/metrics.ts`: pure metric aggregation, period comparison, impact, activity, ranking, and KPI calculations.
- Create `src/lib/format.ts`: number and percent formatting helpers.
- Create `src/components/FilterBar.tsx`: shared controls.
- Create `src/components/KpiOverview.tsx`: KPI cards.
- Create `src/components/FanTrendSection.tsx`: fan chart, summary, impact DataGrid.
- Create `src/components/EngagementTrendSection.tsx`: engagement chart, metric switcher, summary, impact DataGrid.
- Create `src/components/ActiveAccountsSection.tsx`: active distribution chart and ranking DataGrid.
- Create `src/components/KpiManagementSection.tsx`: grouped quarterly KPI DataGrid.
- Create `src/styles.css`: Apple-inspired dashboard styling and responsive layout.
- Create `src/lib/metrics.test.ts`: tests for aggregation and comparison logic.

---

### Task 1: Project Scaffold And Mock Domain Model

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/types.ts`
- Create: `src/data/mockData.ts`
- Create: `src/styles.css`

**Interfaces:**
- Produces: `mockDataset: MockDataset`
- Produces: `type Platform = "all" | "xiaohongshu" | "douyin"`
- Produces: `type ViewMode = "apple" | "region" | "dealer" | "store"`
- Produces: `type PeriodKey = "7d" | "15d" | "30d" | "3m" | "6m" | "1y"`
- Produces: `type MockDataset = { regions: Region[]; dealers: Dealer[]; accounts: StoreAccount[]; dailyMetrics: DailyMetric[]; mockToday: string }`

- [ ] **Step 1: Create package and config files**

`package.json`:

```json
{
  "name": "apple-social-ops-dashboard",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "test": "vitest run",
    "preview": "vite preview --host 127.0.0.1"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "devextreme": "^24.2.3",
    "devextreme-react": "^24.2.3",
    "lucide-react": "^0.468.0",
    "vite": "^6.0.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

`index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Apple Social Operations Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 2: Create shared types**

`src/types.ts`:

```ts
export type Platform = "all" | "xiaohongshu" | "douyin";
export type AccountPlatform = Exclude<Platform, "all">;
export type ViewMode = "apple" | "region" | "dealer" | "store";
export type PeriodKey = "7d" | "15d" | "30d" | "3m" | "6m" | "1y";
export type EngagementMetricKey =
  | "engagement"
  | "readsOrViews"
  | "likes"
  | "collections"
  | "comments"
  | "shares";

export interface Region {
  id: string;
  name: string;
  label: string;
}

export interface QuarterlyKpi {
  readsOrViews: number;
  engagement: number;
  newFans: number;
}

export interface Dealer {
  id: string;
  name: string;
  regionId: string;
  quarterlyKpi: QuarterlyKpi;
}

export interface StoreAccount {
  id: string;
  name: string;
  dealerId: string;
  regionId: string;
  platform: AccountPlatform;
  city: string;
  openDate: string;
}

export interface DailyMetric {
  accountId: string;
  date: string;
  fans: number;
  newFans: number;
  contentCount: number;
  readsOrViews: number;
  likes: number;
  collections: number;
  comments: number;
  shares: number;
}

export interface MockDataset {
  regions: Region[];
  dealers: Dealer[];
  accounts: StoreAccount[];
  dailyMetrics: DailyMetric[];
  mockToday: string;
}

export interface DashboardFilters {
  viewMode: ViewMode;
  platform: Platform;
  period: PeriodKey;
  regionId: string;
  dealerId: string;
  accountId: string;
}
```

- [ ] **Step 3: Create deterministic mock data**

`src/data/mockData.ts` must define four regions, generate 55 dealers, distribute 200 accounts, make Xiaohongshu roughly 70% of accounts, create 365 daily metrics ending on `2026-07-12`, and export `mockDataset`.

- [ ] **Step 4: Create minimal app shell**

`src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "devextreme/dist/css/dx.light.css";
import "./styles.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`:

```tsx
import { mockDataset } from "./data/mockData";

export default function App() {
  return (
    <main className="app-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Apple Social Operations</p>
          <h1>小红书与抖音运营数据看板</h1>
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
    </main>
  );
}
```

- [ ] **Step 5: Add base styles**

`src/styles.css` must set system fonts, light background, black text, white panels, 8px radius, responsive spacing, and no decorative gradients.

- [ ] **Step 6: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 7: Verify scaffold**

Run: `npm run build`

Expected: TypeScript and Vite build complete without errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src
git commit -m "feat: scaffold dashboard prototype"
```

---

### Task 2: Metric Aggregation And Tests

**Files:**
- Create: `src/lib/metrics.ts`
- Create: `src/lib/format.ts`
- Create: `src/lib/metrics.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `MockDataset`, `DashboardFilters`, `EngagementMetricKey`
- Produces: `getPeriodWindow(period: PeriodKey, today: string): PeriodWindow`
- Produces: `filterAccounts(dataset: MockDataset, filters: DashboardFilters): StoreAccount[]`
- Produces: `buildDashboardModel(dataset: MockDataset, filters: DashboardFilters, metric: EngagementMetricKey): DashboardModel`
- Produces: `formatCompactNumber(value: number): string`
- Produces: `formatPercent(value: number): string`

- [ ] **Step 1: Add test script support**

Keep `package.json` script `"test": "vitest run"` from Task 1.

- [ ] **Step 2: Write failing metric tests**

`src/lib/metrics.test.ts` should assert:

```ts
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
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test`

Expected: FAIL because `src/lib/metrics.ts` does not exist.

- [ ] **Step 4: Implement metric functions**

`src/lib/metrics.ts` must include:

- period day mapping: 7, 15, 30, 90, 180, 365.
- inclusive current and previous date windows.
- account filtering by platform, region, dealer, and account.
- aggregation for fans, content count, new fans, reads/views, likes, collections, comments, shares, and engagement.
- period-over-period delta and percent.
- trend rows by date.
- account impact rows sorted by absolute delta descending.
- active status and active rate.
- KPI completion by account and dealer.

- [ ] **Step 5: Implement format helpers**

`src/lib/format.ts`:

```ts
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}
```

- [ ] **Step 6: Run tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 7: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib package.json
git commit -m "feat: add dashboard metric model"
```

---

### Task 3: Filters And KPI Overview

**Files:**
- Create: `src/components/FilterBar.tsx`
- Create: `src/components/KpiOverview.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `DashboardFilters`, `MockDataset`, `DashboardModel`
- Produces: `FilterBar(props: FilterBarProps): JSX.Element`
- Produces: `KpiOverview(props: { model: DashboardModel }): JSX.Element`

- [ ] **Step 1: Implement filter bar**

Use DevExtreme `SelectBox` controls for view mode, platform, period, region, dealer, and store account. Dealer options must narrow when a region is selected. Store account options must narrow when a dealer is selected.

- [ ] **Step 2: Implement KPI overview**

Render five cards:

- 粉丝总量
- 作品数量
- 互动总量
- 活跃账号率
- 季度 KPI 完成率

Each card shows current value, percent delta where relevant, and absolute delta text.

- [ ] **Step 3: Wire filter state in App**

`src/App.tsx` should:

- initialize filters to Apple, All Platforms, 30 days, all scopes.
- keep selected engagement metric in state for later tasks.
- compute `model = buildDashboardModel(mockDataset, filters, engagementMetric)`.
- render `FilterBar` and `KpiOverview`.

- [ ] **Step 4: Style controls and KPI cards**

Add responsive grid styles. KPI cards must not shift height when values change.

- [ ] **Step 5: Verify**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/FilterBar.tsx src/components/KpiOverview.tsx src/styles.css
git commit -m "feat: add dashboard filters and KPI overview"
```

---

### Task 4: Trend Sections And Impact Tables

**Files:**
- Create: `src/components/FanTrendSection.tsx`
- Create: `src/components/EngagementTrendSection.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `DashboardModel`
- Produces: `FanTrendSection(props: { model: DashboardModel }): JSX.Element`
- Produces: `EngagementTrendSection(props: { model: DashboardModel; metric: EngagementMetricKey; onMetricChange: (metric: EngagementMetricKey) => void }): JSX.Element`

- [ ] **Step 1: Implement fan trend section**

Use DevExtreme `Chart` for fan trend and `DataGrid` for fan impact accounts. Tooltip must show date and fan count. Summary copy must include selected-period total fans, absolute difference, and percent change.

- [ ] **Step 2: Implement engagement trend section**

Use DevExtreme `Chart`, a metric switcher, and `DataGrid`. The metric switcher must support engagement, reads/views, likes, collections, comments, and shares.

- [ ] **Step 3: Wire sections into App**

Place fan trend above engagement trend. Use two-column layouts on desktop and stacked layouts on narrow screens.

- [ ] **Step 4: Verify**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/FanTrendSection.tsx src/components/EngagementTrendSection.tsx src/styles.css
git commit -m "feat: add trend analysis sections"
```

---

### Task 5: Active Accounts And Quarterly KPI Management

**Files:**
- Create: `src/components/ActiveAccountsSection.tsx`
- Create: `src/components/KpiManagementSection.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `DashboardModel`
- Produces: `ActiveAccountsSection(props: { model: DashboardModel }): JSX.Element`
- Produces: `KpiManagementSection(props: { model: DashboardModel }): JSX.Element`

- [ ] **Step 1: Implement active account distribution**

Use DevExtreme `Chart` to show active, low-active, and inactive account counts grouped by region and platform.

- [ ] **Step 2: Implement active ranking grid**

Use DevExtreme `DataGrid` sorted by engagement descending. Include rank, account, platform, region, dealer, content count, new fans, reads/views, engagement, and active status.

- [ ] **Step 3: Implement KPI management grid**

Use DevExtreme `DataGrid` grouped by region and dealer. Include target, current, completion percent, progress bars, and status for reads/views, engagement, new fans, and overall completion.

- [ ] **Step 4: Wire sections into App**

Place active accounts before quarterly KPI management.

- [ ] **Step 5: Verify**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/ActiveAccountsSection.tsx src/components/KpiManagementSection.tsx src/styles.css
git commit -m "feat: add active account and KPI management sections"
```

---

### Task 6: Responsive Polish And Runtime Verification

**Files:**
- Modify: `src/styles.css`
- Modify: `src/App.tsx`
- Modify: relevant component files if visual QA finds text overflow or layout issues.

**Interfaces:**
- Consumes: all previous dashboard components.
- Produces: final runnable prototype.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: both commands PASS.

- [ ] **Step 2: Start local dev server**

Run: `npm run dev`

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 3: Browser QA**

Open the local URL and verify:

- Dashboard renders with 55 dealers and 200 accounts.
- Apple, region, dealer, and store account view modes update data.
- Xiaohongshu, Douyin, and All Platforms filters update data.
- 7 days, 15 days, 30 days, 3 months, 6 months, and 1 year periods update trend and comparison values.
- Chart tooltips appear on hover.
- DataGrid sorting works.
- Quarterly KPI progress bars are visible.
- No text overlaps in desktop and mobile widths.

- [ ] **Step 4: Polish visual issues**

Fix any discovered spacing, text overflow, chart height, or mobile stacking issues in `src/styles.css` and component markup.

- [ ] **Step 5: Run final verification**

Run:

```bash
npm test
npm run build
```

Expected: both commands PASS.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "polish: finalize dashboard prototype"
```

---

## Self-Review

- Spec coverage: The plan covers runnable frontend app, DevExtreme React, mock 55 dealers and 200 accounts, Apple/region/dealer/store views, Xiaohongshu/Douyin filters, period selectors, KPI overview, fan trend, engagement trend, active account distribution, ranking, KPI management, Apple-inspired styling, and verification.
- Placeholder scan: No unresolved placeholder steps remain.
- Type consistency: Shared types are defined in Task 1 and consumed by later tasks. Metric model is defined in Task 2 and consumed by all visual tasks.
- Scope check: The plan remains a single prototype, not a multi-system build. Real APIs, auth, backend, and exports are explicitly excluded.
