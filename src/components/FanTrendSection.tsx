import Chart, { ArgumentAxis, CommonSeriesSettings, Grid, Legend, Point, Series, Tooltip, ValueAxis } from "devextreme-react/chart";
import DataGrid, { Column, Paging, Sorting } from "devextreme-react/data-grid";
import type { DashboardModel, TrendPoint } from "../lib/metrics";
import { formatCompactNumber, formatNumber, formatPercent } from "../lib/format";

const platformField = {
  all: "全平台",
  xiaohongshu: "小红书",
  douyin: "抖音",
} as const;

function toWideRows(points: TrendPoint[], field: keyof TrendPoint) {
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

export function FanTrendSection({ model }: { model: DashboardModel }) {
  const chartRows = toWideRows(model.fanTrend, "fans");
  const series = activeSeries(model.fanTrend);
  const delta = model.comparison.delta.fans;
  const percent = model.comparison.percent.fans;

  return (
    <section className="analysis-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Fan Trend</p>
          <h2>粉丝趋势</h2>
        </div>
        <p>
          本周期粉丝总量 {formatCompactNumber(model.comparison.current.fans)}，较上一周期
          {delta >= 0 ? " 增加 " : " 减少 "}
          {formatNumber(Math.abs(delta))}，环比 {formatPercent(percent)}。
        </p>
      </div>
      <div className="analysis-grid">
        <article className="panel chart-panel">
          <Chart dataSource={chartRows} palette={["#0071e3", "#1d1d1f", "#8e8e93"]}>
            <CommonSeriesSettings argumentField="date" type="line" width={2}>
              <Point visible size={4} hoverStyle={{ size: 7 }} />
            </CommonSeriesSettings>
            {series.map((name) => (
              <Series key={name} valueField={name} name={name} />
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
            <h3>粉丝变化影响账号</h3>
            <span>按影响度排序</span>
          </div>
          <DataGrid dataSource={model.fanImpactRows} keyExpr="id" showBorders={false} columnAutoWidth rowAlternationEnabled>
            <Sorting mode="single" />
            <Paging defaultPageSize={6} />
            <Column dataField="account" caption="账号" minWidth={180} />
            <Column dataField="platform" caption="平台" width={76} />
            <Column dataField="current" caption="本周期" dataType="number" format="#,##0" />
            <Column dataField="previous" caption="上周期" dataType="number" format="#,##0" />
            <Column dataField="delta" caption="差异" dataType="number" format="+#,##0;-#,##0" />
            <Column dataField="impactShare" caption="影响度" dataType="number" format="percent" />
          </DataGrid>
        </article>
      </div>
    </section>
  );
}
