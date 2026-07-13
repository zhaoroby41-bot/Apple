import DataGrid, {
  Column,
  Grouping,
  GroupItem,
  GroupPanel,
  Paging,
  SearchPanel,
  Sorting,
  Summary,
  TotalItem,
} from "devextreme-react/data-grid";
import SelectBox from "devextreme-react/select-box";
import type { CSSProperties } from "react";
import type { DashboardModel, KpiRow } from "../lib/metrics";
import { formatNumber, formatPlainPercent } from "../lib/format";
import type { QuarterKey } from "../types";

const groupOrder = ["一组", "二组", "三组", "四组"];
const quarterOptions: Array<{ value: QuarterKey; label: string }> = [
  { value: "2026Q2", label: "2026 Q2" },
  { value: "2026Q3", label: "2026 Q3" },
];

function compareGroups(a: string, b: string) {
  return groupOrder.indexOf(a) - groupOrder.indexOf(b);
}

interface KpiGroupSummary {
  group: string;
  dealers: number;
  readsTarget: number;
  readsCurrent: number;
  engagementTarget: number;
  engagementCurrent: number;
  newFansTarget: number;
  newFansCurrent: number;
}

interface KpiTotalSummary {
  readsTarget: number;
  readsCurrent: number;
  engagementTarget: number;
  engagementCurrent: number;
  newFansTarget: number;
  newFansCurrent: number;
}

function completionTone(value: number) {
  if (value >= 1) return "over";
  if (value < 0.6) return "low";
  return "near";
}

function ProgressCell({ value }: { value: number }) {
  const fill = `${Math.min(100, Math.max(0, value * 100))}%`;
  return (
    <div className={`completion-cell completion-cell-${completionTone(value)}`} style={{ "--completion-fill": fill } as CSSProperties}>
      <span>{formatPlainPercent(value)}</span>
      <i aria-hidden="true" />
    </div>
  );
}

function MetricSummaryLine({ label, current, target }: { label: string; current: number; target: number }) {
  const completion = target === 0 ? 0 : current / target;
  return (
    <p className={`summary-completion summary-completion-${completionTone(completion)}`}>
      <span>{label}</span>
      <strong>{formatPlainPercent(completion)}</strong>
      <small>{formatNumber(current)} / {formatNumber(target)}</small>
    </p>
  );
}

function StatusCell({ value }: { value: string }) {
  const className = value === "On Track" ? "on-track" : value === "Watch" ? "watch" : "at-risk";
  const label = value === "On Track" ? "达成中" : value === "Watch" ? "关注" : "风险";
  return <span className={`status-pill ${className}`}>{label}</span>;
}

function groupSummary(rows: KpiRow[]) {
  return rows
    .reduce<Map<string, KpiGroupSummary>>(
      (map, row) => {
        const item =
          map.get(row.kpiGroup) ??
          ({
            group: row.kpiGroup,
            dealers: 0,
            readsTarget: 0,
            readsCurrent: 0,
            engagementTarget: 0,
            engagementCurrent: 0,
            newFansTarget: 0,
            newFansCurrent: 0,
          });
        item.dealers += 1;
        item.readsTarget += row.readsTarget;
        item.readsCurrent += row.readsCurrent;
        item.engagementTarget += row.engagementTarget;
        item.engagementCurrent += row.engagementCurrent;
        item.newFansTarget += row.newFansTarget;
        item.newFansCurrent += row.newFansCurrent;
        map.set(row.kpiGroup, item);
        return map;
      },
      new Map(),
    )
    .values();
}

function averageCompletion(item: KpiGroupSummary) {
  return (
    (item.readsTarget === 0 ? 0 : item.readsCurrent / item.readsTarget) +
    (item.engagementTarget === 0 ? 0 : item.engagementCurrent / item.engagementTarget) +
    (item.newFansTarget === 0 ? 0 : item.newFansCurrent / item.newFansTarget)
  ) / 3;
}

function totalSummary(rows: KpiRow[]): KpiTotalSummary {
  return rows.reduce<KpiTotalSummary>(
    (total, row) => ({
      readsTarget: total.readsTarget + row.readsTarget,
      readsCurrent: total.readsCurrent + row.readsCurrent,
      engagementTarget: total.engagementTarget + row.engagementTarget,
      engagementCurrent: total.engagementCurrent + row.engagementCurrent,
      newFansTarget: total.newFansTarget + row.newFansTarget,
      newFansCurrent: total.newFansCurrent + row.newFansCurrent,
    }),
    { readsTarget: 0, readsCurrent: 0, engagementTarget: 0, engagementCurrent: 0, newFansTarget: 0, newFansCurrent: 0 },
  );
}

function TotalCompletionCard({ label, current, target, description }: { label: string; current: number; target: number; description: string }) {
  const completion = target === 0 ? 0 : current / target;
  return (
    <article className={`kpi-completion-card kpi-completion-card-${completionTone(completion)}`}>
      <div>
        <span>{label}</span>
        <strong>{formatPlainPercent(completion)}</strong>
      </div>
      <i style={{ "--completion-fill": `${Math.min(100, Math.max(0, completion * 100))}%` } as CSSProperties} aria-hidden="true" />
      <p>{description}</p>
      <small>{formatNumber(current)} / {formatNumber(target)}</small>
    </article>
  );
}

