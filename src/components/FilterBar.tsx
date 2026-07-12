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
        <span>当前范围</span>
        <SelectBox
          items={[{ value: "tree", label: "由左侧组织树选择" }]}
          value="tree"
          valueExpr="value"
          displayExpr="label"
          disabled
        />
      </div>
    </section>
  );
}
