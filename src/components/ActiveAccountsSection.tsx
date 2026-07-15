import DataGrid, { Column, Paging, SearchPanel, Sorting } from "devextreme-react/data-grid";
import type { DashboardModel } from "../lib/metrics";

function getActivityTotal(row: DashboardModel["activeDistribution"][number]) {
  return row.active + row.lowActive + row.inactive;
}

export function ActiveAccountsSection({ model }: { model: DashboardModel }) {
  const maxActivityTotal = Math.max(1, ...model.activeDistribution.map(getActivityTotal));

  return (
    <section className="analysis-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Account Activity</p>
          <h2>活跃账号分布与排名</h2>
        </div>
        <p>按经销商观察关联门店账号活跃状态，并以活跃账号数从高到低排名本周期运营表现。低活跃指本周期有发文或互动，但发文少于 2 篇或互动量低于活跃账号中位数的账号。</p>
      </div>
      <div className="analysis-grid">
        <article className="panel chart-panel">
          <div className="activity-bar-chart" aria-label="活跃账号横向分布">
            {model.activeDistribution.map((row) => {
              const total = getActivityTotal(row);
              const totalWidth = `${Math.max(4, (total / maxActivityTotal) * 100)}%`;
              const activeWidth = `${total === 0 ? 0 : (row.active / total) * 100}%`;
              const lowActiveWidth = `${total === 0 ? 0 : (row.lowActive / total) * 100}%`;
              const inactiveWidth = `${total === 0 ? 0 : (row.inactive / total) * 100}%`;

              return (
                <div className="activity-bar-row" key={row.key}>
                  <div
                    className="activity-bar-track"
                    title={`${row.dealer}: 活跃 ${row.active}, 低活跃 ${row.lowActive}, 未活跃 ${row.inactive}`}
                  >
                    <div className="activity-bar-stack" style={{ width: totalWidth }}>
                      <span className="activity-bar-segment activity-bar-segment-active" style={{ width: activeWidth }} />
                      <span className="activity-bar-segment activity-bar-segment-low" style={{ width: lowActiveWidth }} />
                      <span className="activity-bar-segment activity-bar-segment-inactive" style={{ width: inactiveWidth }} />
                    </div>
                  </div>
                  <span className="activity-bar-name">{row.dealer}</span>
                </div>
              );
            })}
          </div>
          <div className="activity-bar-legend" aria-label="活跃状态图例">
            <span>
              <i className="activity-bar-segment-active" />
              活跃
            </span>
            <span>
              <i className="activity-bar-segment-low" />
              低活跃
            </span>
            <span>
              <i className="activity-bar-segment-inactive" />
              未活跃
            </span>
          </div>
        </article>
        <article className="panel table-panel">
          <div className="panel-title">
            <h3>活跃账号排名</h3>
            <span>按活跃账号数排序</span>
          </div>
          <DataGrid dataSource={model.rankingRows} keyExpr="id" showBorders={false} columnAutoWidth rowAlternationEnabled>
            <SearchPanel visible placeholder="搜索经销商" />
            <Sorting mode="multiple" />
            <Paging defaultPageSize={8} />
            <Column dataField="rank" caption="#" width={56} />
            <Column dataField="dealer" caption="经销商" minWidth={190} />
            <Column dataField="accountCount" caption="账号数" dataType="number" width={82} />
            <Column dataField="activeCount" caption="活跃数" dataType="number" width={82} sortOrder="desc" />
            <Column dataField="lowActiveCount" caption="低活跃" dataType="number" width={82} />
            <Column dataField="inactiveCount" caption="未活跃" dataType="number" width={82} />
            <Column dataField="activeAccountRate" caption="活跃率" dataType="number" format="percent" width={88} />
            <Column dataField="contentCount" caption="作品" dataType="number" width={72} />
            <Column dataField="newFans" caption="新增粉丝" dataType="number" format="#,##0" />
            <Column dataField="readsOrViews" caption="阅读/播放" dataType="number" format="#,##0" />
            <Column dataField="engagement" caption="互动量" dataType="number" format="#,##0" />
          </DataGrid>
        </article>
      </div>
    </section>
  );
}
