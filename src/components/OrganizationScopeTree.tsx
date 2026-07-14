import TreeList, { Column, Scrolling, SearchPanel, Selection } from "devextreme-react/tree-list";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { DashboardFilters, MockDataset, StoreAccount } from "../types";

interface ScopeRow {
  id: string;
  parentId: string | null;
  name: string;
  count: number;
  type: "root" | "dealer" | "region";
  dealerId?: string;
  regionId?: string;
}

interface OrganizationScopeTreeProps {
  dataset: MockDataset;
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function accountVisibleByPermission(dataset: MockDataset, account: StoreAccount) {
  if (dataset.currentUser.role === "apple") return true;
  return dataset.currentUser.dealerId === account.dealerId;
}

function accountVisibleInTree(dataset: MockDataset, filters: DashboardFilters, account: StoreAccount) {
  if (!accountVisibleByPermission(dataset, account)) return false;
  return filters.platform === "all" || account.platform === filters.platform;
}

function buildRows(dataset: MockDataset, filters: DashboardFilters): ScopeRow[] {
  const rows: ScopeRow[] = [];
  const visibleDealers =
    dataset.currentUser.role === "apple"
      ? dataset.dealers
      : dataset.dealers.filter((dealer) => dealer.id === dataset.currentUser.dealerId);
  const visibleAccounts = dataset.accounts.filter((account) => accountVisibleInTree(dataset, filters, account));
  const regionMap = new Map(dataset.regions.map((region) => [region.id, region]));
  const rootId = "root:all";

  if (dataset.currentUser.role === "apple") {
    rows.push({
      id: rootId,
      parentId: null,
      name: "一级经销商55家",
      count: visibleAccounts.length,
      type: "root",
    });
  }

  visibleDealers.forEach((dealer) => {
    const dealerAccounts = visibleAccounts.filter((account) => account.dealerId === dealer.id);
    const dealerId = `dealer:${dealer.id}`;
    rows.push({
      id: dealerId,
      parentId: dataset.currentUser.role === "apple" ? rootId : null,
      name: dealer.name,
      count: dealerAccounts.length,
      type: "dealer",
      dealerId: dealer.id,
    });

    const regionIds = Array.from(new Set(dealerAccounts.map((account) => account.regionId).filter(Boolean))) as string[];
    regionIds.forEach((regionId) => {
      const regionAccounts = dealerAccounts.filter((account) => account.regionId === regionId);
      rows.push({
        id: `region:${dealer.id}:${regionId}`,
        parentId: dealerId,
        name: regionMap.get(regionId)?.label ?? regionId,
        count: regionAccounts.length,
        type: "region",
        dealerId: dealer.id,
        regionId,
      });
    });
  });

  return rows.filter((row) => row.type === "root" || row.count > 0);
}

function normalizeSelection(keys: string[], currentSelectedKeys: string[]) {
  if (currentSelectedKeys.includes("root:all")) return ["root:all"];
  const scopedKeys = keys.filter((key) => key !== "root:all");
  return scopedKeys.length === 0 ? ["root:all"] : scopedKeys;
}

function selectedKeys(filters: DashboardFilters) {
  return filters.scopeNodeIds && filters.scopeNodeIds.length > 0 ? filters.scopeNodeIds : ["root:all"];
}

export function OrganizationScopeTree({ dataset, filters, onChange, collapsed, onToggleCollapsed }: OrganizationScopeTreeProps) {
  const rows = buildRows(dataset, filters);
  const defaultExpandedRowKeys = dataset.currentUser.role === "apple" ? ["root:all"] : [];

  function changeSelection(keys: string[], currentSelectedKeys: string[]) {
    const normalized = normalizeSelection(keys, currentSelectedKeys);
    onChange({
      ...filters,
      scopeNodeIds: normalized,
      dealerId: "all",
      regionId: "all",
      accountId: "all",
    });
  }

  if (collapsed) {
    return (
      <aside className="org-scope-panel org-scope-panel-collapsed" aria-label="组织账号范围">
        <button type="button" className="scope-collapse-button" onClick={onToggleCollapsed} title="展开组织账号范围" aria-label="展开组织账号范围">
          <PanelLeftOpen size={17} strokeWidth={2} />
        </button>
        <span className="scope-rail-label">范围</span>
      </aside>
    );
  }

  return (
    <aside className="org-scope-panel">
      <button type="button" className="scope-collapse-button" onClick={onToggleCollapsed} title="收起组织账号范围" aria-label="收起组织账号范围">
        <PanelLeftClose size={17} strokeWidth={2} />
      </button>
      <div className="org-scope-header">
        <p className="eyebrow">Account Hierarchy</p>
        <h2>组织账号范围</h2>
        <span>支持多选经销商和大区，右侧数据会聚合到所选范围</span>
      </div>
      <TreeList
        className="org-scope-treelist"
        dataSource={rows}
        keyExpr="id"
        parentIdExpr="parentId"
        rootValue={null}
        defaultExpandedRowKeys={defaultExpandedRowKeys}
        showColumnHeaders={false}
        showBorders={false}
        columnAutoWidth={false}
        wordWrapEnabled={false}
        selectedRowKeys={selectedKeys(filters)}
        onSelectionChanged={(event) => changeSelection(event.selectedRowKeys as string[], event.currentSelectedRowKeys as string[])}
      >
        <SearchPanel visible placeholder="Search" width="100%" />
        <Selection mode="multiple" recursive={false} selectByClick />
        <Scrolling mode="standard" />
        <Column dataField="name" caption="组织" minWidth={190} cellRender={(cell) => <span className={`org-scope-name org-scope-name-${cell.data.type}`}>{cell.value}</span>} />
        <Column dataField="count" caption="账号数" width={58} alignment="right" cellRender={(cell) => <strong className="org-scope-count">{cell.value}</strong>} />
      </TreeList>
    </aside>
  );
}
