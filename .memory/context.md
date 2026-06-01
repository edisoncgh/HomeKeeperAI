# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
继续 M3 AI 功能开发，下一步进入 M3.2 AI 结构化契约与解析校验。

## Current Slice
M3.1 LLM 配置与调用边界已完成并通过自动验证。下一步是 M3.2：候选 JSON Schema、字段来源、置信度、多物品拆分、非 JSON 恢复和解析单元测试。

## Last Known Good State
M2 已具备分类/位置管理、物品 CRUD API、`/items` 物品工作区、创建物品自动写入入库记录、搜索/筛选/排序/分页和 URL 查询参数同步。M3.1 已新增 LLM 配置解析、OpenAI 兼容调用客户端、错误分类、脱敏 API 错误响应和 `GET /api/ai/health` 健康检查接口。

## Active Files
- `lib/ai/config.ts`
- `lib/ai/client.ts`
- `lib/api/ai.ts`
- `app/api/ai/health/route.ts`
- `tests/ai-config.test.ts`
- `tests/ai-client.test.ts`
- `tests/ai-api.test.ts`
- `docs/TASKS.md`
- `docs/TECH_PLAN.md`
- `docs/API.md`
- `docs/QUALITY.md`
- `docs/CONTEXT.md`
- `docs/AGENT_HANDOFF.md`

## Working State
- `parseAiConfig` 读取 `LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL`，默认 Base URL 为 `https://api.openai.com/v1`。
- 非本地 OpenAI 兼容服务缺少 API Key 会返回中文配置错误；本地 `localhost`/`127.*`/`::1` 服务允许无 API Key，支持 Ollama 这类本地兼容服务。
- `createChatCompletion` 调用 `{baseUrl}/chat/completions`，包含超时、有限重试、429/5xx/认证/网络/响应不可解析分类。
- `createAiErrorResponse` 只暴露中文用户提示和错误类型，不泄露 API Key、原始堆栈或远端敏感响应。
- `GET /api/ai/health` 要求登录，只做 LLM 配置与连通性检查，不做拍照识别、订单解析或主页建议业务。
- M3 AI 边界仍然是候选优先：图片/订单证据优先，语义推断必须标明来源和置信度，用户确认后才写入正式物品。

## Current Problem / Blocker
- 自动化无阻塞。
- Git 命令会提示无法访问用户全局 ignore 文件，不阻塞操作。

## Next Action
- 开始 M3.2 前，先确认切片范围和验收标准。
- M3.2 实现时优先读 `docs/TASKS.md`、`docs/TECH_PLAN.md`、`docs/API.md`、`docs/QUALITY.md` 和 `docs/AGENT_HANDOFF.md`。

## Verification Status
- `npm run test`：通过，14 个测试文件、41 个测试。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，`/api/ai/health` 为动态路由。
- `npm run db:check`：通过，SQLite 连接正常。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/API.md`
- `docs/TECH_PLAN.md`
- `docs/QUALITY.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DOMAIN.md`

## Do Not Do
- M3.2 不直接实现拍照识别、订单解析、主页 AI 建议或候选确认 UI。
- 不把 M4 的临期提醒、过期状态计算和库存预警混入 M3。
- 不实现图片上传、Docker、备份恢复、批量操作或标签管理，除非后续切片明确进入对应范围。
- 不提交 `docs/`、`CLAUDE.md`、`AGENTS.md`，它们按用户要求保持 Git 忽略；`.memory` 继续随代码提交。
