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
    </section>
  );
}
