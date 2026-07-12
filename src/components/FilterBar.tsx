import SelectBox from "devextreme-react/select-box";
import type { DashboardFilters, MockDataset } from "../types";

interface FilterBarProps {
  dataset: MockDataset;
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

const viewModes = [
  { value: "apple", label: "Apple 视角" },
  { value: "region", label: "大区视角" },
  { value: "dealer", label: "经销商视角" },
  { value: "store", label: "门店视角" },
];

const platforms = [
  { value: "all", label: "全平台" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "douyin", label: "抖音" },
];

const periods = [
  { value: "7d", label: "7天" },
  { value: "15d", label: "15天" },
  { value: "30d", label: "30天" },
  { value: "3m", label: "3个月" },
  { value: "6m", label: "6个月" },
  { value: "1y", label: "1年" },
];

export function FilterBar({ dataset, filters, onChange }: FilterBarProps) {
  const regionOptions = [{ id: "all", label: "全部大区" }, ...dataset.regions.map((region) => ({ id: region.id, label: region.label }))];
  const dealerOptions = [
    { id: "all", name: "全部经销商" },
    ...dataset.dealers.filter((dealer) => filters.regionId === "all" || dealer.regionId === filters.regionId),
  ];
  const accountOptions = [
    { id: "all", name: "全部门店账号" },
    ...dataset.accounts.filter((account) => {
      if (filters.regionId !== "all" && account.regionId !== filters.regionId) return false;
      if (filters.dealerId !== "all" && account.dealerId !== filters.dealerId) return false;
      if (filters.platform !== "all" && account.platform !== filters.platform) return false;
      return true;
    }),
  ];

  return (
    <section className="filter-bar" aria-label="Dashboard filters">
      <div className="filter-control">
        <span>视角</span>
        <SelectBox
          items={viewModes}
          value={filters.viewMode}
          valueExpr="value"
          displayExpr="label"
          onValueChanged={(event) => onChange({ ...filters, viewMode: event.value })}
        />
      </div>
      <div className="filter-control">
        <span>平台</span>
        <SelectBox
          items={platforms}
          value={filters.platform}
          valueExpr="value"
          displayExpr="label"
          onValueChanged={(event) => onChange({ ...filters, platform: event.value, accountId: "all" })}
        />
      </div>
      <div className="filter-control">
        <span>周期</span>
        <SelectBox
          items={periods}
          value={filters.period}
          valueExpr="value"
          displayExpr="label"
          onValueChanged={(event) => onChange({ ...filters, period: event.value })}
        />
      </div>
      <div className="filter-control">
        <span>大区</span>
        <SelectBox
          items={regionOptions}
          value={filters.regionId}
          valueExpr="id"
          displayExpr="label"
          searchEnabled
          onValueChanged={(event) => onChange({ ...filters, regionId: event.value, dealerId: "all", accountId: "all" })}
        />
      </div>
      <div className="filter-control">
        <span>经销商</span>
        <SelectBox
          items={dealerOptions}
          value={filters.dealerId}
          valueExpr="id"
          displayExpr="name"
          searchEnabled
          onValueChanged={(event) => onChange({ ...filters, dealerId: event.value, accountId: "all" })}
        />
      </div>
      <div className="filter-control wide">
        <span>门店账号</span>
        <SelectBox
          items={accountOptions}
          value={filters.accountId}
          valueExpr="id"
          displayExpr="name"
          searchEnabled
          onValueChanged={(event) => onChange({ ...filters, accountId: event.value })}
        />
      </div>
    </section>
  );
}
