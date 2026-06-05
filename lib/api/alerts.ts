import { AlertStatus, AlertType, Prisma } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api/response";
import { evaluateItemAlerts } from "@/lib/alerts/rules";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const ALERT_PAGE_SIZE = 20;

const alertItemSelect = {
  category: { select: { color: true, icon: true, id: true, name: true } },
  expiryDate: true,
  id: true,
  location: { select: { color: true, icon: true, id: true, name: true } },
  name: true,
  quantity: true,
  status: true
};

const alertSelect = {
  createdAt: true,
  id: true,
  item: { select: alertItemSelect },
  itemId: true,
  status: true,
  type: true
};

const syncItemSelect = {
  expiryDate: true,
  id: true,
  name: true,
  quantity: true,
  status: true
};

export type AlertQuery = {
  page: number;
  pageSize: number;
  status: AlertStatus | null;
  type: AlertType | null;
};

export async function listAlerts(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  const query = parseAlertQuery(new URL(request.url).searchParams);
  const result = await queryAlerts(query);
  return apiOk(result);
}

export async function queryAlerts(query: AlertQuery = createDefaultAlertQuery()) {
  await syncAlerts();

  const where = buildAlertWhere(query);
  const [alerts, total, summary] = await Promise.all([
    prisma.alert.findMany({
      orderBy: { createdAt: "desc" },
      select: alertSelect,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where
    }),
    prisma.alert.count({ where }),
    getAlertSummary()
  ]);

  return { alerts, pagination: buildPagination(query, total), summary };
}

export async function getSyncedAlertSummary() {
  await syncAlerts();
  return getAlertSummary();
}

export async function resolveAlert(id: number) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("请先登录。", 401);
  }

  const alert = await prisma.alert
    .update({
      data: { status: "RESOLVED" },
      select: alertSelect,
      where: { id }
    })
    .catch((error: unknown) => {
      if (isNotFoundError(error)) {
        return null;
      }

      throw error;
    });

  if (!alert) {
    return apiError("预警不存在。", 404);
  }

  return apiOk({ alert });
}

async function syncAlerts() {
  await prisma.$transaction(async (tx) => {
    const items = await tx.item.findMany({ select: syncItemSelect });
    const itemIds = items.map((item) => item.id);
    const existingAlerts = itemIds.length
      ? await tx.alert.findMany({
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { createdAt: true, id: true, itemId: true, status: true, type: true },
          where: { itemId: { in: itemIds }, status: { in: ["PENDING", "RESOLVED"] } }
        })
      : [];

    const pendingAlerts = existingAlerts.filter((alert) => alert.status === "PENDING");
    const resolvedAlerts = existingAlerts.filter((alert) => alert.status === "RESOLVED");
    const duplicateResolvedAlertIds = getDuplicateAlertIds(resolvedAlerts);
    const duplicatePendingAlertIds: number[] = [];
    const existingAlertKeys = new Set(existingAlerts.map((alert) => buildAlertKey(alert.itemId, alert.type)));
    const resolvedAlertKeys = new Set(
      resolvedAlerts.map((alert) => buildAlertKey(alert.itemId, alert.type))
    );
    const desiredAlertKeys = new Set<string>();

    for (const item of items) {
      const result = evaluateItemAlerts(item);
      if (item.status !== result.status) {
        await tx.item.update({ data: { status: result.status }, where: { id: item.id } });
      }

      for (const alert of result.alerts) {
        const alertKey = buildAlertKey(item.id, alert.type);
        desiredAlertKeys.add(alertKey);
        if (!existingAlertKeys.has(alertKey)) {
          await tx.alert.create({ data: { itemId: item.id, status: "PENDING", type: alert.type } });
        }
      }
    }

    for (const alert of pendingAlerts) {
      const alertKey = buildAlertKey(alert.itemId, alert.type);
      if (resolvedAlertKeys.has(alertKey)) {
        duplicatePendingAlertIds.push(alert.id);
      } else if (!desiredAlertKeys.has(alertKey)) {
        await tx.alert.update({ data: { status: "RESOLVED" }, where: { id: alert.id } });
      }
    }

    const duplicateAlertIds = [...duplicateResolvedAlertIds, ...duplicatePendingAlertIds];
    if (duplicateAlertIds.length > 0) {
      await tx.alert.deleteMany({ where: { id: { in: duplicateAlertIds } } });
    }
  });
}

export function parseAlertQuery(searchParams: URLSearchParams): AlertQuery {
  return {
    page: parsePositiveInteger(searchParams.get("page")) ?? 1,
    pageSize: Math.min(parsePositiveInteger(searchParams.get("pageSize")) ?? ALERT_PAGE_SIZE, 100),
    status: parseAlertStatus(searchParams.get("status")),
    type: parseAlertType(searchParams.get("type"))
  };
}

export function createDefaultAlertQuery(): AlertQuery {
  return parseAlertQuery(new URLSearchParams());
}

function buildAlertWhere(query: AlertQuery): Prisma.AlertWhereInput {
  return {
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {})
  };
}

async function getAlertSummary() {
  const [pending, expiring, expired, lowStock, resolved] = await Promise.all([
    prisma.alert.count({ where: { status: "PENDING" } }),
    prisma.alert.count({ where: { status: "PENDING", type: "EXPIRING" } }),
    prisma.alert.count({ where: { status: "PENDING", type: "EXPIRED" } }),
    prisma.alert.count({ where: { status: "PENDING", type: "LOW_STOCK" } }),
    prisma.alert.count({ where: { status: "RESOLVED" } })
  ]);

  return { expired, expiring, lowStock, pending, resolved };
}

function buildPagination(query: AlertQuery, total: number) {
  return {
    page: query.page,
    pageCount: Math.ceil(total / query.pageSize),
    pageSize: query.pageSize,
    total
  };
}

function parsePositiveInteger(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseAlertStatus(value: string | null) {
  return value === AlertStatus.PENDING || value === AlertStatus.RESOLVED ? value : null;
}

function parseAlertType(value: string | null) {
  return value === AlertType.EXPIRING || value === AlertType.EXPIRED || value === AlertType.LOW_STOCK ? value : null;
}

function buildAlertKey(itemId: number, type: string) {
  return `${itemId}:${type}`;
}

function getDuplicateAlertIds(alerts: Array<{ id: number; itemId: number; type: string }>) {
  const seenKeys = new Set<string>();
  const duplicateIds: number[] = [];

  for (const alert of alerts) {
    const alertKey = buildAlertKey(alert.itemId, alert.type);
    if (seenKeys.has(alertKey)) {
      duplicateIds.push(alert.id);
    } else {
      seenKeys.add(alertKey);
    }
  }

  return duplicateIds;
}

function isNotFoundError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025";
}
