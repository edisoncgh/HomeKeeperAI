# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
完成 M1.2 基础 UI 组件库，并准备进入 M1.3 响应式布局框架。

## Current Slice
M1.2 基础 UI 组件库已完成；下一切片为 M1.3 响应式布局框架。

## Last Known Good State
已新增 Button、Input、Card、Tag 基础组件和 `/ui` 示例页；`npm run lint`、`npm run typecheck`、`npm run test`、`npm run build` 均通过；dev server 下 `/` 与 `/ui` 均返回 200。

## Active Files
- `package.json`
- `package-lock.json`
- `.env.example`
- `.gitignore`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `lib/prisma.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260530023000_init/migration.sql`
- `scripts/check-db.ts`
- `scripts/patch-readlink.cjs`
- `scripts/push-db.mjs`
- `scripts/run-next.mjs`
- `tests/smoke.test.ts`
- `tests/class-names.test.ts`
- `lib/class-names.ts`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/card.tsx`
- `components/ui/tag.tsx`
- `components/ui/index.ts`
- `app/ui/page.tsx`
- `app/page.tsx`
- `.gitignore`
- `docs/TASKS.md`
- `docs/TECH_PLAN.md`
- `docs/QUALITY.md`
- `docs/AGENT_HANDOFF.md`

## Working State
- `npm run dev` 前台运行可进入 Ready，访问 `http://localhost:3000`。
- 当前 Windows/M 盘环境无法加载 Next 原生 SWC，Next 命令通过 wasm SWC 与 readlink 补丁运行。
- 当前沙箱下 Prisma `db push` 的 schema engine 写库失败，`npm run prisma:push` 会回退到 SQLite migration。
- 本地开发库为 `data/dev.db`，该目录已被 Git 忽略。
- `docs/`、`CLAUDE.md`、`AGENTS.md` 已按用户要求从 Git 跟踪中移除；本地文档已维护但不会进入提交。
- M1.2 引入 `lucide-react` 供按钮和示例页使用线性图标。

## Current Problem / Blocker
- 无阻塞。

## Next Action
- 提交 M1.2 代码和 `.memory` 更新；下一步确认 M1.3 范围。

## Verification Status
- `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build` 均通过。
- dev server 访问验证：`/` 返回 200，`/ui` 返回 200。

## Relevant Docs
- `docs/CONTEXT.md`
- `docs/TASKS.md`
- `docs/TECH_PLAN.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/QUALITY.md`
- `docs/AGENT_HANDOFF.md`
- `docs/DECISIONS.md`

## Do Not Do
- 不在 M1.3 中实现物品 CRUD、认证、AI 识别、预警或 Docker 部署。
- 不提交真实 `.env`、LLM API Key、密码或令牌。
- 不移除 M1.1 兼容脚本，除非 Docker/Linux 验证表明可移除。
