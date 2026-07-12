import SelectBox from "devextreme-react/select-box";
import type { DashboardFilters, MockDataset } from "../types";

interface FilterBarProps {
  dataset: MockDataset;
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

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
  const visibleDealerIds =
    dataset.currentUser.role === "dealer" && dataset.currentUser.dealerId ? new Set([dataset.currentUser.dealerId]) : new Set(dataset.dealers.map((dealer) => dealer.id));
  const selectedDealer = dataset.dealers.find((dealer) => dealer.id === filters.dealerId);
  const visibleAccounts = dataset.accounts.filter((account) => {
    if (!visibleDealerIds.has(account.dealerId)) return false;
    if (filters.dealerId !== "all" && account.dealerId !== filters.dealerId) return false;
    if (filters.platform !== "all" && account.platform !== filters.platform) return false;
    return true;
  });
  const regionIds = new Set(visibleAccounts.map((account) => account.regionId ?? "direct"));
  const regionOptions =
    selectedDealer?.hasRegionLayer === false
      ? [{ id: "all", label: "全部门店（无大区层）" }]
      : [
          { id: "all", label: "全部大区/直营" },
          ...dataset.regions.filter((region) => regionIds.has(region.id)).map((region) => ({ id: region.id, label: region.label })),
          ...(regionIds.has("direct") ? [{ id: "direct", label: "未分大区" }] : []),
        ];
  const dealerOptions = [
    ...(dataset.currentUser.role === "apple" ? [{ id: "all", name: "全部经销商" }] : []),
    ...dataset.dealers.filter((dealer) => visibleDealerIds.has(dealer.id)),
  ];
  const accountOptions = [
    { id: "all", name: "全部门店账号" },
    ...visibleAccounts.filter((account) => filters.regionId === "all" || (filters.regionId === "direct" ? account.regionId === null : account.regionId === filters.regionId)),
  ];

  return (
    <section className="filter-bar" aria-label="Dashboard filters">
      <div className="filter-control">
        <span>权限</span>
        <SelectBox
          items={[{ value: dataset.currentUser.role, label: dataset.currentUser.role === "apple" ? "Apple 总部" : "经销商账号" }]}
          value={dataset.currentUser.role}
          valueExpr="value"
          displayExpr="label"
          disabled
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
          disabled={dataset.currentUser.role === "dealer"}
          onValueChanged={(event) => onChange({ ...filters, dealerId: event.value, regionId: "all", accountId: "all" })}
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
