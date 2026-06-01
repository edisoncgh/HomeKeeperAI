# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
完成 M3 AI 功能的结构化候选基础，并准备进入 M3.3 候选确认边界规划。

## Current Slice
M3.2 AI 结构化契约与解析校验已完成代码实现和自动验证。下一步是 M3.3 AI 候选确认 API/UI 边界（待规划）。

## Last Known Good State
M2 核心功能和体验打磨已完成并由用户确认。M3.1 已实现 OpenAI 兼容 LLM 配置、调用、健康检查和错误脱敏。M3.1.5 已实现 `/settings` LLM 配置 UI，用户已确认保存 API 并测试连接成功。M3.2 已新增 AI 候选类型、JSON Schema、Prompt 和解析校验。

## Active Files
- `.env.example`
- `lib/auth/session.ts`
- `lib/ai/schemas.ts`
- `lib/ai/prompts.ts`
- `lib/ai/parse.ts`
- `tests/auth-session.test.ts`
- `tests/ai-contract.test.ts`
- `tests/ai-candidate-parser.test.ts`
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/TECH_PLAN.md`
- `docs/API.md`
- `docs/QUALITY.md`
- `docs/CONTEXT.md`
- `docs/DECISIONS.md`
- `docs/DEPLOYMENT.md`

## Working State
- `lib/ai/schemas.ts` 定义候选字段来源 `image/order/inference/user`、候选字段、候选响应和 JSON Schema。
- `lib/ai/prompts.ts` 定义候选专用 System Prompt、拍照识别 Prompt 和订单截图 Prompt，强调只输出 JSON、只生成候选、不直接写入正式物品。
- `lib/ai/parse.ts` 支持解析纯 JSON、Markdown 代码块和夹杂说明中的 JSON；校验来源、置信度、数量、日期、价格、保质期天数和推断说明。
- 解析器会保留有效候选、丢弃无效候选并追加中文 warnings；`source=inference` 字段缺少 `reason` 会被忽略；低于 0.4 的字段置信度会生成 warnings。
- 开发环境未配置 `AUTH_SECRET` 时，fallback secret 现在写入 `data/dev-auth-secret`；测试可用 `AUTH_DEV_SECRET_PATH` 指定临时路径。

## Current Problem / Blocker
- 无代码阻塞。
- 用户在修复前保存的本地 LLM API Key 使用旧进程内 dev secret 加密；新进程中不可解密。需要用户在 `/settings` 中重新替换保存一次 API Key，之后重启也可稳定。
- Git 命令会提示无法访问用户全局 ignore 文件，不阻塞操作。

## Next Action
- 提交 M3.2 代码与 `.memory` 更新。
- 之后进入 M3.3 前，先按 handoff-driven-development 规划候选确认 API/UI 边界并等待用户确认。

## Verification Status
- `npm run test -- tests/ai-candidate-parser.test.ts tests/ai-contract.test.ts`：通过，2 个测试文件、9 个测试。
- `npm run test -- tests/auth-session.test.ts tests/settings-api.test.ts tests/settings-crypto.test.ts tests/ai-api.test.ts tests/ai-client.test.ts tests/ai-config.test.ts tests/ai-candidate-parser.test.ts tests/ai-contract.test.ts`：通过，8 个测试文件、29 个测试。
- `npm run test`：通过，18 个测试文件、57 个测试。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过。
- `npm run db:check`：通过。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/API.md`
- `docs/TECH_PLAN.md`
- `docs/QUALITY.md`
- `docs/DECISIONS.md`
- `docs/DEPLOYMENT.md`

## Do Not Do
- M3.3 规划确认前，不要直接实现候选确认 UI/API。
- M3.3 不直接实现真实拍照识别、订单解析、主页 AI 建议或图片上传。
- 不把 M4 的临期提醒、过期状态计算和库存预警混入 M3。
- 不实现 Docker、备份恢复、批量操作或标签管理，除非后续切片明确进入对应范围。
- 不提交 `docs/`、`CLAUDE.md`、`AGENTS.md`，它们按用户要求保持 Git 忽略；`.memory` 继续随代码提交。
