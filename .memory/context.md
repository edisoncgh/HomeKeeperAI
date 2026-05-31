# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
完成 M2 核心功能开发，让家庭用户能手动维护分类、位置和物品库存。

## Current Slice
M2.2 物品 API 与领域逻辑已完成并通过验证。下一步进入 M2.3：物品管理 UI。

## Last Known Good State
M2.2 新增物品 CRUD API、物品输入/查询校验、物品 API 关键路径测试，以及创建物品时写入 `ItemRecord(type=IN)` 的事务逻辑。`npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check` 均通过。

## Active Files
- `app/api/items/route.ts`
- `app/api/items/[id]/route.ts`
- `lib/api/items.ts`
- `lib/validation/item.ts`
- `tests/item-api.test.ts`
- `tests/item-validation.test.ts`
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/API.md`
- `docs/TECH_PLAN.md`
- `docs/QUALITY.md`

## Working State
- 所有物品 API 要求登录；未登录返回 401。
- `GET /api/items` 支持 `q`、`categoryId`、`locationId`、`status`、`sort`、`order`、`page`、`pageSize`。
- `POST /api/items` 校验名称、数量、日期、采购价格、分类/位置 ID，并验证分类/位置存在。
- 创建物品使用 Prisma 事务写入 `Item` 和 `ItemRecord(type=IN)`；`operatorId` 使用当前用户 ID。
- `GET /api/items/:id` 返回物品详情和最近 20 条出入库记录。
- `PUT /api/items/:id` 只更新当前物品值，M2 不把数量编辑记为库存调整。
- `DELETE /api/items/:id` 删除物品，关联记录和预警按 Prisma 级联删除。
- M2 不做 AI、预警、图片上传、标签管理、Docker、备份或批量操作。
- M3 是关键 AI 里程碑，进入前必须专项规划 Prompt、LLM API、结构化响应和失败兜底。

## Current Problem / Blocker
- 自动化无阻塞。
- 物品 UI 尚未实现，M2.3 需要让用户能通过页面完成物品 CRUD。

## Next Action
- 进入 M2.3：实现 `/items` 物品管理 UI，复用现有 AppShell、基础 UI、分类/位置 API 和物品 API。

## Verification Status
- `npm run test`：通过，9 个测试文件、22 个测试。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过。
- `npm run db:check`：通过。
- 临时 SQLite API 验证：未登录 401；setup 201；分类/位置创建 201；缺失分类引用 400；物品创建 201；详情记录 `IN/2`；列表 200；更新 200；删除 200；删除后详情 404。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/API.md`
- `docs/TECH_PLAN.md`
- `docs/QUALITY.md`

## Do Not Do
- 不在 M2.3 中实现 AI、出库、库存调整、预警、Docker 或图片上传。
- 不提交 `docs/`、`CLAUDE.md`、`AGENTS.md`，它们按用户要求保持 Git 忽略。
