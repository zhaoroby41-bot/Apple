import DataGrid, { Column, Grouping, GroupPanel, Paging, SearchPanel, Sorting } from "devextreme-react/data-grid";
import ProgressBar from "devextreme-react/progress-bar";
import type { DashboardModel } from "../lib/metrics";
import { formatPlainPercent } from "../lib/format";

function ProgressCell({ value }: { value: number }) {
  return (
    <div className="progress-cell">
      <ProgressBar min={0} max={1} value={Math.min(1, value)} showStatus={false} />
      <span>{formatPlainPercent(value)}</span>
    </div>
  );
}

function StatusCell({ value }: { value: string }) {
  const className = value === "On Track" ? "on-track" : value === "Watch" ? "watch" : "at-risk";
  const label = value === "On Track" ? "达成中" : value === "Watch" ? "关注" : "风险";
  return <span className={`status-pill ${className}`}>{label}</span>;
}

export function KpiManagementSection({ model }: { model: DashboardModel }) {
  return (
    <section className="analysis-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Quarterly KPI</p>
          <h2>经销商季度 KPI 管理</h2>
        </div>
        <p>按大区和经销商分组查看门店账号的阅读/播放、互动量和新增粉丝目标完成情况。</p>
      </div>
      <article className="panel table-panel full-width-table">
        <DataGrid dataSource={model.kpiRows} keyExpr="id" showBorders={false} columnAutoWidth rowAlternationEnabled>
          <SearchPanel visible placeholder="搜索大区/经销商/账号" />
          <GroupPanel visible />
          <Grouping autoExpandAll={false} />
          <Sorting mode="multiple" />
          <Paging defaultPageSize={12} />
          <Column dataField="region" caption="大区" groupIndex={0} />
          <Column dataField="dealer" caption="经销商" groupIndex={1} />
          <Column dataField="account" caption="门店账号" minWidth={220} />
          <Column dataField="readsCurrent" caption="阅读/播放完成" dataType="number" format="#,##0" />
          <Column dataField="readsTarget" caption="阅读/播放目标" dataType="number" format="#,##0" />
          <Column dataField="readsCompletion" caption="阅读/播放%" cellRender={(cell) => <ProgressCell value={cell.value} />} />
          <Column dataField="engagementCurrent" caption="互动完成" dataType="number" format="#,##0" />
          <Column dataField="engagementTarget" caption="互动目标" dataType="number" format="#,##0" />
          <Column dataField="engagementCompletion" caption="互动%" cellRender={(cell) => <ProgressCell value={cell.value} />} />
          <Column dataField="newFansCurrent" caption="新增粉丝完成" dataType="number" format="#,##0" />
          <Column dataField="newFansTarget" caption="新增粉丝目标" dataType="number" format="#,##0" />
          <Column dataField="newFansCompletion" caption="新增粉丝%" cellRender={(cell) => <ProgressCell value={cell.value} />} />
          <Column dataField="overallCompletion" caption="整体完成率" cellRender={(cell) => <ProgressCell value={cell.value} />} sortOrder="asc" />
          <Column dataField="status" caption="状态" cellRender={(cell) => <StatusCell value={cell.value} />} />
        </DataGrid>
        <p className="table-note">目标按经销商季度 KPI 均摊到门店账号；真实接入后可替换为门店级目标。</p>
      </article>
    </section>
  );
}
