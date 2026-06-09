# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
PAUSED

## Current Goal
1.0 demo 已完成发布收口：M5.5、代码审查 Medium 修复、Git 提交收口、静态 review、完整质量门和发布标签准备均已完成。下一阶段进入 1.0 demo 后 polish。

## Current Slice
发布收口与 review：提交当前 Git 工作区、忽略 `.codegraph/`、补强预警同步并发 dirty 场景、完成静态 review 和发布前验证。

## Last Known Good State
M2-M4 已完成自动验证和用户验收。M5.0-M5.5 全部完成。1.0 demo 发布前质量门通过：lint、typecheck、test、build、db:check。

## Latest Commits
- `eaeac6f fix: 补强预警同步并发刷新`
- `acdb948 feat: 完成 1.0 demo 发布候选收口`
- 发布标签计划：`v1.0.0-demo`。

## Active Files
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `.gitignore`
- `.env.example`
- `docker/init-db.mjs`
- `lib/backups/sqlite.ts`
- `lib/api/backups.ts`
- `lib/api/alerts.ts`
- `lib/api/items.ts`
- `components/settings/backup-maintenance-panel.tsx`
- `Readme.md`
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/CONTEXT.md`
- `.memory/context.md`
- `.memory/index.md`
- `.memory/knowledge.md`
- `.memory/sessions/20260609-172900.md`

## Working State
- `/settings` 同时展示 LLM 设置面板和 SQLite 数据备份面板。
- 备份 API 要求登录；`GET/POST /api/backups` 列表和创建；`POST /api/backups/restore` 使用 `{ id, confirm: true }` 恢复；`DELETE /api/backups/[id]` 删除。
- Compose 固定容器内 `DATABASE_URL=file:/app/data/home-storage.db`，生产必须提供 `AUTH_SECRET`；局域网纯 HTTP 可显式设置 `AUTH_COOKIE_SECURE=false`。
- `.codegraph/` 已加入 `.gitignore` 与 `.dockerignore`，保持本地索引，不纳入提交或镜像上下文。
- 预警查询使用短时缓存和 dirty 标记；物品创建、更新、删除会标记 dirty；等待 in-flight 同步的查询若期间再次 dirty 会补跑同步。
- docs/、CLAUDE.md、AGENTS.md 仍按规则被 Git 忽略，仅本地维护；`.memory` 继续随代码提交。

## Current Problem / Blocker
当前无自动验证阻塞。1.0 demo 已可作为发布基线；后续工作应从 polish 规划开始。

## Next Action
进入 1.0 demo 后 polish：先规划 UI/体验 polish 切片、范围、非目标和验收标准，再编码。不要把新业务大功能混入 polish。

## Verification Status
- 静态 review against `ea2247b...HEAD` 完成；未发现阻塞发布的问题。
- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm run test` 通过，37 个测试文件、131 个测试。
- `npm run build` 通过；共享 First Load JS 约 102 kB。
- `npm run db:check` 通过。
- `git diff ea2247b...HEAD --check` 通过。
- `tests/alert-api.test.ts` 局部回归通过，覆盖预警同步并发 dirty 补跑。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/DEPLOYMENT.md`
- `docs/QUALITY.md`
- `docs/DECISIONS.md`
- `docs/CONTEXT.md`

## Do Not Do
- 不提交 `.codegraph/`、`docs/`、`CLAUDE.md`、`AGENTS.md`。
- polish 阶段不默认新增 AI 识别、图片上传、多图、缩略图、订单历史、批量操作、标签管理、购物清单、出库或库存调整。
- polish 前先确认切片范围、非目标和验收标准。