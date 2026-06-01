import { Prisma } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { ItemInput, ItemQuery, parseItemInput, parseItemQuery } from "@/lib/validation/item";

const taxonomySummarySelect = {
  color: true,
  icon: true,
  id: true,
  name: true
};

const itemBaseSelect = {
  category: { select: taxonomySummarySelect },
  categoryId: true,
  createdAt: true,
  description: true,
  expiryDate: true,
  id: true,
  imageUrl: true,
  location: { select: taxonomySummarySelect },
  locationId: true,
  name: true,
  notes: true,
  purchaseDate: true,
  purchasePrice: true,
  quantity: true,
  status: true,
  updatedAt: true
};

const itemDetailSelect = {
  ...itemBaseSelect,
  records: {
    orderBy: { createdAt: "desc" as const },
    select: {
      createdAt: true,
      id: true,
      notes: true,
      operatorId: true,
      quantityChange: true,
      type: true,
      user: { select: { displayName: true, id: true, username: true } }
    },
    take: 20
  }
};

export async function listItems(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  const parsed = parseItemQuery(new URL(request.url).searchParams);
  if (!parsed.ok) {
    return apiError(parsed.message, 400);
  }

  const result = await queryItems(parsed.data);
  return apiOk(result);
}

export async function createItem(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  const parsed = parseItemInput(await readRequestJson(request));
  if (!parsed.ok) {
    return apiError(parsed.message, 400);
  }

  const referenceError = await validateItemReferences(parsed.data);
  if (referenceError) {
    return referenceError;
  }

  const item = await createItemWithRecord(parsed.data, user.id);
  return apiOk({ item }, 201);
}

export async function getItem(id: number) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  const item = await prisma.item.findUnique({ select: itemDetailSelect, where: { id } });
  return item ? apiOk({ item }) : apiError("物品不存在。", 404);
}

export async function updateItem(id: number, request: Request) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  const parsed = parseItemInput(await readRequestJson(request));
  if (!parsed.ok) {
    return apiError(parsed.message, 400);
  }

  const referenceError = await validateItemReferences(parsed.data);
  if (referenceError) {
    return referenceError;
  }

  return updateItemRecord(id, parsed.data);
}

export async function deleteItem(id: number) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const item = await prisma.item.delete({ select: itemBaseSelect, where: { id } });
    return apiOk({ item });
  } catch (error) {
    return handleItemError(error);
  }
}

export function parseRouteId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function queryItems(query: ItemQuery) {
  const where = buildItemWhere(query);
  const [items, total] = await prisma.$transaction([
    prisma.item.findMany({
      orderBy: { [query.sort]: query.order },
      select: itemBaseSelect,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where
    }),
    prisma.item.count({ where })
  ]);

  return { items, pagination: buildPagination(query, total) };
}

async function createItemWithRecord(data: ItemInput, operatorId: number) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.create({ data, select: { id: true, quantity: true } });
    await tx.itemRecord.create({
      data: { itemId: item.id, notes: "创建物品", operatorId, quantityChange: item.quantity, type: "IN" }
    });

    return tx.item.findUniqueOrThrow({ select: itemDetailSelect, where: { id: item.id } });
  });
}

async function updateItemRecord(id: number, data: ItemInput) {
  try {
    const item = await prisma.item.update({ data, select: itemDetailSelect, where: { id } });
    return apiOk({ item });
  } catch (error) {
    return handleItemError(error);
  }
}

function buildItemWhere(query: ItemQuery): Prisma.ItemWhereInput {
  return {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.locationId ? { locationId: query.locationId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.q ? { OR: buildSearchConditions(query.q) } : {})
  };
}

function buildSearchConditions(q: string): Prisma.ItemWhereInput[] {
  return [{ name: { contains: q } }, { description: { contains: q } }, { notes: { contains: q } }];
}

function buildPagination(query: ItemQuery, total: number) {
  return {
    page: query.page,
    pageCount: Math.ceil(total / query.pageSize),
    pageSize: query.pageSize,
    total
  };
}

async function validateItemReferences(data: Pick<ItemInput, "categoryId" | "locationId">) {
  if (data.categoryId && !(await prisma.category.findUnique({ where: { id: data.categoryId } }))) {
    return apiError("分类不存在。", 400);
  }

  if (data.locationId && !(await prisma.location.findUnique({ where: { id: data.locationId } }))) {
    return apiError("位置不存在。", 400);
  }

  return null;
}

async function getUnauthorizedResponse() {
  const user = await getCurrentUser();
  return user ? null : apiError("请先登录。", 401);
}

async function readRequestJson(request: Request) {
  return request.json().catch(() => ({}));
}

function handleItemError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return apiError("物品不存在。", 404);
  }

  throw error;
}
