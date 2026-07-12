# Apple Social Operations Dashboard Prototype Design

## Goal

Build a runnable frontend prototype for Apple social operations reporting across Xiaohongshu and Douyin. The first version uses mock data and focuses on a single-page dashboard that can support Apple-level, region-level, dealer-level, and store-account-level views.

The prototype should help Apple and dealer operators answer five questions:

1. How are total fans, content output, and engagement changing in the selected period?
2. Which platforms, regions, dealers, and store accounts are driving the change?
3. Which accounts are active, inactive, or top ranked?
4. How are dealer quarterly KPIs progressing?
5. Can the same structure support Douyin data later without redesigning the dashboard?

## Scope

Included:

- A runnable frontend prototype using DevExtreme React components.
- Mock data for 55 dealers, 200 store accounts, regions, Xiaohongshu, and Douyin.
- Apple, region, dealer, and store account viewing modes.
- Period selectors for 7 days, 15 days, 30 days, 3 months, 6 months, and 1 year.
- KPI overview, fan trend, engagement trend, active account distribution, active ranking, impact-account tables, and quarterly KPI completion.
- Apple-inspired visual style: restrained, premium, clean, operational, and not decorative.

Not included in this prototype:

- Real Xiaohongshu or Douyin API integration.
- Authentication, permissions, or user management.
- Backend persistence.
- Export, scheduled email, or alert workflows.

## Recommended Approach

Use an "operations cockpit plus drill-down analysis" layout.

The top of the page acts as the command layer: users select scope, platform, period, region, dealer, and account. Every module below reacts to this shared filter state. The content then moves from high-level business health into diagnostic detail:

1. Overall KPI status.
2. Fan and engagement trends.
3. Largest account-level impact drivers.
4. Active account distribution and rankings.
5. Dealer quarterly KPI completion.

This approach is preferred over a pure platform-comparison dashboard because Xiaohongshu is currently the primary known platform while Douyin is a near-term expansion requirement. The design keeps Douyin in the data model, filters, and chart groupings, but does not force every screen into a platform-versus-platform comparison.

## Information Architecture

### Header And Filters

The dashboard has a compact sticky top control area:

- View mode: Apple, Region, Dealer, Store Account.
- Platform: All Platforms, Xiaohongshu, Douyin.
- Period: 7 days, 15 days, 30 days, 3 months, 6 months, 1 year.
- Region selector: All, East China, South China, North China, Central China.
- Dealer selector: filtered by selected region.
- Store account selector: filtered by selected dealer.

Default state:

- View mode: Apple.
- Platform: All Platforms.
- Period: 30 days.
- Region, dealer, and store account: All.

When a narrower view mode is selected, the dashboard keeps the same modules but changes aggregation grain:

- Apple view aggregates all 55 dealers and 200 store accounts.
- Region view aggregates dealers and stores under the selected region.
- Dealer view aggregates store accounts under the selected dealer.
- Store account view shows a single account's trend and contribution detail.

### KPI Overview

Show five top-level metrics:

- Total fans.
- Content count.
- Total engagement.
- Active account rate.
- Quarterly KPI completion.

Each KPI card displays:

- Current period value.
- Period-over-period percent change.
- Absolute difference versus previous comparable period.
- A compact trend sparkline or visual delta cue where supported.

The KPI cards should be scannable and quiet. Positive deltas use restrained green, negative deltas use restrained red, and neutral values use grayscale.

### Fan Trend

The fan section contains:

- A line chart with time on the x-axis and total fans on the y-axis.
- Optional platform grouping when All Platforms is selected.
- Hover tooltip with date, platform if relevant, and fan count.
- A written summary generated from the selected period and mock aggregate calculations.
- A DataGrid of high-impact accounts.

The impact table fields are:

- Account name.
- Platform.
- Region.
- Dealer.
- Previous period fans.
- Current period fans.
- Absolute difference.
- Period-over-period percent change.
- Impact share.

Impact share is calculated as the account's absolute fan change divided by the total absolute fan change across the filtered scope.

### Content And Engagement Trend

The engagement section contains:

- A line chart with time on the x-axis and the selected engagement metric on the y-axis.
- Metric switcher: engagement, reads/views, likes, collections, comments, shares.
- A written summary generated from selected metric and period.
- A DataGrid of high-impact accounts.

Unified metric mapping:

- Xiaohongshu: reads, likes, collections, comments, shares.
- Douyin: views, likes, comments, shares.
- Total engagement: likes + collections + comments + shares where collections are available; otherwise likes + comments + shares.

The UI can label the volume metric as "Reads / Views" when platform is All Platforms, "Reads" for Xiaohongshu, and "Views" for Douyin.

### Active Account Distribution

Active account definition for the prototype:

- Active if the account published at least one work in the selected period or generated engagement greater than zero.

Show:

- A grouped or stacked chart by region and platform.
- Active, low-active, and inactive counts.
- Active account rate.

Low-active definition for the prototype:

- Published at least one work but engagement is below the median of the selected peer group.

### Active Account Ranking

Show a DataGrid ranking account performance with sortable columns:

