import { apiError, apiOk } from "@/lib/api/response";
import { getSyncedAlertSummary } from "@/lib/api/alerts";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

type DistributionDimension = "category" | "location";

type TaxonomyDistributionRow = {
  color: null | string;
  icon: null | string;
  id: number;
  itemCount: number;
  name: string;
  quantity: number;
};

export type StatsDistribution = Awaited<ReturnType<typeof queryStatsDistribution>>;
export type StatsOverview = Awaited<ReturnType<typeof queryStatsOverview>>;

export async function getStatsOverview() {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  return apiOk(await queryStatsOverview());
}

export async function getStatsDistribution(request?: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  const dimension = parseDistributionDimension(request);
  return apiOk(await queryStatsDistribution(dimension));
}

export async function queryStatsOverview() {
  const [items, quantityResult, categories, locations, normal, expiring, expired, lowStock, alertSummary] =
    await Promise.all([
      prisma.item.count(),
      prisma.item.aggregate({ _sum: { quantity: true } }),
      prisma.category.count(),
      prisma.location.count(),
      prisma.item.count({ where: { status: "NORMAL" } }),
      prisma.item.count({ where: { status: "EXPIRING" } }),
      prisma.item.count({ where: { status: "EXPIRED" } }),
      prisma.item.count({ where: { status: "LOW_STOCK" } }),
      getSyncedAlertSummary()
    ]);

  return {
    alerts: pickPendingAlerts(alertSummary),
    status: { expired, expiring, lowStock, normal },
    totals: { categories, items, locations, quantity: quantityResult._sum.quantity ?? 0 }
  };
}

export async function queryStatsDistribution(dimension: DistributionDimension | null = null) {
  const [categories, locations] = await Promise.all([
    dimension === "location" ? null : queryCategoryDistribution(),
    dimension === "category" ? null : queryLocationDistribution()
  ]);

  return {
    categories: categories?.rows ?? [],
    locations: locations?.rows ?? [],
    uncategorized: categories?.unassigned ?? { itemCount: 0, quantity: 0 },
    unlocated: locations?.unassigned ?? { itemCount: 0, quantity: 0 }
  };
}

async function queryCategoryDistribution() {
  const groups = await prisma.item.groupBy({
    _count: { _all: true },
    _sum: { quantity: true },
    by: ["categoryId"]
  });
  const taxonomyMap = await getCategoryMap(groups.map((group) => group.categoryId));

  return buildTaxonomyDistribution(groups, taxonomyMap, "categoryId");
}

async function queryLocationDistribution() {
  const groups = await prisma.item.groupBy({
    _count: { _all: true },
    _sum: { quantity: true },
    by: ["locationId"]
  });
  const taxonomyMap = await getLocationMap(groups.map((group) => group.locationId));

  return buildTaxonomyDistribution(groups, taxonomyMap, "locationId");
}

async function getCategoryMap(ids: Array<number | null>) {
  const categories = await prisma.category.findMany({
    select: { color: true, icon: true, id: true, name: true },
    where: { id: { in: ids.filter(isNumber) } }
  });

  return new Map(categories.map((category) => [category.id, category]));
}

async function getLocationMap(ids: Array<number | null>) {
  const locations = await prisma.location.findMany({
    select: { color: true, icon: true, id: true, name: true },
    where: { id: { in: ids.filter(isNumber) } }
  });

  return new Map(locations.map((location) => [location.id, location]));
}

function buildTaxonomyDistribution<T extends "categoryId" | "locationId">(
  groups: Array<{ _count: { _all: number }; _sum: { quantity: number | null } } & Record<T, number | null>>,
  taxonomyMap: Map<number, { color: null | string; icon: null | string; id: number; name: string }>,
  key: T
) {
  const rows: TaxonomyDistributionRow[] = [];
  let unassigned = { itemCount: 0, quantity: 0 };

  for (const group of groups) {
    const itemCount = group._count._all;
    const quantity = group._sum.quantity ?? 0;
    const id = group[key];
    if (id === null) {
      unassigned = { itemCount, quantity };
    } else {
      const taxonomy = taxonomyMap.get(id);
      if (taxonomy) {
        rows.push({ ...taxonomy, itemCount, quantity });
      }
    }
  }

  return { rows: rows.sort(sortDistributionRows), unassigned };
}

function sortDistributionRows(first: TaxonomyDistributionRow, second: TaxonomyDistributionRow) {
  return second.itemCount - first.itemCount || second.quantity - first.quantity || first.name.localeCompare(second.name, "zh-CN");
}

function pickPendingAlerts(summary: Awaited<ReturnType<typeof getSyncedAlertSummary>>) {
  return {
    expired: summary.expired,
    expiring: summary.expiring,
    lowStock: summary.lowStock,
    pending: summary.pending
  };
}

function parseDistributionDimension(request?: Request): DistributionDimension | null {
  if (!request) {
    return null;
  }

  const dimension = new URL(request.url).searchParams.get("dimension");
  return dimension === "category" || dimension === "location" ? dimension : null;
}

function isNumber(value: number | null): value is number {
  return typeof value === "number";
}
