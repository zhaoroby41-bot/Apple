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
        <p>按大区和平台观察账号活跃状态，并定位本周期新增粉丝、阅读/播放和互动表现靠前的门店账号。</p>
      </div>
      <div className="analysis-grid">
        <article className="panel chart-panel">
          <Chart dataSource={model.activeDistribution} palette={["#188038", "#fbbc04", "#9aa0a6"]}>
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
            <SearchPanel visible placeholder="搜索账号/经销商" />
            <Sorting mode="multiple" />
            <Paging defaultPageSize={8} />
            <Column dataField="rank" caption="#" width={56} />
            <Column dataField="account" caption="账号" minWidth={190} />
            <Column dataField="platform" caption="平台" width={76} />
            <Column dataField="region" caption="大区" width={70} />
            <Column dataField="contentCount" caption="作品" dataType="number" width={72} />
            <Column dataField="newFans" caption="新增粉丝" dataType="number" format="#,##0" />
            <Column dataField="readsOrViews" caption="阅读/播放" dataType="number" format="#,##0" />
            <Column dataField="engagement" caption="互动量" dataType="number" format="#,##0" sortOrder="desc" />
            <Column dataField="activeStatus" caption="状态" width={86} />
          </DataGrid>
        </article>
      </div>
    </section>
  );
}
