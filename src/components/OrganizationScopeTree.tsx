import TreeView from "devextreme-react/tree-view";
import type { DashboardFilters, MockDataset, StoreAccount } from "../types";

interface ScopeNode {
  id: string;
  text: string;
  count: number;
  type: "root" | "dealer" | "region" | "account";
  dealerId?: string;
  regionId?: string;
  accountId?: string;
  expanded?: boolean;
  items?: ScopeNode[];
}

interface OrganizationScopeTreeProps {
  dataset: MockDataset;
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

const platformLabel = {
  xiaohongshu: "小红书",
  douyin: "抖音",
};

function accountVisibleByPermission(dataset: MockDataset, account: StoreAccount) {
  if (dataset.currentUser.role === "apple") return true;
  return dataset.currentUser.dealerId === account.dealerId;
}

function buildTree(dataset: MockDataset): ScopeNode[] {
  const visibleDealers =
    dataset.currentUser.role === "apple"
      ? dataset.dealers
      : dataset.dealers.filter((dealer) => dealer.id === dataset.currentUser.dealerId);
  const regionMap = new Map(dataset.regions.map((region) => [region.id, region]));
  const visibleAccounts = dataset.accounts.filter((account) => accountVisibleByPermission(dataset, account));

  const dealerNodes: ScopeNode[] = visibleDealers.map((dealer, index) => {
    const dealerAccounts = visibleAccounts.filter((account) => account.dealerId === dealer.id);
    const directAccounts = dealerAccounts.filter((account) => account.regionId === null);
    const regionIds = Array.from(new Set(dealerAccounts.map((account) => account.regionId).filter(Boolean))) as string[];
    const children: ScopeNode[] = [];

    regionIds.forEach((regionId) => {
      const region = regionMap.get(regionId);
      const regionAccounts = dealerAccounts.filter((account) => account.regionId === regionId);
      children.push({
        id: `region:${dealer.id}:${regionId}`,
        text: region?.label ?? regionId,
        count: regionAccounts.length,
        type: "region",
        dealerId: dealer.id,
        regionId,
        expanded: index === 0,
        items: regionAccounts.map((account) => ({
          id: `account:${account.id}`,
          text: `${account.city} ${platformLabel[account.platform]}门店号`,
          count: 1,
          type: "account",
          dealerId: dealer.id,
          regionId,
          accountId: account.id,
        })),
      });
    });

    directAccounts.forEach((account) => {
      children.push({
        id: `account:${account.id}`,
        text: `${account.city} ${platformLabel[account.platform]}门店号`,
        count: 1,
        type: "account",
        dealerId: dealer.id,
        regionId: "direct",
        accountId: account.id,
      });
    });

    return {
      id: `dealer:${dealer.id}`,
      text: dealer.name,
      count: dealerAccounts.length,
      type: "dealer",
      dealerId: dealer.id,
      expanded: index === 0,
      items: children,
    };
  });

  if (dataset.currentUser.role === "dealer" && dealerNodes.length === 1) {
    return dealerNodes;
  }

  return [
    {
      id: "root:all",
      text: "一级经销商55家",
      count: visibleAccounts.length,
      type: "root",
      expanded: true,
      items: dealerNodes,
    },
  ];
}

function flatten(nodes: ScopeNode[]): ScopeNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.items ?? [])]);
}

function selectedNodeId(nodes: ScopeNode[], filters: DashboardFilters) {
  if (filters.accountId !== "all") return `account:${filters.accountId}`;
  if (filters.dealerId !== "all" && filters.regionId !== "all") return `region:${filters.dealerId}:${filters.regionId}`;
  if (filters.dealerId !== "all") return `dealer:${filters.dealerId}`;
  return nodes[0]?.id ?? "root:all";
}

export function OrganizationScopeTree({ dataset, filters, onChange }: OrganizationScopeTreeProps) {
  const tree = buildTree(dataset);
  const nodes = flatten(tree);

  function selectNode(node?: ScopeNode) {
    if (!node) return;
    if (node.type === "root") {
      onChange({ ...filters, dealerId: "all", regionId: "all", accountId: "all" });
    } else if (node.type === "dealer") {
      onChange({ ...filters, dealerId: node.dealerId ?? "all", regionId: "all", accountId: "all" });
    } else if (node.type === "region") {
      onChange({ ...filters, dealerId: node.dealerId ?? "all", regionId: node.regionId ?? "all", accountId: "all" });
    } else {
      onChange({
        ...filters,
        dealerId: node.dealerId ?? "all",
        regionId: node.regionId ?? "all",
        accountId: node.accountId ?? "all",
      });
    }
  }

  return (
    <aside className="org-scope-panel">
      <div className="org-scope-header">
        <p className="eyebrow">Account Hierarchy</p>
        <h2>组织账号范围</h2>
        <span>经销商 / 大区 / 门店</span>
      </div>
      <TreeView
        items={tree}
        dataStructure="tree"
        keyExpr="id"
        displayExpr="text"
        selectionMode="single"
        selectByClick
        searchEnabled
        searchMode="contains"
        selectedItemKeys={[selectedNodeId(tree, filters)]}
        onItemClick={(event) => selectNode(nodes.find((node) => node.id === event.itemData?.id))}
        itemRender={(item: ScopeNode) => (
          <div className={`org-tree-item org-tree-item-${item.type}`}>
            <span>{item.text}</span>
            <strong>{item.count}</strong>
          </div>
        )}
      />
    </aside>
  );
}
