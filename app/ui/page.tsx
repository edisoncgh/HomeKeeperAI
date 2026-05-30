import { AlertTriangle, Archive, CheckCircle2, PackagePlus, Search } from "lucide-react";
import { Button, Card, CardDescription, CardHeader, CardTitle, Input, Tag } from "@/components/ui";

const tagExamples = [
  { label: "正常", tone: "success" as const },
  { label: "临期", tone: "warning" as const },
  { label: "过期", tone: "danger" as const },
  { label: "厨房", tone: "neutral" as const }
];

export default function UiPreviewPage() {
  return (
    <main className="min-h-screen bg-app-background px-4 py-6 text-text-primary sm:px-8 lg:px-12">
      <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <CardHeader>
              <p className="text-sm font-medium text-primary">M1.2</p>
              <CardTitle className="text-2xl">基础 UI 组件库</CardTitle>
              <CardDescription>
                用于后续物品录入、筛选、预警和设置页面的可复用控件。
              </CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-3">
              <Button leadingIcon={<PackagePlus aria-hidden size={16} />}>新增物品</Button>
              <Button variant="secondary">批量导入</Button>
              <Button variant="ghost">取消</Button>
              <Button variant="danger">删除</Button>
              <Button aria-label="搜索" size="icon" variant="secondary">
                <Search aria-hidden size={18} />
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>表单输入</CardTitle>
              <CardDescription>输入框保持 44px 以上触摸高度，错误和辅助信息直接贴近字段。</CardDescription>
            </CardHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                helperText="例如：牛奶、纸巾、洗衣液"
                label="物品名称"
                name="itemName"
                placeholder="输入物品名称"
              />
              <Input
                label="存放位置"
                leadingIcon={<Archive aria-hidden size={16} />}
                name="location"
                placeholder="厨房 / 储物间"
              />
              <Input error="数量必须大于 0" label="数量" name="quantity" placeholder="0" />
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>状态标签</CardTitle>
              <CardDescription>用于物品卡片、筛选器和预警列表。</CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {tagExamples.map((tag) => (
                <Tag key={tag.label} tone={tag.tone}>
                  {tag.label}
                </Tag>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>预警摘要</CardTitle>
              <CardDescription>卡片组件的业务组合示例。</CardDescription>
            </CardHeader>
            <div className="flex items-start gap-3 rounded-card border border-warning/30 bg-[#FFF8EE] p-3">
              <AlertTriangle aria-hidden className="mt-0.5 text-warning" size={18} />
              <div>
                <p className="text-sm font-semibold">3 件物品临期</p>
                <p className="mt-1 text-sm leading-6 text-text-secondary">优先处理牛奶、酸奶和鸡蛋。</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3 rounded-card border border-primary/25 bg-primary-light p-3">
              <CheckCircle2 aria-hidden className="mt-0.5 text-primary" size={18} />
              <div>
                <p className="text-sm font-semibold">基础组件可复用</p>
                <p className="mt-1 text-sm leading-6 text-text-secondary">后续页面直接从 `components/ui` 引入。</p>
              </div>
            </div>
          </Card>
        </aside>
      </section>
    </main>
  );
}
