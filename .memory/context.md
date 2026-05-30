# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
按用户要求调整 Git 跟踪策略：忽略 `docs/`、`CLAUDE.md`、`AGENTS.md`，并从 Git 索引移除。

## Current Slice
M1.1 已完成；当前在 M1.2 前处理 Git 忽略规则和索引清理。

## Last Known Good State
M1.1 验证通过；`docs/`、`CLAUDE.md`、`AGENTS.md` 仍保留在本地工作区，但已通过 `.gitignore` 忽略并从 Git 索引移除。

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
- `docs/`、`CLAUDE.md`、`AGENTS.md` 已按用户要求从 Git 跟踪中移除；后续文档仍可本地维护，但不会进入提交。

## Current Problem / Blocker
- 无阻塞。
- 注意：`docs/` 被忽略后，handoff 文档仍存在但不再受 Git 版本控制。

## Next Action
- 提交本次 `.gitignore` 与索引清理变更，然后进入 M1.2 前确认组件范围。

## Verification Status
- 已执行 `git rm -r --cached docs CLAUDE.md AGENTS.md`，仅从索引移除，未删除本地文件。
- 自动化验证未重跑；本次只调整 Git 跟踪元数据。

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
