# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
进入 M2 核心功能开发，让家庭用户能手动维护分类、位置和物品库存。

## Current Slice
M2.0 规划与文档对齐已完成；下一切片是 M2.1 分类与位置基础管理。

## Last Known Good State
M1.5 已完成并验证通过：`npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check`。M2.0 仅更新文档和项目记忆，不修改业务代码。

## Active Files
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/TECH_PLAN.md`
- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/DOMAIN.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/QUALITY.md`
- `.memory/context.md`
- `.memory/knowledge.md`
- `.memory/index.md`

## Working State
- `docs/`、`CLAUDE.md`、`AGENTS.md` 被 Git 忽略，但仍是本地操作真相。
- `.memory/` 继续由 Git 跟踪，用于历史记忆和当前现场快照。
- M2 已拆为 M2.1 分类/位置、M2.2 物品 API、M2.3 物品 UI、M2.4 搜索筛选排序、M2.5 收口复查。
- 用户已确认不插入提前 NAS 试用版；继续按 M2-M5 完整路线推进，M5 后作为家庭 NAS 1.0 发布候选。
- AI 拍照智能入库仍是核心定位，但按 M3 完整实现，不做临时 M3-lite。
- M2.1 先实现分类和位置，避免物品表单缺少外键数据。
- M2 删除分类或位置时不删除物品，关联字段按 Prisma `onDelete: SetNull` 置空。
- M2 物品创建时自动创建 `ItemRecord(type=IN)`；出库和库存调整暂缓。
- M2 不做 AI、预警、图片上传、标签管理、Docker、备份或批量操作。
- 当前 Windows/M 盘环境继续使用 wasm SWC/readlink patch 和 Prisma SQLite fallback。

## Current Problem / Blocker
- 无阻塞。

## Next Action
- 等用户确认后开始 M2.1：分类与位置基础管理。

## Verification Status
- M2.0 为文档规划切片；本轮未改业务代码，未运行代码级验证。
- 已做文档职责对齐；后续 M2.1 需要运行 `npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/API.md`
- `docs/TECH_PLAN.md`
- `docs/DATA_MODEL.md`
- `docs/QUALITY.md`

## Do Not Do
- 不跳过切片确认直接进入 M2.1 编码。
- 不提交 `docs/`、`CLAUDE.md`、`AGENTS.md`，它们按用户要求保持 Git 忽略。
- 不引入新状态管理库或重型依赖。
