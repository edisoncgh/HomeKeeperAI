# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
PAUSED

## Current Goal
交付新会话前完成 M2 状态、文档和项目记忆同步，确保下一轮可从 M3 前置规划开始。

## Current Slice
M2 已完成并通过用户验收。下一步是 M3.0 AI 专项规划；不要直接实现 AI 接口。

## Last Known Good State
M2 已具备分类/位置管理、物品 CRUD API、`/items` 物品工作区、创建物品自动写入入库记录、搜索/筛选/排序/分页和 URL 查询参数同步。M2 体验打磨已通过自动验证：`npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check` 均通过。最新代码提交：`69e2111 feat: 完成 M2 物品工作区收口`；本次会话已追加 M3 新会话交接记忆提交。

## Active Files
- `Readme.md`
- `components/inventory/item-manager.tsx`
- `components/inventory/item-list-controls.tsx`
- `components/inventory/taxonomy-manager.tsx`
- `lib/api/items.ts`
- `lib/inventory/item-view.ts`
- `lib/inventory/taxonomy-icon-options.ts`
- `tests/item-view.test.ts`
- `tests/taxonomy-icon-options.test.ts`
- `tests/item-api.test.ts`
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/TECH_PLAN.md`
- `docs/CONTEXT.md`
- `docs/DOMAIN.md`
- `docs/QUALITY.md`

## Working State
- `/items` 是受保护动态页面，未登录访问会跳转登录。
- 页面服务端读取 URL 查询参数，并按参数预取物品、分类、位置和分页元数据。
- 客户端 UI 支持物品 CRUD、搜索、分类筛选、位置筛选、状态筛选、排序方向、分页、列表加载状态和 URL 同步。
- 物品详情最近记录使用 `YYYY-MM-DD HH:mm` 显示到分钟。
- 分类/位置表单图标字段支持直接输入 emoji，并提供语义候选按钮。
- 用户于 2026-06-01 人工确认 M2.4 检查清单无明显问题。
- 用户于 2026-06-01 人工确认 M2 体验打磨新增功能无明显问题。
- `components/inventory/item-list-controls.tsx` 承载筛选/排序/分页控件，避免 `item-manager.tsx` 超过 800 行。
- `lib/api/items.ts` 已导出 `queryItems`，供 API route 和 `/items` 首屏复用同一查询逻辑。
- `CLAUDE.md` 已补充规则：每个 slice 完成后必须输出需要用户人工验收/验证的清单。
- 临期提醒、过期状态计算和库存预警仍属于 M4 预警与统计；M2 未实现。

## Current Problem / Blocker
- 自动化无阻塞。
- Git 命令会提示无法访问用户全局 ignore 文件，不阻塞操作。

## Next Action
- 进入 M3 前置规划：专项明确 AI 功能边界、LLM API 交互、System Prompt、结构化响应、解析校验、失败兜底、隐私和成本控制。

## Verification Status
- `npm run test`：通过，11 个测试文件、31 个测试。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过。
- `npm run db:check`：通过。
- 临时 SQLite + dev server 运行时验证：setup 201；分类 201；位置 201；创建“牛奶”和“大米”均 201；`/api/items?q=牛奶&categoryId=1&locationId=1&sort=name&order=asc` 返回 200 且只包含“牛奶”；同参数访问 `/items` 返回 200 且页面只包含“牛奶”。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/API.md`
- `docs/TECH_PLAN.md`
- `docs/QUALITY.md`
- `docs/DESIGN_SYSTEM.md`

## Do Not Do
- M3 开工前不要直接实现拍照识别或订单解析，必须先完成 AI 专项规划。
- 不把 M4 的临期提醒、过期状态计算和库存预警混入 M3 前置规划。
- 不提交 `docs/`、`CLAUDE.md`、`AGENTS.md`，它们按用户要求保持 Git 忽略。
