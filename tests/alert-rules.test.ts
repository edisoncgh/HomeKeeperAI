import { describe, expect, it } from "vitest";
import { evaluateItemAlerts } from "@/lib/alerts/rules";
import { sortAlertsForDisplay } from "@/lib/alerts/sort";

describe("evaluateItemAlerts", () => {
  it("marks items past their expiry date as expired", () => {
    const result = evaluateItemAlerts(
      {
        expiryDate: "2026-06-03",
        id: 1,
        name: "牛奶",
        quantity: 2
      },
      { currentDate: "2026-06-04" }
    );

    expect(result.status).toBe("EXPIRED");
    expect(result.alerts).toEqual([
      {
        daysUntilExpiry: -1,
        type: "EXPIRED"
      }
    ]);
  });

  it("marks items within the default expiry window as expiring", () => {
    const result = evaluateItemAlerts(
      {
        expiryDate: "2026-06-08",
        id: 1,
        name: "酸奶",
        quantity: 3
      },
      { currentDate: "2026-06-04" }
    );

    expect(result.status).toBe("EXPIRING");
    expect(result.alerts).toEqual([
      {
        daysUntilExpiry: 4,
        type: "EXPIRING"
      }
    ]);
  });

  it("marks items at the default low stock threshold as low stock", () => {
    const result = evaluateItemAlerts(
      {
        expiryDate: null,
        id: 1,
        name: "纸巾",
        quantity: 1
      },
      { currentDate: "2026-06-04" }
    );

    expect(result.status).toBe("LOW_STOCK");
    expect(result.alerts).toEqual([
      {
        quantity: 1,
        threshold: 1,
        type: "LOW_STOCK"
      }
    ]);
  });

  it("keeps multiple alerts while using the highest priority item status", () => {
    const result = evaluateItemAlerts(
      {
        expiryDate: "2026-06-03",
        id: 1,
        name: "奶酪",
        quantity: 1
      },
      { currentDate: "2026-06-04" }
    );

    expect(result.status).toBe("EXPIRED");
    expect(result.alerts).toEqual([
      {
        daysUntilExpiry: -1,
        type: "EXPIRED"
      },
      {
        quantity: 1,
        threshold: 1,
        type: "LOW_STOCK"
      }
    ]);
  });

  it("keeps healthy items normal when no rule matches", () => {
    const result = evaluateItemAlerts(
      {
        expiryDate: null,
        id: 1,
        name: "洗衣液",
        quantity: 4
      },
      { currentDate: "2026-06-04" }
    );

    expect(result).toEqual({ alerts: [], status: "NORMAL" });
  });

  it("honors custom expiry and low stock thresholds", () => {
    const result = evaluateItemAlerts(
      {
        expiryDate: "2026-06-12",
        id: 1,
        name: "米粉",
        quantity: 2
      },
      { currentDate: "2026-06-04", expiringDays: 10, lowStockThreshold: 3 }
    );

    expect(result.status).toBe("EXPIRING");
    expect(result.alerts).toEqual([
      {
        daysUntilExpiry: 8,
        type: "EXPIRING"
      },
      {
        quantity: 2,
        threshold: 3,
        type: "LOW_STOCK"
      }
    ]);
  });
});

describe("sortAlertsForDisplay", () => {
  it("sorts mixed alerts by severity and urgency", () => {
    const sorted = sortAlertsForDisplay([
      { itemId: 1, quantity: 2, threshold: 3, type: "LOW_STOCK" },
      { daysUntilExpiry: 5, itemId: 2, type: "EXPIRING" },
      { daysUntilExpiry: -1, itemId: 3, type: "EXPIRED" },
      { daysUntilExpiry: -4, itemId: 4, type: "EXPIRED" },
      { itemId: 5, quantity: 1, threshold: 3, type: "LOW_STOCK" },
      { daysUntilExpiry: 1, itemId: 6, type: "EXPIRING" }
    ]);

    expect(sorted.map((alert) => alert.itemId)).toEqual([4, 3, 6, 2, 5, 1]);
  });
});
