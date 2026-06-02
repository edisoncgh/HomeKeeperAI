# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
PAUSED

## Current Goal
切换到新会话前完成项目记忆、交接文档和知识卫生检查。

## Current Slice
M3.2 AI 结构化契约与解析校验已完成并提交。下一步是 M3.3 AI 候选确认 API/UI 边界（待规划）。

## Last Known Good State
M2 核心功能和体验打磨已完成并由用户确认。M3.1 已实现 OpenAI 兼容 LLM 配置、调用、健康检查和错误脱敏。M3.1.5 已实现 `/settings` LLM 配置 UI，用户已确认保存 API 并测试连接成功。M3.2 已新增 AI 候选类型、JSON Schema、Prompt 和解析校验。

## Latest Commits
- 代码提交：`899ab85 feat: 完成 M3.2 AI 结构化契约`
- 交接记忆提交：`docs: 同步 M3.3 新会话交接记忆`

## Active Files
- `Readme.md`
- `.memory/context.md`
- `.memory/index.md`
- `.memory/knowledge.md`
- `.memory/sessions/20260602-121330.md`
- `docs/AGENT_HANDOFF.md`

## Working State
- `docs/TASKS.md` 当前切片已指向 M3.3（待规划），M3.2 验收项已完成。
- `docs/AGENT_HANDOFF.md` 已更新到最新代码提交 `899ab85` 和最新交接记忆提交信息，并说明下一步为 M3.3 候选确认 API/UI 边界规划。
- `Readme.md` 已从 M2 状态更新到 M3.2 完成、下一步 M3.3。
- `lib/ai/schemas.ts` 定义候选字段来源 `image/order/inference/user`、候选字段、候选响应和 JSON Schema。
- `lib/ai/prompts.ts` 定义候选专用 System Prompt、拍照识别 Prompt 和订单截图 Prompt。
- `lib/ai/parse.ts` 支持解析纯 JSON、Markdown 代码块和夹杂说明中的 JSON；校验来源、置信度、数量、日期、价格、保质期天数和推断说明。

## Current Problem / Blocker
- 无代码阻塞。
- 用户在开发 fallback secret 修复前保存的本地 LLM API Key 使用旧进程内 dev secret 加密；新进程中不可解密。需要用户在 `/settings` 中重新替换保存一次 API Key，之后重启也可稳定。
- Git 命令会提示无法访问用户全局 ignore 文件，不阻塞操作。

## Next Action
- 新会话应先读取 `CLAUDE.md`、`.memory/`、`docs/AGENT_HANDOFF.md`、`docs/TASKS.md`、`docs/TECH_PLAN.md`、`docs/CONTEXT.md` 和 M3 相关 docs。
- 按 handoff-driven-development 先输出 M3.3 切片计划并等待用户确认，然后再实现。

## Verification Status
- M3.2 完成时已验证：`npm run test` 18 个测试文件、57 个测试通过；`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check` 均通过。
- 本次 neat-freak 收口未改业务代码，仅更新 README、handoff docs 和项目记忆；未重新运行完整测试。

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
