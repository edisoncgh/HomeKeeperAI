import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  prisma: {
    alert: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    item: {
      findMany: vi.fn(),
      update: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma
}));

import { listAlerts, resolveAlert } from "@/lib/api/alerts";

describe("alert API helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(async (input) => {
      return typeof input === "function" ? input(mocks.prisma) : Promise.all(input);
    });
    mocks.prisma.alert.count.mockResolvedValue(0);
    mocks.prisma.alert.findMany.mockResolvedValue([]);
    mocks.prisma.item.findMany.mockResolvedValue([]);
  });

  it("rejects unauthenticated list requests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await listAlerts(new Request("http://localhost/api/alerts"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: 401, message: "请先登录。" });
  });

  it("syncs item status and creates missing pending alerts before listing", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, username: "admin" });
    mocks.prisma.item.findMany.mockResolvedValue([
      {
        expiryDate: new Date("2000-01-01T00:00:00.000Z"),
        id: 7,
        name: "牛奶",
        quantity: 2,
        status: "NORMAL"
      }
    ]);
    mocks.prisma.alert.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          createdAt: new Date("2026-06-04T00:00:00.000Z"),
          id: 11,
          item: { id: 7, name: "牛奶", quantity: 2, status: "EXPIRED" },
          itemId: 7,
          status: "PENDING",
          type: "EXPIRED"
        }
      ]);

    const response = await listAlerts(new Request("http://localhost/api/alerts"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.alerts).toHaveLength(1);
    expect(mocks.prisma.item.update).toHaveBeenCalledWith({
      data: { status: "EXPIRED" },
      where: { id: 7 }
    });
    expect(mocks.prisma.alert.create).toHaveBeenCalledWith({
      data: { itemId: 7, status: "PENDING", type: "EXPIRED" }
    });
  });

  it("resolves pending alerts when their rule no longer matches", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, username: "admin" });
    mocks.prisma.item.findMany.mockResolvedValue([
      {
        expiryDate: null,
        id: 7,
        name: "纸巾",
        quantity: 4,
        status: "LOW_STOCK"
      }
    ]);
    mocks.prisma.alert.findMany
      .mockResolvedValueOnce([{ id: 12, itemId: 7, status: "PENDING", type: "LOW_STOCK" }])
      .mockResolvedValueOnce([]);

    await listAlerts(new Request("http://localhost/api/alerts"));

    expect(mocks.prisma.item.update).toHaveBeenCalledWith({
      data: { status: "NORMAL" },
      where: { id: 7 }
    });
    expect(mocks.prisma.alert.update).toHaveBeenCalledWith({
      data: { status: "RESOLVED" },
      where: { id: 12 }
    });
  });

  it("does not recreate a pending alert when an active rule already has a resolved alert", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, username: "admin" });
    mocks.prisma.item.findMany.mockResolvedValue([
      {
        expiryDate: new Date("2000-01-01T00:00:00.000Z"),
        id: 7,
        name: "牛奶",
        quantity: 2,
        status: "EXPIRED"
      }
    ]);
    mocks.prisma.alert.findMany
      .mockImplementationOnce(async (query) => {
        return query.where.status === "PENDING"
          ? []
          : [{ id: 15, itemId: 7, status: "RESOLVED", type: "EXPIRED" }];
      })
      .mockResolvedValueOnce([]);

    await listAlerts(new Request("http://localhost/api/alerts?status=RESOLVED"));

    expect(mocks.prisma.alert.create).not.toHaveBeenCalled();
  });

  it("deletes duplicated pending alerts when the same active rule was already resolved", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, username: "admin" });
    mocks.prisma.item.findMany.mockResolvedValue([
      {
        expiryDate: new Date("2000-01-01T00:00:00.000Z"),
        id: 7,
        name: "牛奶",
        quantity: 2,
        status: "EXPIRED"
      }
    ]);
    mocks.prisma.alert.findMany
      .mockResolvedValueOnce([
        { id: 15, itemId: 7, status: "RESOLVED", type: "EXPIRED" },
        { id: 16, itemId: 7, status: "PENDING", type: "EXPIRED" }
      ])
      .mockResolvedValueOnce([]);

    await listAlerts(new Request("http://localhost/api/alerts?status=PENDING"));

    expect(mocks.prisma.alert.create).not.toHaveBeenCalled();
    expect(mocks.prisma.alert.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [16] } } });
  });

  it("deletes duplicated resolved ghost alerts for the same item and type", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, username: "admin" });
    mocks.prisma.item.findMany.mockResolvedValue([
      {
        expiryDate: new Date("2000-01-01T00:00:00.000Z"),
        id: 7,
        name: "牛奶",
        quantity: 2,
        status: "EXPIRED"
      }
    ]);
    mocks.prisma.alert.findMany
      .mockResolvedValueOnce([
        { createdAt: new Date("2026-06-04T00:00:00.000Z"), id: 15, itemId: 7, status: "RESOLVED", type: "EXPIRED" },
        { createdAt: new Date("2026-06-04T00:01:00.000Z"), id: 16, itemId: 7, status: "RESOLVED", type: "EXPIRED" }
      ])
      .mockResolvedValueOnce([]);

    await listAlerts(new Request("http://localhost/api/alerts?status=RESOLVED"));

    expect(mocks.prisma.alert.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [16] } } });
  });

  it("applies alert filters and pagination to list requests", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, username: "admin" });
    mocks.prisma.alert.count
      .mockResolvedValueOnce(21)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4);

    const response = await listAlerts(
      new Request("http://localhost/api/alerts?type=LOW_STOCK&status=PENDING&page=2&pageSize=10")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.pagination).toEqual({ page: 2, pageCount: 3, pageSize: 10, total: 21 });
    expect(body.data.summary).toEqual({ expired: 3, expiring: 2, lowStock: 3, pending: 8, resolved: 4 });
    expect(mocks.prisma.alert.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: { status: "PENDING", type: "LOW_STOCK" }
      })
    );
  });

  it("rejects unauthenticated resolve requests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await resolveAlert(12);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: 401, message: "请先登录。" });
  });

  it("marks a pending alert as resolved", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, username: "admin" });
    mocks.prisma.alert.update.mockResolvedValue({
      createdAt: new Date("2026-06-04T00:00:00.000Z"),
      id: 12,
      item: { id: 7, name: "纸巾", quantity: 1, status: "LOW_STOCK" },
      itemId: 7,
      status: "RESOLVED",
      type: "LOW_STOCK"
    });

    const response = await resolveAlert(12);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.alert).toMatchObject({ id: 12, status: "RESOLVED", type: "LOW_STOCK" });
    expect(mocks.prisma.alert.update).toHaveBeenCalledWith({
      data: { status: "RESOLVED" },
      select: expect.any(Object),
      where: { id: 12 }
    });
    expect(mocks.prisma.item.update).not.toHaveBeenCalled();
  });

  it("returns 404 when resolving a missing alert", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, username: "admin" });
    mocks.prisma.alert.update.mockRejectedValue({ code: "P2025" });

    const response = await resolveAlert(404);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({ code: 404, message: "预警不存在。" });
  });
});
