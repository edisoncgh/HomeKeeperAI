import { getSyncedAlertSummary } from "@/lib/api/alerts";
import { prisma } from "@/lib/prisma";

export interface HomeOverview {
  alertSummary: {
    expired: number;
    expiring: number;
    lowStock: number;
    pending: number;
    resolved: number;
  };
  categoryCount: number;
  itemCount: number;
  latestItems: Array<{ id: number; name: string; quantity: number }>;
  locationCount: number;
}

export async function getHomeOverview(): Promise<HomeOverview> {
  const [itemCount, categoryCount, locationCount, latestItems, alertSummary] = await Promise.all([
    prisma.item.count(),
    prisma.category.count(),
    prisma.location.count(),
    prisma.item.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, quantity: true },
      take: 5
    }),
    getSyncedAlertSummary()
  ]);

  return { alertSummary, categoryCount, itemCount, latestItems, locationCount };
}
