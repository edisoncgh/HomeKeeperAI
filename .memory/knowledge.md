# Project Knowledge

> Long-lived facts extracted from session memories. Updated incrementally.

## Architecture

- 项目目标：家庭局域网内私有部署的家庭 AI 仓储管理 Web 应用，用于管理物品、分类、位置、保质期、预警、出入库记录和 AI 辅助录入。
- 目标部署：家庭 NAS + Docker Compose；默认 Web 端口 3000；数据与图片通过 Docker Volume 持久化。
- 技术栈决策：React + Next.js + TypeScript + TailwindCSS；Next.js API Routes；SQLite + Prisma；LLM 使用 OpenAI 兼容 API，可接 OpenAI、Ollama 或自定义 Base URL。
- 重要边界：`docs/` 是操作真相，`.memory/` 是历史记忆，Git 是回滚边界。
- Git 仓库已于 2026-05-30 初始化，但尚未创建首次提交。
- 用户于 2026-05-30 要求 `docs/`、`CLAUDE.md`、`AGENTS.md` 不再由 Git 跟踪；本地仍保留这些文件，`.memory/` 仍被跟踪。
- M1.1 已建立 Next.js 15.5 + React 19 + TypeScript + TailwindCSS + Prisma 6 + SQLite + Vitest 基础工程。
- M1.2 已建立 `components/ui` 基础组件库：Button、Input、Card、Tag；示例页为 `/ui`。
- M1.3 已建立 `components/layout/AppShell` 响应式布局框架：移动端底部导航、平板/PC 左侧侧边栏、主内容区。
- M1.4 已建立本地认证：首次管理员初始化、用户名密码登录、HttpOnly Cookie 会话、当前用户接口和基础角色。
- 本地 SQLite 开发库位于 `data/dev.db`，`data/` 被 Git 忽略。

## Conventions

- 工作语言、文档、提交信息、会话记录统一使用简体中文。
- 业务术语优先使用：物品、分类、位置、保质期、临期、预警。
- 变量、函数、类型、组件等代码标识符保持英文并遵循项目编码规范。
- API 返回错误使用中文用户可读信息，统一格式 `{ code, message, data? }`。
- 所有用户输入和外部边界必须验证；禁止硬编码密钥。
- 当前环境中 Next 命令通过 `scripts/run-next.mjs` 使用 wasm SWC，并预加载 `scripts/patch-readlink.cjs`。
- 当前环境中 `npm run prisma:push` 通过 `scripts/push-db.mjs` 在 Prisma CLI 失败时回退到 SQLite migration。
- 基础 UI 组件使用 `lucide-react` 作为线性图标来源。
- 应用主导航配置集中在 `lib/navigation.ts`；当前仅暴露已存在页面 `/` 和 `/ui`，避免导航到未实现路由。
- 密码使用 Node `crypto.scrypt` 加随机盐哈希；会话 token 使用 HMAC 签名并写入 HttpOnly Cookie。
- 生产环境必须配置 `AUTH_SECRET`；依赖 Cookie 或数据库状态的页面必须 `force-dynamic`。

## User Preferences

- 偏好简洁直接的中文沟通。
- 使用 `project-memory` 和 `handoff-driven-development` 管理长期协作。
- 进入编码前需先确认当前切片、范围、非目标和验收标准。

## Decisions Log

- **2026-05-30**: 初始化 `.memory/` 项目记忆体系。原因：项目将以多轮 vibe coding 方式推进，需要跨会话保留现场、决策与后续动作。
- **2026-05-30**: 初始化 `docs/TASKS.md`、`docs/TECH_PLAN.md`、`docs/AGENT_HANDOFF.md`。原因：将 `docs/` 作为开发操作真相，支持切片式实现和 Agent 交接。
- **2026-05-30**: 将 `docs/CONTEXT.md` 调整为轻量项目上下文，并拆分 `DOMAIN.md`、`DECISIONS.md`、`API.md`、`DATA_MODEL.md`、`DESIGN_SYSTEM.md`、`QUALITY.md`、`DEPLOYMENT.md`。原因：符合 handoff-driven-development 的文档职责边界。
- **2026-05-30**: M1.1 基础工程完成。原因：为后续 UI、认证、CRUD 和 AI 功能提供可运行、可验证的工程底座。
- **2026-05-30**: 保留 wasm SWC/readlink patch 与 Prisma SQLite fallback。原因：当前 Windows/M 盘沙箱环境存在原生 SWC 加载和 Prisma schema engine 写库问题。
- **2026-05-30**: 按用户要求将 `docs/`、`CLAUDE.md`、`AGENTS.md` 加入 `.gitignore` 并从 Git 索引移除。原因：用户希望这些项目不进入 Git 记录。
- **2026-05-30**: M1.2 基础 UI 组件库完成。原因：为后续物品录入、筛选、预警和设置页面提供统一控件。
- **2026-05-30**: M1.3 响应式布局框架完成。原因：为后续认证、物品管理和预警页面提供统一跨端导航外壳。
- **2026-05-30**: M1.4 用户认证系统完成。原因：为后续核心数据功能提供本地访问控制和当前用户上下文。
