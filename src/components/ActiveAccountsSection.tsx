import Chart, { ArgumentAxis, CommonSeriesSettings, Grid, Legend, Series, Tooltip, ValueAxis } from "devextreme-react/chart";
import DataGrid, { Column, Paging, SearchPanel, Sorting } from "devextreme-react/data-grid";
import type { DashboardModel } from "../lib/metrics";

export function ActiveAccountsSection({ model }: { model: DashboardModel }) {
  return (
    <section className="analysis-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Account Activity</p>
          <h2>活跃账号分布与排名</h2>
        </div>
        <p>按经销商与平台观察账号活跃状态，并以经销商为单位排名本周期运营表现。</p>
      </div>
      <div className="analysis-grid">
        <article className="panel chart-panel">
          <Chart dataSource={model.activeDistribution} palette={["#2f855a", "#b7791f", "#a1a1a6"]}>
            <CommonSeriesSettings argumentField="key" type="stackedbar" />
            <Series valueField="active" name="活跃" />
            <Series valueField="lowActive" name="低活跃" />
            <Series valueField="inactive" name="未活跃" />
            <ArgumentAxis argumentType="string" />
            <ValueAxis>
              <Grid visible />
            </ValueAxis>
            <Tooltip enabled />
            <Legend verticalAlignment="bottom" horizontalAlignment="center" />
          </Chart>
        </article>
        <article className="panel table-panel">
          <div className="panel-title">
            <h3>活跃账号排名</h3>
            <span>默认按互动量排序</span>
          </div>
          <DataGrid dataSource={model.rankingRows} keyExpr="id" showBorders={false} columnAutoWidth rowAlternationEnabled>
            <SearchPanel visible placeholder="搜索经销商" />
            <Sorting mode="multiple" />
            <Paging defaultPageSize={8} />
            <Column dataField="rank" caption="#" width={56} />
            <Column dataField="dealer" caption="经销商" minWidth={190} />
            <Column dataField="accountCount" caption="账号数" dataType="number" width={82} />
            <Column dataField="activeAccountRate" caption="活跃率" dataType="number" format="percent" width={88} />
            <Column dataField="contentCount" caption="作品" dataType="number" width={72} />
            <Column dataField="newFans" caption="新增粉丝" dataType="number" format="#,##0" />
            <Column dataField="readsOrViews" caption="阅读/播放" dataType="number" format="#,##0" />
            <Column dataField="engagement" caption="互动量" dataType="number" format="#,##0" sortOrder="desc" />
          </DataGrid>
        </article>
      </div>
    </section>
  );
}
