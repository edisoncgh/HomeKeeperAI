import { Prisma } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { parseTaxonomyInput } from "@/lib/validation/taxonomy";

type TaxonomyDataKey = "categories" | "locations";

interface TaxonomyConfig {
  dataKey: TaxonomyDataKey;
  duplicateMessage: string;
  model: TaxonomyModel;
  notFoundMessage: string;
}

interface TaxonomyRecord {
  color: null | string;
  createdAt: Date;
  description: null | string;
  icon: null | string;
  id: number;
  name: string;
}

interface TaxonomyModel {
  create(args: unknown): Promise<TaxonomyRecord>;
  delete(args: unknown): Promise<TaxonomyRecord>;
  findMany(args: unknown): Promise<TaxonomyRecord[]>;
  update(args: unknown): Promise<TaxonomyRecord>;
}

const taxonomySelect = {
  color: true,
  createdAt: true,
  description: true,
  icon: true,
  id: true,
  name: true
};

export const categoryTaxonomy: TaxonomyConfig = {
  dataKey: "categories",
  duplicateMessage: "分类名称已存在。",
  model: prisma.category as unknown as TaxonomyModel,
  notFoundMessage: "分类不存在。"
};

export const locationTaxonomy: TaxonomyConfig = {
  dataKey: "locations",
  duplicateMessage: "位置名称已存在。",
  model: prisma.location as unknown as TaxonomyModel,
  notFoundMessage: "位置不存在。"
};

export async function listTaxonomyItems(config: TaxonomyConfig) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  const items = await config.model.findMany({
    orderBy: { name: "asc" },
    select: taxonomySelect
  });

  return apiOk({ [config.dataKey]: items });
}

export async function createTaxonomyItem(config: TaxonomyConfig, request: Request) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  const parsed = parseTaxonomyInput(await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return apiError(parsed.message, 400);
  }

  try {
    const item = await config.model.create({ data: parsed.data, select: taxonomySelect });
    return apiOk({ item }, 201);
  } catch (error) {
    return handleTaxonomyError(config, error);
  }
}

export async function updateTaxonomyItem(config: TaxonomyConfig, id: number, request: Request) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  const parsed = parseTaxonomyInput(await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return apiError(parsed.message, 400);
  }

  try {
    const item = await config.model.update({
      data: parsed.data,
      select: taxonomySelect,
      where: { id }
    });
    return apiOk({ item });
  } catch (error) {
    return handleTaxonomyError(config, error);
  }
}

export async function deleteTaxonomyItem(config: TaxonomyConfig, id: number) {
  const unauthorized = await getUnauthorizedResponse();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const item = await config.model.delete({ select: taxonomySelect, where: { id } });
    return apiOk({ item });
  } catch (error) {
    return handleTaxonomyError(config, error);
  }
}

export function parseRouteId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function handleTaxonomyError(config: TaxonomyConfig, error: unknown) {
  if (isKnownPrismaError(error, "P2002")) {
    return apiError(config.duplicateMessage, 400);
  }

  if (isKnownPrismaError(error, "P2025")) {
    return apiError(config.notFoundMessage, 404);
  }

  throw error;
}

async function getUnauthorizedResponse() {
  const user = await getCurrentUser();
  return user ? null : apiError("请先登录。", 401);
}

function isKnownPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
