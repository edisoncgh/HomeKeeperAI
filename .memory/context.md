# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
完成 M2 核心功能开发，让家庭用户能手动维护分类、位置和物品库存。

## Current Slice
M2.1 分类与位置基础管理代码实现和自动验证已完成；用户反馈的访问分类/位置后反复跳登录问题已修复，等待用户重新人工确认 UI 后进入 M2.2。

## Last Known Good State
M2.1 新增分类/位置 API、管理页面、共用校验、共用 API 辅助和导航入口。已修复 dev 模块重载导致会话 Cookie 失效的问题。`npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check` 均通过。

## Active Files
- `app/api/categories/`
- `app/api/locations/`
- `app/categories/page.tsx`
- `app/locations/page.tsx`
- `components/inventory/taxonomy-manager.tsx`
- `components/layout/app-shell.tsx`
- `lib/auth/session.ts`
- `lib/api/taxonomy.ts`
- `lib/navigation.ts`
- `lib/validation/taxonomy.ts`
- `tests/navigation.test.ts`
- `tests/auth-session.test.ts`
- `tests/taxonomy-validation.test.ts`
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`

## Working State
- 分类和位置 API 都要求登录；未登录返回 401。
- 分类和位置输入共用 `parseTaxonomyInput`：名称必填、去首尾空格、最长 40 字；图标、颜色、描述可选并归一化为空值。
- 分类和位置重复名称返回 400，不存在 ID 返回 404。
- 删除分类或位置不删除物品，Prisma 关系会把物品外键置空。
- `/categories` 和 `/locations` 复用 `TaxonomyManager`，支持新建、编辑、删除确认、空状态、loading 和反馈消息。
- 开发环境未配置 `AUTH_SECRET` 时，dev fallback secret 存在 `globalThis`，避免 Next dev 编译/模块重载后旧 Cookie 失效。
- 主导航已加入“分类”“位置”；移动端底部导航已改为自适应列宽。
- M2 不做 AI、预警、图片上传、标签管理、Docker、备份或批量操作。
- M3 是关键 AI 里程碑，进入前必须专项规划 Prompt、LLM API、结构化响应和失败兜底。

## Current Problem / Blocker
- 自动化无阻塞。
- 页面跨端实际观感和登录跳转修复效果需用户重新运行 `npm run dev` 后人工确认。

## Next Action
- 用户确认 M2.1 UI 后，更新任务状态并进入 M2.2：物品 API 与创建入库记录。

## Verification Status
- `npm run test`：通过，7 个测试文件、14 个测试。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过。
- `npm run db:check`：通过。
- 临时 SQLite API 验证：未登录 401；setup 201；分类/位置创建、重复、列表、更新、删除状态码符合预期。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/API.md`
- `docs/TECH_PLAN.md`
- `docs/QUALITY.md`

## Do Not Do
- 不在用户确认 M2.1 UI 前直接关闭人工验收项。
- 不进入物品 UI、AI、预警或 Docker。
- 不提交 `docs/`、`CLAUDE.md`、`AGENTS.md`，它们按用户要求保持 Git 忽略。
