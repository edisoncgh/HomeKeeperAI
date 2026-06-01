# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
完成 M3.1.5 系统设置与 LLM 配置 UI，等待用户人工验收后进入 M3.2。

## Current Slice
M3.1.5 已完成代码实现和自动验证。当前等待用户人工确认 `/settings` 页面体验：保存设置、替换/清空 API Key、测试连接提示。

## Last Known Good State
M2 已具备分类/位置管理、物品 CRUD API、`/items` 物品工作区、创建物品自动写入入库记录、搜索/筛选/排序/分页和 URL 查询参数同步。M3.1 已新增 LLM 配置解析、OpenAI 兼容调用客户端、错误分类、脱敏 API 错误响应和 `GET /api/ai/health` 健康检查接口。M3.1.5 新增系统设置页和 LLM 配置持久化。

## Active Files
- `prisma/schema.prisma`
- `prisma/migrations/20260602021500_add_app_settings/migration.sql`
- `scripts/push-db.mjs`
- `lib/settings/secret.ts`
- `lib/settings/llm.ts`
- `lib/validation/settings.ts`
- `lib/api/settings.ts`
- `app/api/settings/llm/route.ts`
- `app/settings/page.tsx`
- `components/settings/llm-settings-panel.tsx`
- `lib/api/ai.ts`
- `lib/navigation.ts`
- `components/layout/app-shell.tsx`
- `tests/settings-crypto.test.ts`
- `tests/settings-api.test.ts`
- `tests/navigation.test.ts`
- `tests/ai-api.test.ts`

## Working State
- `AppSetting` 保存全局设置；`LLM_BASE_URL`、`LLM_MODEL` 和 API Key 配置以数据库优先，`.env` 兜底。
- API Key 使用 `AUTH_SECRET` 派生密钥加密后存库；UI 和 API 只返回 `apiKeyConfigured`，不回显明文。
- `/settings` 提供 LLM Base URL、模型、API Key 保持/替换/清空、保存设置和测试连接。
- `GET/PUT /api/settings/llm` 要求登录，支持读取、保存、替换和清空 LLM 配置。
- `GET /api/ai/health` 已改为优先使用数据库设置，再回退 `.env`。
- `scripts/push-db.mjs` fallback 已补充 `AppSetting` 迁移应用，适配当前 Prisma CLI 失败环境。

## Current Problem / Blocker
- 自动化无阻塞。
- 临时 dev server 运行时验收未执行：启动临时库和 dev server 的命令两次等待自动权限评审超时。
- Git 命令会提示无法访问用户全局 ignore 文件，不阻塞操作。

## Next Action
- 请用户运行 `npm run dev` 后访问 `/settings` 做人工验收。
- 用户确认 M3.1.5 页面体验后，再进入 M3.2 AI 结构化契约与解析校验。

## Verification Status
- `npm run prisma:generate`：通过。
- `npm run prisma:push`：通过 fallback，已应用 `AppSetting` 迁移。
- `npm run test`：通过，16 个测试文件、47 个测试。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，`/settings` 和 `/api/settings/llm` 为动态路由。
- `npm run db:check`：通过。
- `sqlite3 data/dev.db ".tables"`：确认存在 `AppSetting` 表。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/API.md`
- `docs/TECH_PLAN.md`
- `docs/QUALITY.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DATA_MODEL.md`

## Do Not Do
- M3.1.5 用户人工验收前，不要把 `/settings` 页面体验勾选为完成。
- M3.2 不直接实现拍照识别、订单解析、主页 AI 建议或候选确认 UI。
- 不把 M4 的临期提醒、过期状态计算和库存预警混入 M3。
- 不实现图片上传、Docker、备份恢复、批量操作或标签管理，除非后续切片明确进入对应范围。
- 不提交 `docs/`、`CLAUDE.md`、`AGENTS.md`，它们按用户要求保持 Git 忽略；`.memory` 继续随代码提交。
