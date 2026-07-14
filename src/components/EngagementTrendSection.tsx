import Chart, { ArgumentAxis, CommonSeriesSettings, Grid, Legend, Point, Series, Tooltip, ValueAxis } from "devextreme-react/chart";
import DataGrid, { Column, Paging, Sorting } from "devextreme-react/data-grid";
import ButtonGroup from "devextreme-react/button-group";
import { useState } from "react";
import type { EngagementMetricKey } from "../types";
import type { DashboardModel, ImpactRow, TrendPoint } from "../lib/metrics";
import { applyTrendAreaGradients } from "../lib/chartGradients";
import { formatCompactNumber, formatNumber, formatPercent } from "../lib/format";

const platformField = {
  all: "全平台",
  xiaohongshu: "小红书",
  douyin: "抖音",
} as const;

const chartPalette = ["#0071e3", "#1d1d1f", "#8e8e93"];

const metricItems: Array<{ key: EngagementMetricKey; text: string }> = [
  { key: "engagement", text: "互动量" },
  { key: "readsOrViews", text: "阅读/播放" },
  { key: "likes", text: "点赞" },
  { key: "collections", text: "收藏" },
  { key: "comments", text: "评论" },
  { key: "shares", text: "分享" },
];

function toWideRows(points: TrendPoint[], field: EngagementMetricKey) {
  const rows = new Map<string, Record<string, string | number>>();
  points.forEach((point) => {
    const row = rows.get(point.date) ?? { date: point.date };
    row[platformField[point.platform]] = Number(point[field]);
    rows.set(point.date, row);
  });
  return Array.from(rows.values());
}

function activeSeries(points: TrendPoint[]) {
  return Array.from(new Set(points.map((point) => platformField[point.platform])));
}

function DeltaCell({ value }: { value: number }) {
  const className = value >= 0 ? "impact-delta-positive" : "impact-delta-negative";
  return <span className={`impact-delta ${className}`}>{value >= 0 ? "+" : ""}{formatNumber(value)}</span>;
}

function TeamCell({ row }: { row: ImpactRow }) {
  return <span className={`team-cell team-cell-${row.teamLevel ?? "dealer"}`}>{row.account}</span>;
}

const impactViewItems = [
  { key: "account", text: "账号" },
  { key: "team", text: "团队" },
];

export function EngagementTrendSection({
  model,
  metric,
  onMetricChange,
}: {
  model: DashboardModel;
  metric: EngagementMetricKey;
  onMetricChange: (metric: EngagementMetricKey) => void;
}) {
  const [impactView, setImpactView] = useState<"account" | "team">("account");
  const chartRows = toWideRows(model.engagementTrend, metric);
  const series = activeSeries(model.engagementTrend);
  const metricLabel = metricItems.find((item) => item.key === metric)?.text ?? "互动量";
  const delta = model.comparison.delta[metric];
  const percent = model.comparison.percent[metric];
  const current = model.comparison.current[metric];
  const impactRows = impactView === "account" ? model.engagementImpactRows : model.engagementTeamImpactRows;

  return (
    <section className="analysis-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Content & Engagement</p>
          <h2>作品与互动趋势</h2>
        </div>
        <p>
          本周期{metricLabel} <strong>{formatCompactNumber(current)}</strong>，较上一周期
          {delta >= 0 ? " 增加 " : " 减少 "}
          <strong className={delta >= 0 ? "summary-positive" : "summary-negative"}>{delta >= 0 ? "+" : "-"}{formatNumber(Math.abs(delta))}</strong>，环比{" "}
          <strong className={percent >= 0 ? "summary-positive" : "summary-negative"}>{formatPercent(percent)}</strong>。
        </p>
      </div>
      <div className="metric-switcher">
        <ButtonGroup
          items={metricItems}
          keyExpr="key"
          selectedItemKeys={[metric]}
          selectionMode="single"
          onSelectionChanged={(event) => {
            const selected = event.addedItems[0]?.key as EngagementMetricKey | undefined;
            if (selected) onMetricChange(selected);
          }}
        />
      </div>
      <div className="analysis-grid">
        <article className="panel chart-panel">
          <Chart dataSource={chartRows} palette={chartPalette} onDrawn={(event) => applyTrendAreaGradients(event.element)}>
            <CommonSeriesSettings argumentField="date" />
            {series.map((name, index) => (
              <Series
                key={`${name}-shadow`}
                valueField={name}
                name={name}
                type="area"
                color={chartPalette[index % chartPalette.length]}
                opacity={0.12}
                showInLegend={false}
                border={{ visible: false }}
                point={{ visible: false }}
              />
            ))}
            {series.map((name, index) => (
              <Series
                key={name}
                valueField={name}
                name={name}
                type="line"
                width={2}
                color={chartPalette[index % chartPalette.length]}
              >
                <Point visible size={3} hoverStyle={{ size: 6 }} />
              </Series>
            ))}
            <ArgumentAxis argumentType="string" tickInterval={4} />
            <ValueAxis>
              <Grid visible />
            </ValueAxis>
            <Tooltip enabled customizeTooltip={(point) => ({ text: `${point.argumentText}<br/>${point.seriesName}: ${formatNumber(Number(point.value))}` })} />
            <Legend verticalAlignment="bottom" horizontalAlignment="center" />
          </Chart>
        </article>
        <article className="panel table-panel">
          <div className="panel-title">
            <h3>{metricLabel}影响{impactView === "account" ? "账号" : "团队"}</h3>
            <div className="panel-title-actions">
              <span>按本周期降序</span>
              <ButtonGroup
                items={impactViewItems}
                keyExpr="key"
                selectedItemKeys={[impactView]}
                selectionMode="single"
                onSelectionChanged={(event) => {
                  const selected = event.addedItems[0]?.key as "account" | "team" | undefined;
                  if (selected) setImpactView(selected);
                }}
              />
            </div>
          </div>
          <DataGrid dataSource={impactRows} keyExpr="id" showBorders={false} rowAlternationEnabled>
            <Sorting mode="single" />
            <Paging defaultPageSize={8} />
            {impactView === "account" ? (
              <Column dataField="account" caption="账号" minWidth={180} />
            ) : (
              <Column dataField="account" caption="团队" minWidth={180} cellRender={(cell) => <TeamCell row={cell.data} />} />
            )}
            <Column dataField="platform" caption="平台" width={76} />
            <Column dataField="current" caption="本周期" dataType="number" format="#,##0" width={86} />
            <Column dataField="previous" caption="上周期" dataType="number" format="#,##0" width={86} />
            <Column dataField="delta" caption="影响" dataType="number" width={104} cellRender={(cell) => <DeltaCell value={cell.value} />} />
            <Column dataField="impactShare" caption="影响度" dataType="number" format="percent" width={72} />
          </DataGrid>
        </article>
      </div>
    </section>
  );
}
