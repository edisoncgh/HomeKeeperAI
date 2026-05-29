# Agent Handoff

## Current State

M1.1 已完成：Next.js 15.5 + React 19 + TypeScript + TailwindCSS + Prisma 6 + SQLite + Vitest 最小工程可运行。下一步进入 M1.2：基础 UI 组件库。

## Last Completed Work

- Commit: 无。Git 仓库已初始化，但尚未创建首次提交。
- 主要新增：`app/`、`lib/prisma.ts`、`prisma/schema.prisma`、`prisma/migrations/20260530023000_init/migration.sql`、`scripts/`、`tests/smoke.test.ts`、`package.json`、`package-lock.json`。
- 文档已更新：`docs/CONTEXT.md`、`docs/TASKS.md`、`docs/TECH_PLAN.md`、`docs/QUALITY.md`、`docs/DECISIONS.md`、`docs/DEPLOYMENT.md`。
- 记忆已更新：`.memory/context.md`、`.memory/index.md`、`.memory/knowledge.md`、`.memory/sessions/20260530-024731.md`。

## Verified Behavior

- `npm run prisma:generate`：通过。
- `npm run prisma:push`：通过。
- `npm run db:check`：通过，SQLite 连接正常。
- `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build`：全部通过。
- `npm run dev`：前台运行可进入 Ready，访问 `http://localhost:3000`。

## Known Issues

- Git 命令会提示无法访问用户全局 ignore 文件 `C:\Users\edisoncgh/.config/git/ignore`，但不阻塞仓库操作。
- 当前 Windows/M 盘环境无法加载 Next 原生 SWC，已通过 `scripts/run-next.mjs`、`@next/swc-wasm-nodejs`、`scripts/patch-readlink.cjs` 兼容。
- 当前沙箱下 Prisma `db push` schema engine 写库失败，`scripts/push-db.mjs` 会回退到 SQLite migration。
- 后台隐藏启动 `npm run dev` 会在 Ready 后退出；需要前台运行。

## Next Recommended Step

进入 M1.2：基础 UI 组件库。先确认 Button、Input、Card、Tag 的范围、非目标和验收标准。

## Non-Goals

- 不做物品 CRUD、认证、AI 识别、预警或 Docker 部署。
- 不提交真实 `.env`、LLM API Key、密码或令牌。
- 不移除 M1.1 兼容脚本，除非 Docker/Linux 验证表明可移除。

## Files of Interest

- `docs/TASKS.md`：任务和验收标准。
- `docs/TECH_PLAN.md`：技术边界和运行命令。
- `docs/DESIGN_SYSTEM.md`：M1.2 UI 规范入口。
- `.memory/context.md`：当前现场快照。
