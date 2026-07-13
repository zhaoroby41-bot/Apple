import type { Platform, QuarterKey } from "../types";

export interface KpiTargetSetting {
  id: string;
  platform: Platform;
  quarter: QuarterKey;
  groupId: string;
  groupName: string;
  readsTarget: number;
  engagementTarget: number;
  newFansTarget: number;
  source: "新增" | "导入";
}

export interface DealerGroupSetting {
  id: string;
  name: string;
  dealerIds: string[];
}

export const groupOrder = ["一组", "二组", "三组", "四组"];

export const platformOptions: Array<{ value: Platform; label: string }> = [
  { value: "all", label: "全平台" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "douyin", label: "抖音" },
];

export const initialDealerGroups: DealerGroupSetting[] = [
  { id: "group-1", name: "一组", dealerIds: ["dealer-1", "dealer-2", "dealer-3", "dealer-4", "dealer-5"] },
  { id: "group-2", name: "二组", dealerIds: ["dealer-6", "dealer-7", "dealer-8", "dealer-9", "dealer-10", "dealer-11"] },
  { id: "group-3", name: "三组", dealerIds: ["dealer-12", "dealer-13", "dealer-14", "dealer-15", "dealer-16", "dealer-17", "dealer-18"] },
  { id: "group-4", name: "四组", dealerIds: ["dealer-19", "dealer-20", "dealer-21", "dealer-22", "dealer-23", "dealer-24"] },
];

export const initialKpiTargets: KpiTargetSetting[] = [
  { id: "target-2026q3-1", platform: "all", quarter: "2026Q3", groupId: "group-1", groupName: "一组", readsTarget: 3600000, engagementTarget: 340000, newFansTarget: 46000, source: "导入" },
  { id: "target-2026q3-2", platform: "all", quarter: "2026Q3", groupId: "group-2", groupName: "二组", readsTarget: 5200000, engagementTarget: 490000, newFansTarget: 62000, source: "导入" },
  { id: "target-2026q3-3", platform: "all", quarter: "2026Q3", groupId: "group-3", groupName: "三组", readsTarget: 7600000, engagementTarget: 720000, newFansTarget: 91000, source: "导入" },
  { id: "target-2026q3-4", platform: "all", quarter: "2026Q3", groupId: "group-4", groupName: "四组", readsTarget: 6400000, engagementTarget: 610000, newFansTarget: 78000, source: "导入" },
  { id: "target-2026q2-1", platform: "all", quarter: "2026Q2", groupId: "group-1", groupName: "一组", readsTarget: 3300000, engagementTarget: 310000, newFansTarget: 42000, source: "导入" },
  { id: "target-2026q2-2", platform: "all", quarter: "2026Q2", groupId: "group-2", groupName: "二组", readsTarget: 4800000, engagementTarget: 450000, newFansTarget: 58000, source: "导入" },
  { id: "target-2026q2-3", platform: "all", quarter: "2026Q2", groupId: "group-3", groupName: "三组", readsTarget: 7100000, engagementTarget: 680000, newFansTarget: 84000, source: "导入" },
  { id: "target-2026q2-4", platform: "all", quarter: "2026Q2", groupId: "group-4", groupName: "四组", readsTarget: 5900000, engagementTarget: 560000, newFansTarget: 72000, source: "导入" },
];

export function sortKpiTargets(targets: KpiTargetSetting[]) {
  return [...targets].sort((a, b) => {
    const quarterDiff = b.quarter.localeCompare(a.quarter);
    if (quarterDiff !== 0) return quarterDiff;
    const groupDiff = groupOrder.indexOf(a.groupName) - groupOrder.indexOf(b.groupName);
    if (groupDiff !== 0) return groupDiff;
    return a.platform.localeCompare(b.platform);
  });
}
