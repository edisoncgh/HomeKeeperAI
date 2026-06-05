import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getSyncedAlertSummary: vi.fn(),
  prisma: {
    category: { count: vi.fn(), findMany: vi.fn() },
    item: { aggregate: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    location: { count: vi.fn(), findMany: vi.fn() }
  }
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

vi.mock("@/lib/api/alerts", () => ({
  getSyncedAlertSummary: mocks.getSyncedAlertSummary
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma
}));

import { getStatsDistribution, getStatsOverview } from "@/lib/api/stats";

describe("stats API helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSyncedAlertSummary.mockResolvedValue({
      expired: 1,
      expiring: 2,
      lowStock: 3,
      pending: 6,
      resolved: 4
    });
    mocks.prisma.category.count.mockResolvedValue(2);
    mocks.prisma.category.findMany.mockResolvedValue([]);
    mocks.prisma.item.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
    mocks.prisma.location.count.mockResolvedValue(3);
    mocks.prisma.location.findMany.mockResolvedValue([]);
    mocks.prisma.item.count.mockResolvedValue(0);
    mocks.prisma.item.groupBy.mockResolvedValue([]);
  });

  it("rejects unauthenticated overview requests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await getStatsOverview();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: 401, message: "请先登录。" });
  });

  it("returns inventory totals, alert summary, and item status counts", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    mocks.prisma.item.aggregate.mockResolvedValue({ _sum: { quantity: 18 } });
    mocks.prisma.item.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const response = await getStatsOverview();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      alerts: { expired: 1, expiring: 2, lowStock: 3, pending: 6 },
      status: { expired: 1, expiring: 1, lowStock: 1, normal: 2 },
      totals: { categories: 2, items: 5, locations: 3, quantity: 18 }
    });
  });

  it("returns category and location distribution with unassigned buckets", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1, username: "admin" });
    mocks.prisma.item.groupBy
      .mockResolvedValueOnce([
        { _count: { _all: 2 }, _sum: { quantity: 5 }, categoryId: 1 },
        { _count: { _all: 1 }, _sum: { quantity: 2 }, categoryId: null }
      ])
      .mockResolvedValueOnce([
        { _count: { _all: 2 }, _sum: { quantity: 6 }, locationId: 3 },
        { _count: { _all: 1 }, _sum: { quantity: 1 }, locationId: null }
      ]);
    mocks.prisma.category.findMany.mockResolvedValue([
      { color: "#4FBF8F", icon: "🍎", id: 1, name: "食品" }
    ]);
    mocks.prisma.location.findMany.mockResolvedValue([
      { color: "#7AA7FF", icon: "❄️", id: 3, name: "冰箱" }
    ]);

    const response = await getStatsDistribution();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      categories: [{ color: "#4FBF8F", icon: "🍎", id: 1, itemCount: 2, name: "食品", quantity: 5 }],
      locations: [{ color: "#7AA7FF", icon: "❄️", id: 3, itemCount: 2, name: "冰箱", quantity: 6 }],
      uncategorized: { itemCount: 1, quantity: 2 },
      unlocated: { itemCount: 1, quantity: 1 }
    });
  });
});
