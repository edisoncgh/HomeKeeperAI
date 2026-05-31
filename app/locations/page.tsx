import { TaxonomyManager, type TaxonomyItemView } from "@/components/inventory";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  await requireCurrentUser();
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
    select: {
      color: true,
      createdAt: true,
      description: true,
      icon: true,
      id: true,
      name: true
    }
  });

  return (
    <TaxonomyManager
      apiPath="/api/locations"
      emptyActionLabel="新建位置"
      emptyText="还没有位置。先创建厨房、客厅、储物间等家庭存放位置。"
      initialItems={serializeTaxonomyItems(locations)}
      resourceLabel="位置"
      title="位置管理"
    />
  );
}

function serializeTaxonomyItems(items: Array<Omit<TaxonomyItemView, "createdAt"> & { createdAt: Date }>) {
  return items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString()
  }));
}
