export type ItemAlertStatus = "NORMAL" | "EXPIRING" | "EXPIRED" | "LOW_STOCK";
export type ItemAlertType = "EXPIRING" | "EXPIRED" | "LOW_STOCK";

export type AlertRuleItem = {
  expiryDate?: Date | string | null;
  id: number;
  name: string;
  quantity: number;
};

export type AlertRuleOptions = {
  currentDate?: Date | string;
  expiringDays?: number;
  lowStockThreshold?: number;
};

export type EvaluatedAlert = {
  daysUntilExpiry?: number;
  quantity?: number;
  threshold?: number;
  type: ItemAlertType;
};

export type EvaluatedItemAlerts = {
  alerts: EvaluatedAlert[];
  status: ItemAlertStatus;
};

export function evaluateItemAlerts(
  item: AlertRuleItem,
  options: AlertRuleOptions = {}
): EvaluatedItemAlerts {
  const expiringDays = options.expiringDays ?? 7;
  const lowStockThreshold = options.lowStockThreshold ?? 1;
  const alerts: EvaluatedAlert[] = [];
  const daysUntilExpiry = calculateDaysUntilExpiry(item.expiryDate, options.currentDate);

  if (daysUntilExpiry !== null && daysUntilExpiry < 0) {
    alerts.push({ daysUntilExpiry, type: "EXPIRED" });
  } else if (daysUntilExpiry !== null && daysUntilExpiry <= expiringDays) {
    alerts.push({ daysUntilExpiry, type: "EXPIRING" });
  }

  if (item.quantity <= lowStockThreshold) {
    alerts.push({ quantity: item.quantity, threshold: lowStockThreshold, type: "LOW_STOCK" });
  }

  return { alerts, status: getPrimaryStatus(alerts) };
}

function getPrimaryStatus(alerts: EvaluatedAlert[]): ItemAlertStatus {
  if (alerts.some((alert) => alert.type === "EXPIRED")) {
    return "EXPIRED";
  }

  if (alerts.some((alert) => alert.type === "EXPIRING")) {
    return "EXPIRING";
  }

  if (alerts.some((alert) => alert.type === "LOW_STOCK")) {
    return "LOW_STOCK";
  }

  return "NORMAL";
}

function calculateDaysUntilExpiry(expiryDate: AlertRuleItem["expiryDate"], currentDate?: Date | string) {
  if (!expiryDate) {
    return null;
  }

  const expiry = toUtcDateOnly(expiryDate);
  const current = toUtcDateOnly(currentDate ?? new Date());
  if (!expiry || !current) {
    return null;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((expiry.getTime() - current.getTime()) / millisecondsPerDay);
}

function toUtcDateOnly(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