export function KpiManagementSection({
  model,
  quarter,
  onQuarterChange,
}: {
  model: DashboardModel;
  quarter: QuarterKey;
  onQuarterChange: (quarter: QuarterKey) => void;
}) {
  const summaries = Array.from(groupSummary(model.kpiRows)).sort((a, b) => groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group));
  const totals = totalSummary(model.kpiRows);
  const targetCaption = `${model.kpiQuarterLabel} KPI`;

  return (
    <section className="analysis-section">
      <div className="section-heading kpi-page-heading">
        <div>
          <p className="eyebrow">Quarterly KPI</p>
          <h2>经销商季度 KPI 报表</h2>
        </div>
        <div className="quarter-selector">
          <span>季度</span>
          <SelectBox
            items={quarterOptions}
            value={quarter}
            valueExpr="value"
            displayExpr="label"
            onValueChanged={(event) => onQuarterChange(event.value)}
          />
        </div>
        <p>参考季度 KPI Excel 模板，以分组为主线展示经销商专业号的阅读/播放、互动量和新增粉丝目标完成情况。当前统计区间：{model.kpiWindow.start} 至 {model.kpiWindow.end}。</p>
      </div>

      <div className="kpi-completion-overview" aria-label="KPI completion overview">
        <TotalCompletionCard label="阅读完成率" current={totals.readsCurrent} target={totals.readsTarget} description={`${model.kpiQuarterLabel} 阅读/播放 / 阅读 KPI`} />
        <TotalCompletionCard label="互动完成率" current={totals.engagementCurrent} target={totals.engagementTarget} description={`${model.kpiQuarterLabel} 互动 / 互动 KPI`} />
        <TotalCompletionCard label="新增粉丝完成率" current={totals.newFansCurrent} target={totals.newFansTarget} description={`${model.kpiQuarterLabel} 新增粉丝 / 新增粉丝 KPI`} />
      </div>

      <div className="kpi-report-summary" aria-label="KPI group summary">
        {summaries.map((item) => (
          <article key={item.group}>
            <div>
              <span>{item.group}</span>
              <strong>{formatPlainPercent(averageCompletion(item))}</strong>
            </div>
            <small>{item.dealers} 家经销商</small>
            <MetricSummaryLine label="阅读" current={item.readsCurrent} target={item.readsTarget} />
            <MetricSummaryLine label="互动" current={item.engagementCurrent} target={item.engagementTarget} />
            <MetricSummaryLine label="新增粉丝" current={item.newFansCurrent} target={item.newFansTarget} />
          </article>
        ))}
      </div>

      <article className="panel table-panel full-width-table kpi-report-panel">
        <DataGrid dataSource={model.kpiRows} keyExpr="id" showBorders={false} columnAutoWidth rowAlternationEnabled>
          <SearchPanel visible placeholder="搜索分组 / 经销商账号" />
          <GroupPanel visible />
          <Grouping autoExpandAll />
          <Sorting mode="multiple" />
          <Paging defaultPageSize={16} />
          <Column dataField="kpiGroup" caption="分组" groupIndex={0} sortOrder="asc" sortingMethod={compareGroups} />
          <Column dataField="dealer" caption="小红书账号" minWidth={180} fixed />
          <Column dataField="accountCount" caption="覆盖账号数" width={96} alignment="right" />
          <Column caption="阅读/播放">
            <Column dataField="readsTarget" caption={targetCaption} dataType="number" format="#,##0" width={118} />
            <Column dataField="readsCurrent" caption="当前完成" dataType="number" format="#,##0" width={118} />
            <Column dataField="readsCompletion" caption="完成率" cellRender={(cell) => <ProgressCell value={cell.value} />} width={174} />
          </Column>
          <Column caption="互动量">
            <Column dataField="engagementTarget" caption={targetCaption} dataType="number" format="#,##0" width={112} />
            <Column dataField="engagementCurrent" caption="当前完成" dataType="number" format="#,##0" width={112} />
            <Column dataField="engagementCompletion" caption="完成率" cellRender={(cell) => <ProgressCell value={cell.value} />} width={174} />
          </Column>
          <Column caption="新增粉丝">
            <Column dataField="newFansTarget" caption={targetCaption} dataType="number" format="#,##0" width={112} />
            <Column dataField="newFansCurrent" caption="当前完成" dataType="number" format="#,##0" width={112} />
            <Column dataField="newFansCompletion" caption="完成率" cellRender={(cell) => <ProgressCell value={cell.value} />} width={174} />
          </Column>
          <Column dataField="overallCompletion" caption="综合完成率" cellRender={(cell) => <ProgressCell value={cell.value} />} width={180} sortOrder="asc" />
          <Column dataField="status" caption="状态" cellRender={(cell) => <StatusCell value={cell.value} />} width={92} />
          <Summary>
            <GroupItem column="dealer" summaryType="count" displayFormat="{0} 家经销商" />
            <GroupItem column="readsCurrent" summaryType="sum" valueFormat="#,##0" displayFormat="{0}" showInGroupFooter alignByColumn />
            <GroupItem column="engagementCurrent" summaryType="sum" valueFormat="#,##0" displayFormat="{0}" showInGroupFooter alignByColumn />
            <GroupItem column="newFansCurrent" summaryType="sum" valueFormat="#,##0" displayFormat="{0}" showInGroupFooter alignByColumn />
            <TotalItem column="dealer" summaryType="count" displayFormat="合计 {0} 家经销商" />
            <TotalItem column="readsCurrent" summaryType="sum" valueFormat="#,##0" displayFormat="{0}" />
            <TotalItem column="engagementCurrent" summaryType="sum" valueFormat="#,##0" displayFormat="{0}" />
            <TotalItem column="newFansCurrent" summaryType="sum" valueFormat="#,##0" displayFormat="{0}" />
          </Summary>
        </DataGrid>
        <p className="table-note">目标列对应 {model.kpiQuarterLabel} 的季度 KPI，当前完成列对应所选季度统计区间内的累计表现；按权限和左侧组织树筛选后，目标会按可见账号范围同比例折算。</p>
      </article>
    </section>
  );
}
