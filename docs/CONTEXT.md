# Project Context

## Goal

构建一个面向家庭局域网环境的家庭 AI 仓储管理 Web 应用，部署在 NAS 的 Docker 容器中，用于管理家庭物品、分类、位置、保质期、预警、出入库记录，并通过 LLM 辅助拍照识别和订单解析。

## Current Phase

M1.1 基础工程已完成。当前具备 Next.js + TypeScript + TailwindCSS + Prisma + SQLite 的最小可运行工程，下一步进入 M1.2：基础 UI 组件库。

## Tech Stack

- Language/runtime: TypeScript、Node.js。
- Frameworks/tools: React、Next.js App Router、TailwindCSS、Prisma、SQLite。
- AI integration: OpenAI 兼容接口，支持 OpenAI API、Ollama 或自定义 Base URL。
- Test tools: Vitest、Supertest、Playwright。
- Target platform: 家庭 NAS + Docker Compose，家庭局域网访问。

## Constraints

- 数据必须私有部署，不做云同步。
- Docker 和 Docker Compose 是必选部署路径。
- SQLite 适合家庭低并发场景，避免引入过重数据库依赖。
- LLM 输出必须由用户确认后才能写入正式数据。
- 不硬编码密钥、密码、令牌或 LLM API Key。
- 第一阶段不做多语言、多家庭、短信/邮件、语音输入、AR、云同步。

## User Preferences

- 工作语言、文档、提交信息、会话记录统一使用简体中文。
- 代码标识符使用英文，遵循 TypeScript/React/Next.js 惯例。
- 开发遵循 `project-memory` 和 `handoff-driven-development`：先确认切片，再实现，再验证，再更新文档和记忆。
- 沟通风格简洁直接，优先给出可执行计划和明确状态。

## How to Run

- Install: `npm install`
- Dev: `npm run dev`
- Test: `npm run test`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Prisma generate: `npm run prisma:generate`
- SQLite init: `npm run prisma:push`
- SQLite check: `npm run db:check`

## Important Paths

- `CLAUDE.md`: 项目 Agent 行为准则。
- `docs/PRD.md`: 产品需求和阶段规划。
- `docs/TASKS.md`: 当前任务、切片、验收标准。
- `docs/TECH_PLAN.md`: 技术架构、模块边界、控制流。
- `docs/AGENT_HANDOFF.md`: 当前交接状态和下一步。
- `docs/DOMAIN.md`: 领域语言、实体关系、业务规则。
- `docs/DECISIONS.md`: 重要设计决策。
- `docs/API.md`: API 设计约定。
- `docs/DATA_MODEL.md`: 数据模型设计。
- `docs/DESIGN_SYSTEM.md`: UI 视觉和组件规范。
- `docs/QUALITY.md`: 测试和验证策略。
- `docs/DEPLOYMENT.md`: NAS、Docker、配置、备份和运行约束。
- `.memory/`: 项目历史记忆和当前现场快照。
