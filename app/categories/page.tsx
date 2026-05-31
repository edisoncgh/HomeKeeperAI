import { TaxonomyManager, type TaxonomyItemView } from "@/components/inventory";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireCurrentUser();
  const categories = await prisma.category.findMany({
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
      apiPath="/api/categories"
      emptyActionLabel="新建分类"
      emptyText="还没有分类。先创建食品、日用品、礼品等家庭常用分类。"
      initialItems={serializeTaxonomyItems(categories)}
      resourceLabel="分类"
      title="分类管理"
    />
  );
}

function serializeTaxonomyItems(items: Array<Omit<TaxonomyItemView, "createdAt"> & { createdAt: Date }>) {
  return items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString()
  }));
}