- Rank.
- Account.
- Platform.
- Region.
- Dealer.
- Content count.
- New fans.
- Reads / views.
- Engagement.
- Active status.

Default sort: engagement descending.

The ranking table should support search, column sorting, and row hover states.

### Quarterly KPI Management

Show a grouped DataGrid:

- Group level 1: region.
- Group level 2: dealer.
- Row level: store account.

For each dealer and store account, show:

- Quarterly reads/views target and current value.
- Quarterly engagement target and current value.
- Quarterly new fans target and current value.
- Completion percent for each KPI.
- Overall completion percent.
- Status: On Track, Watch, At Risk.

Status logic for the prototype:

- On Track: overall completion percent is at least expected quarter progress minus 5 percentage points.
- Watch: overall completion percent is 10 to 20 percentage points behind expected progress.
- At Risk: overall completion percent is more than 20 percentage points behind expected progress.

Expected quarter progress can be derived from the current mock day in quarter. Since this is a prototype, the mock current date should be fixed so screenshots and tests remain stable.

## Data Model

Mock data should use a normalized shape internally and derived aggregates for the UI.

Core entities:

- Region: id, name.
- Dealer: id, name, regionId, quarterlyKpi.
- StoreAccount: id, name, dealerId, regionId, platform, city, openDate.
- DailyMetric: accountId, date, fans, newFans, contentCount, readsOrViews, likes, collections, comments, shares.

Derived values:

- engagement = likes + collections + comments + shares.
- activeStatus = Active, Low Active, or Inactive.
- periodMetric = aggregate DailyMetric within selected period.
- previousPeriodMetric = aggregate the immediately preceding period of the same length.
- popDelta = periodMetric - previousPeriodMetric.
- popPercent = popDelta / previousPeriodMetric.
- impactShare = account absolute delta / total absolute delta in filtered scope.

Mock data requirements:

- 55 dealers.
- 200 store accounts.
- Four regions: East China, South China, North China, Central China.
- Xiaohongshu and Douyin accounts, with Xiaohongshu as the dominant share.
- At least 365 days of daily data so all period options work.
- Deterministic pseudo-random generation so charts remain stable between reloads.

## Frontend Architecture

Use a lightweight React app with DevExtreme React components.

Suggested structure:

- `src/App.tsx`: page shell and top-level filter state.
- `src/data/mockData.ts`: deterministic data generation.
- `src/lib/metrics.ts`: aggregation, period comparison, impact, active status, KPI calculations.
- `src/components/FilterBar.tsx`: shared dashboard controls.
- `src/components/KpiOverview.tsx`: top KPI cards.
- `src/components/FanTrendSection.tsx`: fan chart, summary, impact table.
- `src/components/EngagementTrendSection.tsx`: engagement chart, summary, impact table.
- `src/components/ActiveAccountsSection.tsx`: distribution chart and ranking table.
- `src/components/KpiManagementSection.tsx`: grouped quarterly KPI grid.
- `src/styles.css`: global Apple-inspired dashboard styling.

State should stay local to the prototype. No external state management library is needed.

## DevExtreme Component Mapping

- `SelectBox`: view mode, platform, period, region, dealer, store account selectors.
- `ButtonGroup` or `Tabs`: engagement metric switcher.
- `Chart`: fan trend, engagement trend, active distribution.
- `DataGrid`: impact accounts, active ranking, quarterly KPI management.
- `ProgressBar`: KPI completion inside grid cells or compact KPI panels.
- `Tooltip`: chart hover and metric explanations.
- `LoadPanel`: simulated loading state when filters change, if useful.

## Visual Direction

The UI should feel like an Apple-grade business cockpit:

- Light background, black text, subtle gray hierarchy.
- White panels with 8px or smaller radius.
- Thin borders and minimal shadows.
- Accent blue only for selection, focus, and primary interaction.
- Green/red only for positive or negative data deltas.
- Dense enough for operations work, but not cramped.
- No decorative gradients, large marketing hero, or illustrative filler.

Typography:

- Prefer system font stack.
- Use clear numeric hierarchy for KPI values.
- Avoid oversized display type inside dense dashboard panels.

Layout:

- Single scrollable page.
- Sticky top filter bar.
- Responsive grid: KPI cards wrap on narrower screens, charts and tables stack on mobile.
- Stable chart heights and table heights to prevent layout jumps.

## Testing And Verification

For the prototype, verification should include:

- App starts locally.
- No TypeScript or build errors.
- Dashboard renders with mock data.
- Filter changes update KPI cards, charts, summaries, and tables.
- Period changes correctly compare with the previous period.
- Apple, region, dealer, and store account view modes all show sensible data.
- Xiaohongshu, Douyin, and All Platforms filters all work.
- DevExtreme charts and grids render without overlapping text.
- Desktop and mobile viewport screenshots show usable layouts.

## Open Decisions

The prototype will assume these choices unless changed during review:

- Region labels are East China, South China, North China, and Central China in the code, with Chinese labels shown in the UI.
- Douyin is included as mock data and filterable, but Xiaohongshu remains the primary platform emphasis.
- The prototype uses local mock data only.
- The dashboard is a single-page app rather than a multi-page reporting suite.
