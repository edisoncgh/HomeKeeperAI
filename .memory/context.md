# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
M1.5 收口修复已完成，准备规划 M2 核心物品、分类、位置功能。

## Current Slice
M1.5 Review 修复与文档对齐已完成；下一切片为 M2 规划。

## Last Known Good State
M1.5 已拆分超长 UI 函数、加强登录输入校验、用事务包裹管理员初始化，并同步 README、docs 与 `.memory`。`npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check` 均通过。

## Active Files
- `package.json`
- `package-lock.json`
- `.env.example`
- `.gitignore`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/ui/page.tsx`
- `app/api/auth/setup/route.ts`
- `components/auth/`
- `components/layout/app-shell.tsx`
- `lib/auth/validation.ts`
- `tests/auth-validation.test.ts`
- `Readme.md`
- `docs/TASKS.md`
- `docs/DATA_MODEL.md`
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
- 保留 `CLAUDE.md` 中函数不超过 50 行规则；M1.5 正在按该规则收口。
- 2026-05-31 复查时 `.next/trace` 曾被残留 Node 进程锁定，停止占用 3000 端口的 dev server 并清理 `.next` 后 `npm run build` 已恢复。

## Current Problem / Blocker
- 无阻塞。

## Next Action
- 提交 M1.5 收口修复；随后规划 M2 切片。

## Verification Status
- `npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check` 均通过。

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
