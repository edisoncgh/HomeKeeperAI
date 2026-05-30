# 家庭仓储管理系统

面向家庭局域网和 NAS + Docker 部署的家庭 AI 仓储管理 Web 应用。

## 当前状态

Milestone #1 已完成并进入收口修复：当前具备 Next.js + TypeScript + TailwindCSS + Prisma + SQLite 基础工程、基础 UI 组件、响应式 AppShell、首次管理员初始化和本地登录能力。下一阶段将进入 M2：分类、位置、物品 CRUD 与列表检索。

## 本地开发

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

首次运行且数据库无用户时，访问 `/setup` 创建本地管理员；已有用户后访问 `/login` 登录。

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

说明：`docs/`、`CLAUDE.md`、`AGENTS.md` 是本地协作文档，按项目约定被 Git 忽略；`.memory/` 作为项目级记忆继续随代码提交。
