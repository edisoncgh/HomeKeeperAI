# Decisions

## 2026-05-30 — 文档职责拆分

Decision: `docs/CONTEXT.md` 只保留项目目标、阶段、约束、偏好、运行状态和重要路径；领域、架构、API、数据模型、UI、质量和部署细节拆到独立文档。

Rationale:
- 符合 `handoff-driven-development` 对 CONTEXT 的轻量项目上下文定位。
- 降低后续 Agent 读取成本，避免单个上下文文件持续膨胀。

Consequences:
- 继续开发时应先读 `CONTEXT.md`、`TASKS.md`、`TECH_PLAN.md`、`AGENT_HANDOFF.md`。
- 做具体切片时再按需读取 `DOMAIN.md`、`API.md`、`DATA_MODEL.md`、`DESIGN_SYSTEM.md`、`QUALITY.md`、`DEPLOYMENT.md`。

## 2026-05-30 — 技术栈

Decision: 使用 React + Next.js + TypeScript + TailwindCSS，后端使用 Next.js API Routes，数据层使用 SQLite + Prisma。

Rationale:
- Next.js 适合单体全栈 Web 应用，便于 NAS + Docker 部署。
- SQLite 零配置、易备份，适合家庭局域网低并发场景。
- Prisma 提供类型安全和迁移能力。

Consequences:
- 第一阶段先搭建 Next.js、Prisma、SQLite 基础工程。
- 后续若 SQLite 并发成为瓶颈，再评估数据库迁移。

## 2026-05-30 — LLM 集成原则

Decision: LLM 使用 OpenAI 兼容接口，支持 OpenAI API、Ollama 或自定义 Base URL；LLM 只给建议，用户确认后写入数据。

Rationale:
- 兼容云端 API 和局域网本地模型。
- 避免 LLM 误识别直接污染正式数据。

Consequences:
- AI 识别接口必须有结构化输出校验和确认流程。
- 配置项通过环境变量和系统设置管理，不写入真实密钥。

## 2026-05-30 — 部署边界

Decision: Docker + Docker Compose 是必选部署方式，数据库、图片、配置通过 Docker Volume 持久化。

Rationale:
- 目标环境是家庭 NAS，容器化能降低部署和迁移成本。

Consequences:
- M5 必须验证镜像构建、Compose 启动、端口映射和数据持久化。

## 2026-05-30 — M1.1 本地工程兼容策略

Decision: 在当前 Windows/M 盘开发环境下，Next 命令通过 `scripts/run-next.mjs` 使用本地 wasm SWC，并预加载 `scripts/patch-readlink.cjs` 归一化 `readlink` 错误；Prisma db push 通过 `scripts/push-db.mjs` 提供 SQLite 迁移回退。

Rationale:
- 当前环境无法加载 Next 原生 SWC `.node`，且普通文件 `readlink` 返回 `EISDIR` 导致 build 失败。
- 当前沙箱下 Prisma schema engine 写 SQLite 失败，但 schema validation、client generation、migration diff 和 Prisma Client 查询均正常。

Consequences:
- M1.1 的 `npm run build`、`npm run dev`、`npm run prisma:push` 在当前环境可闭环。
- 后续 Docker/Linux 环境应重新验证是否仍需要这些兼容层。
