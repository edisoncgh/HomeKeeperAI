import Link from "next/link";
import { ArrowRight, FolderTree, ImageOff, MapPin, Wrench } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

const managementLinks = [
  {
    description: "维护食品、日用品等主分类。",
    href: "/categories",
    icon: FolderTree,
    label: "分类管理"
  },
  {
    description: "维护冰箱、储物间等存放位置。",
    href: "/locations",
    icon: MapPin,
    label: "位置管理"
  }
];

export function SettingsMaintenanceHub() {
  return (
    <Card className="mx-auto w-full max-w-5xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench aria-hidden size={20} />
          系统维护
        </CardTitle>
        <CardDescription>低频管理入口集中在这里，避免挤占手机底部导航。</CardDescription>
      </CardHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold text-text-primary">资料管理</h3>
          <div className="mt-3 grid gap-2">
            {managementLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  className="flex min-h-14 items-center justify-between gap-3 rounded-card border border-soft-border px-3 py-2 transition hover:border-primary hover:bg-primary-light"
                  href={item.href}
                  key={item.href}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon aria-hidden className="text-primary" size={18} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-text-primary">{item.label}</span>
                      <span className="block truncate text-xs text-text-tertiary">{item.description}</span>
                    </span>
                  </span>
                  <ArrowRight aria-hidden className="shrink-0 text-text-tertiary" size={16} />
                </Link>
              );
            })}
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-text-primary">维护工具</h3>
          <div className="mt-3 grid gap-2">
            <Link
              className="flex min-h-14 items-center justify-between gap-3 rounded-card border border-soft-border px-3 py-2 transition hover:border-primary hover:bg-primary-light"
              href="#orphan-images"
            >
              <span className="flex min-w-0 items-center gap-3">
                <ImageOff aria-hidden className="text-primary" size={18} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-text-primary">孤儿图片清理</span>
                  <span className="block truncate text-xs text-text-tertiary">
                    扫描 uploads 中未被数据库引用的图片，确认后再清理。
                  </span>
                </span>
              </span>
              <ArrowRight aria-hidden className="shrink-0 text-text-tertiary" size={16} />
            </Link>
          </div>
        </section>
      </div>
    </Card>
  );
}
