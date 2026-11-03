import { db } from "./db";

export const LISTS = {
  SERVICE_AREA: "Service areas",
  CUSTOMER_STATUS: "Customer statuses",
  PROJECT_STATUS: "Project statuses",
} as const;
export type ListKey = keyof typeof LISTS;

/** Active items for a dropdown. `keepIds` keeps a record's current (possibly disabled) value selectable. */
export function getList(list: ListKey, keepIds: number[] = []) {
  return db.listItem.findMany({
    where: { list, OR: [{ active: true }, { id: { in: keepIds } }] },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

/** Every item, including disabled ones (for filters and the settings screen). */
export function getAllList(list: ListKey) {
  return db.listItem.findMany({ where: { list }, orderBy: [{ sortOrder: "asc" }, { label: "asc" }] });
}
