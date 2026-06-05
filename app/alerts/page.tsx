import { AlertDashboard, type AlertDashboardData, type AlertFilterValue } from "@/components/alerts/alert-dashboard";
import { queryAlerts, parseAlertQuery, type AlertQuery } from "@/lib/api/alerts";
import { requireCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

interface AlertsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  await requireCurrentUser();
  const urlSearchParams = toURLSearchParams(await searchParams);
  const result = await queryAlerts(normalizePageQuery(parseAlertQuery(urlSearchParams)));

  return (
    <AlertDashboard
      initialData={serializeAlertData(result)}
      initialFilter={parseInitialFilter(urlSearchParams)}
    />
  );
}

function normalizePageQuery(query: AlertQuery): AlertQuery {
  return query.status ? query : { ...query, status: "PENDING" as AlertQuery["status"] };
}

function serializeAlertData(result: Awaited<ReturnType<typeof queryAlerts>>): AlertDashboardData {
  return {
    alerts: result.alerts.map((alert) => ({
      ...alert,
      createdAt: alert.createdAt.toISOString(),
      item: {
        ...alert.item,
        expiryDate: alert.item.expiryDate?.toISOString() ?? null
      }
    })),
    pagination: result.pagination,
    summary: result.summary
  };
}

function parseInitialFilter(searchParams: URLSearchParams): AlertFilterValue {
  if (searchParams.get("status") === "RESOLVED") {
    return "resolved";
  }

  const type = searchParams.get("type");
  if (type === "EXPIRED") {
    return "expired";
  }

  if (type === "EXPIRING") {
    return "expiring";
  }

  return type === "LOW_STOCK" ? "low-stock" : "all";
}

function toURLSearchParams(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  return params;
}
