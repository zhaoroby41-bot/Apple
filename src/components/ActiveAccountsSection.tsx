import Chart, { ArgumentAxis, CommonSeriesSettings, Grid, Legend, Series, Tooltip, ValueAxis } from "devextreme-react/chart";
import DataGrid, { Column, Paging, SearchPanel, Sorting } from "devextreme-react/data-grid";
import type { DashboardModel } from "../lib/metrics";

interface ActivityTooltipPoint {
  argumentText: string;
  point?: {
    data?: {
      dealer: string;
      active: number;
      lowActive: number;
      inactive: number;
    };
  };
}

export function ActiveAccountsSection({ model }: { model: DashboardModel }) {
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
          <Chart dataSource={model.activeDistribution} palette={["#2f855a", "#b7791f", "#a1a1a6"]}>
            <CommonSeriesSettings argumentField="key" type="stackedbar" />
            <Series valueField="active" name="活跃" />
            <Series valueField="lowActive" name="低活跃" />
            <Series valueField="inactive" name="未活跃" />
            <ArgumentAxis argumentType="string" />
            <ValueAxis>
              <Grid visible />
            </ValueAxis>
            <Tooltip
              enabled
              customizeTooltip={(point: ActivityTooltipPoint) => {
                const data = point.point?.data;
                return {
                  text: data
                    ? `${data.dealer}<br/>活跃：${data.active}<br/>低活跃：${data.lowActive}<br/>未活跃：${data.inactive}`
                    : point.argumentText,
                };
              }}
            />
            <Legend verticalAlignment="bottom" horizontalAlignment="center" />
          </Chart>
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
