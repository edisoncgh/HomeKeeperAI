# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
M5.5 性能与测试补强、1.0 发布候选自动收口和代码审查 Medium 修复已完成。当前等待用户完成 1.0 候选人工验收；Git 分段提交收口需用户后续确认。

## Current Slice
代码审查 Medium 修复已收口：无效保质期日期防 NaN、预警同步短时缓存与 dirty 标记、同秒备份防覆盖、备份面板网络失败恢复，并同步 docs/.memory。

## Last Known Good State
M2-M4 已完成自动验证和用户验收。M5.0 规划、M5.1 Dockerfile、M5.2 Compose 持久化、M5.3 初始化与生产配置、M5.4 备份恢复、M5.5 自动发布候选收口均已完成。

## Latest Commits
- 最新提交以 `git log --oneline -5` 为准。
- 当前已核对最新提交为 `ea2247b docs: 固化 M5 交接快照`；M5.1-M5.5 和代码审查修复工作尚在当前工作树中，未做本轮 Git 提交。

## Active Files
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `.gitignore`
- `.env.example`
- `docker/init-db.mjs`
- `lib/backups/sqlite.ts`
- `lib/api/backups.ts`
- `lib/alerts/rules.ts`
- `lib/alerts/sort.ts`
- `lib/api/alerts.ts`
- `lib/api/items.ts`
- `app/api/backups/route.ts`
- `app/api/backups/restore/route.ts`
- `app/api/backups/[id]/route.ts`
- `components/settings/backup-maintenance-panel.tsx`
- `app/settings/page.tsx`
- `lib/auth/session.ts`
- `next.config.ts`
- `package-lock.json`
- `tests/auth-session.test.ts`
- `tests/backup-storage.test.ts`
- `tests/backup-api.test.ts`
- `tests/settings-backup-ui.test.ts`
- `tests/alert-rules.test.ts`
- `tests/alert-api.test.ts`
- `tests/item-api.test.ts`
- `Readme.md`
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/DEPLOYMENT.md`
- `docs/QUALITY.md`
- `docs/CONTEXT.md`
- `docs/DECISIONS.md`
- `docs/API.md`
- `docs/TECH_PLAN.md`
- `.memory/context.md`
- `.memory/index.md`
- `.memory/knowledge.md`
- `.memory/sessions/20260608-134246.md`

## Working State
- `/settings` 同时展示 LLM 设置面板和数据备份面板。
- 备份 API 要求登录；`GET/POST /api/backups` 列表和创建；`POST /api/backups/restore` 使用 `{ id, confirm: true }` 恢复；`DELETE /api/backups/[id]` 删除。
- 备份目录由 `BACKUP_DIR` 控制；Compose 默认 `/app/backups` 并挂载 `home-storage-backups`；同秒备份会追加递增后缀并使用排他复制避免覆盖。
- 预警查询在 dirty 或短时缓存过期时同步；物品创建、更新、删除会标记预警 dirty；已处理预警不回弹语义保持不变。
- Compose 固定容器内 `DATABASE_URL=file:/app/data/home-storage.db`，生产必须提供 `AUTH_SECRET`；局域网纯 HTTP 可显式设置 `AUTH_COOKIE_SECURE=false`。
- Dockerfile 默认官方 `node:22.22.0-slim`，可用 `NODE_IMAGE` 切换到可达镜像源；Next standalone 运行时先执行 `node docker/init-db.mjs` 幂等初始化 SQLite schema。
- docs/、CLAUDE.md、AGENTS.md 仍按规则被 Git 忽略，仅本地维护；`.memory` 继续随代码提交。
- `.gitignore` 已将运行时备份规则收窄为根目录 `/backups/`，避免误忽略 `lib/backups/` 代码目录。
- `.codegraph/` 仍为未跟踪本地索引目录，不纳入项目提交。

## Current Problem / Blocker
当前无自动验证阻塞。剩余事项是用户人工验收和后续 Git 收口。

## Next Action
等待用户执行 1.0 候选人工验收清单；若通过，再按用户要求做 Git 分段提交收口。若验收发现问题，作为小范围 bugfix 切片处理，不混入新功能。

## Verification Status
- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm run test` 通过，37 个测试文件、130 个测试。
- `npm run build` 通过；共享 First Load JS 约 102 kB。
- `npm run db:check` 通过。
- 本地临时 SQLite + dev server 烟测通过：setup、登录态、分类/位置/物品、预警、统计、LLM 设置、备份恢复和核心页面均可用。
- Docker/Compose M5.5 验证通过：config 通过，缺少 `AUTH_SECRET` 时阻断，`up -d --build` 通过，容器内数据库和备份目录存在，强制重建后数据仍可读取；测试容器和 Volume 已清理。
- 代码卫生扫描无调试日志；密钥扫描未发现业务代码硬编码真实密钥；范围扫描未发现 M5 非目标功能混入。
- 代码审查 Medium 修复局部回归通过：`tests/alert-rules.test.ts`、`tests/alert-api.test.ts`、`tests/backup-storage.test.ts`、`tests/settings-backup-ui.test.ts`、`tests/item-api.test.ts` 共 31 个测试通过。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/DEPLOYMENT.md`
- `docs/QUALITY.md`
- `docs/DECISIONS.md`
- `docs/CONTEXT.md`

## Do Not Do
- 不提交 `.codegraph/`、`docs/`、`CLAUDE.md`、`AGENTS.md`。
- 不新增 AI 识别、图片上传、多图、缩略图、订单历史、批量操作、标签管理、购物清单、出库或库存调整。
- 不在用户人工验收前宣布 1.0 最终完成；当前是自动验证通过的 1.0 发布候选。
