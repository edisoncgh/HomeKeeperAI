# 家庭仓储管理系统

面向家庭局域网和 NAS + Docker 部署的家庭 AI 仓储管理 Web 应用。

## 当前状态

项目处于 M1.1 工程初始化阶段，目标是搭建 Next.js + TypeScript + TailwindCSS + Prisma + SQLite 的最小可运行基础工程。

## 本地开发

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

## 验证命令

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:check
```

## 文档入口

- `docs/CONTEXT.md`：项目上下文。
- `docs/TASKS.md`：当前任务和验收标准。
- `docs/TECH_PLAN.md`：技术架构。
- `docs/AGENT_HANDOFF.md`：交接状态。
