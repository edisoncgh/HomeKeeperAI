# 家庭仓储管理系统

面向家庭局域网和 NAS + Docker 部署的家庭 AI 仓储管理 Web 应用。

## 当前状态

Milestone #2 核心功能已完成：已具备 Next.js + TypeScript + TailwindCSS + Prisma + SQLite 基础工程、基础 UI 组件、响应式 AppShell、首次管理员初始化、本地登录、分类/位置管理、物品管理 UI、物品 CRUD API、创建入库记录逻辑，以及物品列表搜索、筛选、排序和分页。分类/位置图标字段支持 emoji 候选，物品详情中的最近记录时间显示到分钟。

Milestone #3 已完成主要 AI 功能：AI 专项规划、LLM 配置与调用边界、系统设置页中的 LLM 配置 UI、AI 结构化候选契约与解析校验、AI 候选确认 API/UI 边界、M3.4 拍照识别物品、M3.5 订单截图解析、M3.6 主页 AI 建议，以及 M3.7 移动端拍照导入入口均已完成代码实现、自动验证和用户人工验收。

Milestone #4 已完成：应用内预警与基础统计已闭环。当前具备确定性临期/过期/库存不足规则、`Alert` 同步与处理 API、`/alerts` 预警中心、主页预警摘要、`/stats` 基础统计视图、统计 API、分类/位置分布、未分类和未设置位置统计。M4 已通过自动验证和用户人工验收；第三方推送、趋势分析、导出、高级图表、Docker、备份恢复、图片上传、订单历史和 AI 新能力均未混入 M4 初始实现。下一步进入 M5 部署与维护规划。

## 本地开发

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

首次运行且数据库无用户时，访问 `/setup` 创建本地管理员；已有用户后访问 `/login` 登录。

## 验证命令

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:check
```

## 文档入口

- `docs/CONTEXT.md`：项目上下文。
- `docs/TASKS.md`：当前任务和验收标准。
- `docs/TECH_PLAN.md`：技术架构。
- `docs/AGENT_HANDOFF.md`：交接状态。

说明：`docs/`、`CLAUDE.md`、`AGENTS.md` 是本地协作文档，按项目约定被 Git 忽略；`.memory/` 作为项目级记忆继续随代码提交。
