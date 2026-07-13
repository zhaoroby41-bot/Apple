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
import NumberBox from "devextreme-react/number-box";
import SelectBox from "devextreme-react/select-box";
import TagBox from "devextreme-react/tag-box";
import { Download, FileInput, Plus, Settings2 } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import {
  groupOrder,
  initialDealerGroups,
  initialKpiTargets,
  platformOptions,
  sortKpiTargets,
  type DealerGroupSetting,
  type KpiTargetSetting,
} from "../lib/kpiConfig";
import type { DashboardModel, KpiRow } from "../lib/metrics";
import { formatNumber, formatPlainPercent } from "../lib/format";
import type { MockDataset, Platform, QuarterKey } from "../types";

const quarterOptions: Array<{ value: QuarterKey; label: string }> = [
  { value: "2026Q3", label: "2026 Q3" },
  { value: "2026Q2", label: "2026 Q2" },
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

function platformLabel(value: Platform) {
  return platformOptions.find((item) => item.value === value)?.label ?? value;
}

function exportKpiRows(rows: KpiRow[], quarter: QuarterKey, platform: Platform) {
  const header = ["季度", "平台", "分组", "经销商", "覆盖账号数", "阅读KPI", "阅读完成", "互动KPI", "互动完成", "新增粉丝KPI", "新增粉丝完成", "综合完成率"];
  const body = rows.map((row) => [
    quarter,
    platformLabel(platform),
    row.kpiGroup,
    row.dealer,
    row.accountCount,
    Math.round(row.readsTarget),
    row.readsCurrent,
    Math.round(row.engagementTarget),
    row.engagementCurrent,
    Math.round(row.newFansTarget),
    row.newFansCurrent,
    formatPlainPercent(row.overallCompletion),
  ]);
  const csv = [header, ...body].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dealer-kpi-${quarter}-${platform}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function KpiManagementSection({
  dataset,
  model,
  platform,
  onPlatformChange,
  quarter,
  onQuarterChange,
}: {
  dataset: MockDataset;
  model: DashboardModel;
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
  quarter: QuarterKey;
  onQuarterChange: (quarter: QuarterKey) => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [targets, setTargets] = useState<KpiTargetSetting[]>(initialKpiTargets);
  const [dealerGroups, setDealerGroups] = useState<DealerGroupSetting[]>(initialDealerGroups);
  const [targetDraft, setTargetDraft] = useState({
    platform: "all" as Platform,
    quarter: "2026Q3" as QuarterKey,
    groupId: "group-1",
    readsTarget: 3600000,
    engagementTarget: 340000,
    newFansTarget: 46000,
  });
  const [selectedGroupId, setSelectedGroupId] = useState("group-1");
  const selectedGroup = dealerGroups.find((group) => group.id === selectedGroupId) ?? dealerGroups[0];
  const dealerOptions = dataset.dealers.map((dealer) => ({ value: dealer.id, label: dealer.name }));
  const groupOptions = dealerGroups.map((group) => ({ value: group.id, label: group.name }));
  const sortedTargets = useMemo(() => sortKpiTargets(targets), [targets]);
  const summaries = Array.from(groupSummary(model.kpiRows)).sort((a, b) => groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group));
  const totals = totalSummary(model.kpiRows);
  const targetCaption = `${model.kpiQuarterLabel} KPI`;

  function addTarget(source: "新增" | "导入") {
    const group = dealerGroups.find((item) => item.id === targetDraft.groupId) ?? dealerGroups[0];
    const multiplier = source === "导入" ? 1.08 : 1;
    const nextTarget: KpiTargetSetting = {
      id: `target-${Date.now()}-${source}`,
      platform: targetDraft.platform,
      quarter: targetDraft.quarter,
      groupId: group.id,
      groupName: group.name,
      readsTarget: Math.round(targetDraft.readsTarget * multiplier),
      engagementTarget: Math.round(targetDraft.engagementTarget * multiplier),
      newFansTarget: Math.round(targetDraft.newFansTarget * multiplier),
      source,
    };
    setTargets((current) => [nextTarget, ...current]);
  }

  function updateSelectedGroup(dealerIds: string[]) {
    setDealerGroups((current) => current.map((group) => (group.id === selectedGroup.id ? { ...group, dealerIds } : group)));
  }

  return (
    <section className="analysis-section">
      <div className="section-heading kpi-page-heading">
        <div>
          <p className="eyebrow">Quarterly KPI</p>
          <h2>经销商季度 KPI 报表</h2>
        </div>
        <div className="kpi-page-actions">
          <label>
            <span>平台</span>
            <SelectBox items={platformOptions} value={platform} valueExpr="value" displayExpr="label" onValueChanged={(event) => onPlatformChange(event.value)} />
          </label>
          <label>
            <span>季度</span>
            <SelectBox items={quarterOptions} value={quarter} valueExpr="value" displayExpr="label" onValueChanged={(event) => onQuarterChange(event.value)} />
          </label>
          <button type="button" className="secondary-action-button" onClick={() => setShowSettings((value) => !value)}>
            <Settings2 size={16} />
            KPI设定
          </button>
          <button type="button" className="primary-action-button" onClick={() => exportKpiRows(model.kpiRows, quarter, platform)}>
            <Download size={16} />
            导出
          </button>
        </div>
        <p>
          当前按 {platformLabel(platform)} / {model.kpiQuarterLabel} 展示经销商分组 KPI 完成情况，统计区间：{model.kpiWindow.start} 至 {model.kpiWindow.end}。
        </p>
      </div>

      {showSettings ? (
        <div className="kpi-settings-grid">
          <article className="panel kpi-settings-panel">
            <div className="panel-title">
              <h3>KPI目标设定</h3>
              <span>新增或导入</span>
            </div>
            <div className="kpi-target-form">
              <label>
                <span>平台</span>
                <SelectBox items={platformOptions} value={targetDraft.platform} valueExpr="value" displayExpr="label" onValueChanged={(event) => setTargetDraft((draft) => ({ ...draft, platform: event.value }))} />
              </label>
              <label>
                <span>季度</span>
                <SelectBox items={quarterOptions} value={targetDraft.quarter} valueExpr="value" displayExpr="label" onValueChanged={(event) => setTargetDraft((draft) => ({ ...draft, quarter: event.value }))} />
              </label>
              <label>
                <span>经销商分组</span>
                <SelectBox items={groupOptions} value={targetDraft.groupId} valueExpr="value" displayExpr="label" onValueChanged={(event) => setTargetDraft((draft) => ({ ...draft, groupId: event.value }))} />
              </label>
              <label>
                <span>阅读量KPI</span>
                <NumberBox value={targetDraft.readsTarget} format="#,##0" min={0} onValueChanged={(event) => setTargetDraft((draft) => ({ ...draft, readsTarget: Number(event.value) }))} />
              </label>
              <label>
                <span>互动量KPI</span>
                <NumberBox value={targetDraft.engagementTarget} format="#,##0" min={0} onValueChanged={(event) => setTargetDraft((draft) => ({ ...draft, engagementTarget: Number(event.value) }))} />
              </label>
              <label>
                <span>新增粉丝KPI</span>
                <NumberBox value={targetDraft.newFansTarget} format="#,##0" min={0} onValueChanged={(event) => setTargetDraft((draft) => ({ ...draft, newFansTarget: Number(event.value) }))} />
              </label>
              <div className="kpi-target-actions">
                <button type="button" className="primary-action-button" onClick={() => addTarget("新增")}>
                  <Plus size={16} />
                  新增
                </button>
                <button type="button" className="secondary-action-button" onClick={() => addTarget("导入")}>
                  <FileInput size={16} />
                  导入
                </button>
              </div>
            </div>
            <DataGrid dataSource={sortedTargets} keyExpr="id" showBorders={false} rowAlternationEnabled>
              <SearchPanel visible placeholder="搜索平台 / 季度 / 分组" />
              <Sorting mode="multiple" />
              <Paging defaultPageSize={8} />
              <Column dataField="platform" caption="平台" width={90} cellRender={(cell) => platformLabel(cell.value)} />
              <Column dataField="quarter" caption="季度" width={90} sortOrder="desc" />
              <Column dataField="groupName" caption="经销商分组" width={110} sortingMethod={compareGroups} />
              <Column dataField="readsTarget" caption="阅读量KPI" dataType="number" format="#,##0" />
              <Column dataField="engagementTarget" caption="互动量KPI" dataType="number" format="#,##0" />
              <Column dataField="newFansTarget" caption="新增粉丝KPI" dataType="number" format="#,##0" />
              <Column dataField="source" caption="来源" width={80} />
            </DataGrid>
          </article>

          <article className="panel kpi-settings-panel">
            <div className="panel-title">
              <h3>经销商分组设定</h3>
              <span>按账号加入分组</span>
            </div>
            <div className="dealer-group-editor">
              <label>
                <span>分组</span>
                <SelectBox items={groupOptions} value={selectedGroupId} valueExpr="value" displayExpr="label" onValueChanged={(event) => setSelectedGroupId(event.value)} />
              </label>
              <label>
                <span>经销商账号</span>
                <TagBox
                  items={dealerOptions}
                  value={selectedGroup?.dealerIds ?? []}
                  valueExpr="value"
                  displayExpr="label"
                  searchEnabled
                  showSelectionControls
                  multiline
                  onValueChanged={(event) => updateSelectedGroup(event.value)}
                />
              </label>
            </div>
            <DataGrid dataSource={dealerGroups.map((group) => ({ ...group, dealerCount: group.dealerIds.length, dealers: group.dealerIds.map((id) => dataset.dealers.find((dealer) => dealer.id === id)?.name ?? id).join("、") }))} keyExpr="id" showBorders={false} rowAlternationEnabled>
              <Paging defaultPageSize={4} />
              <Column dataField="name" caption="分组" width={90} />
              <Column dataField="dealerCount" caption="经销商数" width={96} alignment="right" />
              <Column dataField="dealers" caption="已加入经销商账号" minWidth={260} />
            </DataGrid>
          </article>
        </div>
      ) : null}

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
          <Column dataField="dealer" caption="经销商账号" minWidth={180} fixed />
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
        <p className="table-note">目标列对应 {model.kpiQuarterLabel} 的季度 KPI，当前完成列对应所选季度统计区间内的累计表现；平台筛选会同步影响下方报表内容。</p>
      </article>
    </section>
  );
}
