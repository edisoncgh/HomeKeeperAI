import { ItemManager, type ItemRecordView, type ItemView, type TaxonomyOptionView } from "@/components/inventory";
import { queryItems } from "@/lib/api/items";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { parseItemListFilters } from "@/lib/inventory/item-view";
import { prisma } from "@/lib/prisma";
import { parseItemQuery } from "@/lib/validation/item";

export const dynamic = "force-dynamic";

const taxonomySelect = {
  color: true,
  icon: true,
  id: true,
  name: true
};

interface ItemsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  await requireCurrentUser();
  const urlSearchParams = toURLSearchParams(await searchParams);
  const parsedQuery = parseItemQuery(urlSearchParams);
  const defaultQuery = parseItemQuery(new URLSearchParams());
  if (!defaultQuery.ok) {
    throw new Error(defaultQuery.message);
  }
  const listQuery = parsedQuery.ok ? parsedQuery.data : defaultQuery.data;
  const rawMode = urlSearchParams.get("mode");
  const mode = rawMode === "camera" || rawMode === "photo" ? rawMode : "default";
  const [itemResult, categories, locations] = await Promise.all([
    queryItems(listQuery),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: taxonomySelect }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: taxonomySelect })
  ]);

  return (
    <ItemManager
      categories={serializeTaxonomyOptions(categories)}
      initialFilters={parseItemListFilters(urlSearchParams)}
      initialItems={serializeItems(itemResult.items)}
      initialMode={mode}
      initialPagination={itemResult.pagination}
      locations={serializeTaxonomyOptions(locations)}
    />
  );
}

function serializeItems(items: Array<Omit<ItemView, "createdAt" | "expiryDate" | "purchaseDate" | "records" | "updatedAt"> & {
  createdAt: Date;
  expiryDate: Date | null;
  purchaseDate: Date | null;
  records?: Array<Omit<ItemRecordView, "createdAt"> & { createdAt: Date }>;
  updatedAt: Date;
}>) {
  return items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    expiryDate: item.expiryDate?.toISOString() ?? null,
    purchaseDate: item.purchaseDate?.toISOString() ?? null,
    records: item.records?.map((record) => ({
      ...record,
      createdAt: record.createdAt.toISOString()
    })),
    updatedAt: item.updatedAt.toISOString()
  }));
}

function serializeTaxonomyOptions(items: TaxonomyOptionView[]) {
  return items;
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
