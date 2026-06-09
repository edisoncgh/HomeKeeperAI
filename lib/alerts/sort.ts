import type { EvaluatedAlert } from "@/lib/alerts/rules";

export type SortableAlert = EvaluatedAlert & {
  itemId: number;
};

const ALERT_SEVERITY: Record<SortableAlert["type"], number> = {
  EXPIRED: 0,
  EXPIRING: 1,
  LOW_STOCK: 2
};

export function sortAlertsForDisplay<T extends SortableAlert>(alerts: T[]) {
  return [...alerts].sort((left, right) => {
    const severityDiff = ALERT_SEVERITY[left.type] - ALERT_SEVERITY[right.type];

    if (severityDiff !== 0) {
      return severityDiff;
    }

    return getUrgencySortValue(left) - getUrgencySortValue(right);
  });
}

function getUrgencySortValue(alert: SortableAlert) {
  const fallback = Number.MAX_SAFE_INTEGER;
  if (alert.type === "LOW_STOCK") {
    return isFiniteNumber(alert.quantity) ? alert.quantity : fallback;
  }

  return isFiniteNumber(alert.daysUntilExpiry) ? alert.daysUntilExpiry : fallback;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
