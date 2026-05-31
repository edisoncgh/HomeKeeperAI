import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    category: { findUnique: vi.fn() },
    item: { count: vi.fn(), findMany: vi.fn() },
    location: { findUnique: vi.fn() }
  },
  tx: {
    item: { create: vi.fn(), findUniqueOrThrow: vi.fn() },
    itemRecord: { create: vi.fn() }
  }
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma
}));

import { createItem, listItems } from "@/lib/api/items";

describe("item API helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(async (input) => {
      return typeof input === "function" ? input(mocks.tx) : Promise.all(input);
    });
  });

  it("rejects unauthenticated list requests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await listItems(new Request("http://localhost/api/items"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: 401, message: "请先登录。" });
  });

  it("creates an item and writes the initial IN record", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, username: "admin" });
    mocks.prisma.category.findUnique.mockResolvedValue({ id: 1 });
    mocks.prisma.location.findUnique.mockResolvedValue({ id: 2 });
    mocks.tx.item.create.mockResolvedValue({ id: 7, quantity: 3 });
    mocks.tx.item.findUniqueOrThrow.mockResolvedValue({ id: 7, name: "牛奶", records: [] });

    const response = await createItem(buildItemRequest({ categoryId: 1, locationId: 2 }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.item).toMatchObject({ id: 7, name: "牛奶" });
    expect(mocks.tx.itemRecord.create).toHaveBeenCalledWith({
      data: { itemId: 7, notes: "创建物品", operatorId: 5, quantityChange: 3, type: "IN" }
    });
  });

  it("rejects missing category references before writing", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, username: "admin" });
    mocks.prisma.category.findUnique.mockResolvedValue(null);

    const response = await createItem(buildItemRequest({ categoryId: 99 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ code: 400, message: "分类不存在。" });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });
});

function buildItemRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/items", {
    body: JSON.stringify({ name: "牛奶", quantity: 3, ...body }),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
}
