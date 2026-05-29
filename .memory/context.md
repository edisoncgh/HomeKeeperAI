# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
完成 M1.1 Next.js 项目初始化 + Prisma + SQLite，并准备进入 M1.2 基础 UI 组件库。

## Current Slice
M1.1 基础工程初始化已完成；下一切片为 M1.2 基础 UI 组件库。

## Last Known Good State
项目已具备 Next.js 15.5、React 19、TypeScript、TailwindCSS、Prisma 6、SQLite、Vitest 的最小工程；`npm run prisma:generate`、`npm run prisma:push`、`npm run db:check`、`npm run lint`、`npm run typecheck`、`npm run test`、`npm run build` 均通过。

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
- `docs/TASKS.md`
- `docs/TECH_PLAN.md`
- `docs/QUALITY.md`
- `docs/AGENT_HANDOFF.md`

## Working State
- `npm run dev` 前台运行可进入 Ready，访问 `http://localhost:3000`。
- 当前 Windows/M 盘环境无法加载 Next 原生 SWC，Next 命令通过 wasm SWC 与 readlink 补丁运行。
- 当前沙箱下 Prisma `db push` 的 schema engine 写库失败，`npm run prisma:push` 会回退到 SQLite migration。
- 本地开发库为 `data/dev.db`，该目录已被 Git 忽略。

## Current Problem / Blocker
- 无阻塞。
- Git 仓库尚未创建首次提交。

## Next Action
- 进入 M1.2 前，确认 Button、Input、Card、Tag 的范围、非目标和验收标准。

## Verification Status
- 自动化验证全部通过：Prisma generate/push、db:check、lint、typecheck、test、build。
- `npm run dev` 已验证前台可启动；后台隐藏启动在当前 shell 环境会因标准输入关闭而退出。

## Relevant Docs
- `docs/CONTEXT.md`
- `docs/TASKS.md`
- `docs/TECH_PLAN.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/QUALITY.md`
- `docs/AGENT_HANDOFF.md`
- `docs/DECISIONS.md`

## Do Not Do
- 不在 M1.2 中实现物品 CRUD、认证、AI 识别、预警或 Docker 部署。
- 不提交真实 `.env`、LLM API Key、密码或令牌。
- 不移除 M1.1 兼容脚本，除非 Docker/Linux 验证表明可移除。
