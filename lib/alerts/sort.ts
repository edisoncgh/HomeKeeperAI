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
  if (alert.type === "LOW_STOCK") {
    return alert.quantity ?? Number.MAX_SAFE_INTEGER;
  }

  return alert.daysUntilExpiry ?? Number.MAX_SAFE_INTEGER;
}
