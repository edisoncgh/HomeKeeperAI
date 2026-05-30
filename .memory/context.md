# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
完成 M1.4 用户认证系统，并准备进入 M2 核心物品、分类、位置功能。

## Current Slice
M1.4 用户认证系统已完成；下一切片为 M2 核心功能。

## Last Known Good State
已新增首次管理员初始化、用户名密码登录、HttpOnly Cookie 会话、当前用户接口和受保护页面；`npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check` 均通过；临时 SQLite 库端到端 API 验证通过。

## Active Files
- `package.json`
- `package-lock.json`
- `.env.example`
- `.gitignore`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/ui/page.tsx`
- `app/setup/page.tsx`
- `app/login/page.tsx`
- `app/api/auth/setup/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/users/me/route.ts`
- `components/auth/`
- `components/layout/app-shell.tsx`
- `components/layout/index.ts`
- `lib/auth/password.ts`
- `lib/auth/session.ts`
- `lib/auth/validation.ts`
- `lib/auth/current-user.ts`
- `lib/api/response.ts`
- `lib/navigation.ts`
- `tests/navigation.test.ts`
- `tests/auth-password.test.ts`
- `tests/auth-session.test.ts`
- `tests/auth-validation.test.ts`
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
- M1.3 将主导航配置集中在 `lib/navigation.ts`，当前只暴露已存在页面 `/` 与 `/ui`。
- 全局布局由 `components/layout/AppShell` 承载，页面组件只负责主内容区。
- M1.4 使用 `crypto.scrypt` 哈希密码，使用 HMAC 签名 HttpOnly Cookie 会话。
- 生产环境必须配置 `AUTH_SECRET`；开发环境未配置时使用进程内临时密钥。
- 依赖 Cookie 或数据库状态的页面已显式 `force-dynamic`。

## Current Problem / Blocker
- 无阻塞。

## Next Action
- 提交 M1.4 代码和 `.memory` 更新；下一步确认 M2 核心功能切片顺序。

## Verification Status
- `npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check` 均通过。
- dev server 访问验证：`/setup` 返回 200，`/api/auth/setup` 返回 `needsSetup=true`，`/login` 返回 200。
- 临时 SQLite 库端到端 API 验证：初始化管理员 201、当前用户 200、退出登录 200；临时库已删除。

## Relevant Docs
- `docs/CONTEXT.md`
- `docs/TASKS.md`
- `docs/TECH_PLAN.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/QUALITY.md`
- `docs/AGENT_HANDOFF.md`
- `docs/DECISIONS.md`

## Do Not Do
- 不在 M2 前实现 AI 识别、预警或 Docker 部署。
- 不提交真实 `.env`、LLM API Key、密码或令牌。
- 不移除 M1.1 兼容脚本，除非 Docker/Linux 验证表明可移除。
