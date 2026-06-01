# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
进入 M3 AI 功能开发，先从 M3.1 LLM 配置与调用边界开始。

## Current Slice
M3.0 AI 专项规划已完成。下一步是 M3.1：配置读取、OpenAI/Ollama/自定义 Base URL 兼容、超时、有限重试、错误分类和中文用户提示。

## Last Known Good State
M2 已具备分类/位置管理、物品 CRUD API、`/items` 物品工作区、创建物品自动写入入库记录、搜索/筛选/排序/分页和 URL 查询参数同步。M2 体验打磨已通过验证：`npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check` 均通过。最新代码提交：`69e2111 feat: 完成 M2 物品工作区收口`；最新交接记忆提交：`e8c9526 docs: 同步 M3 新会话交接记忆`。

## Active Files
- `docs/TASKS.md`
- `docs/TECH_PLAN.md`
- `docs/API.md`
- `docs/DOMAIN.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/QUALITY.md`
- `docs/DATA_MODEL.md`
- `docs/DEPLOYMENT.md`
- `docs/DECISIONS.md`
- `docs/PRD.md`
- `docs/CONTEXT.md`
- `docs/AGENT_HANDOFF.md`

## Working State
- M3.0 已明确：AI 输出永远是候选，用户确认或修改后才写入正式物品。
- 图片或订单中可见信息优先作为识别证据；缺失的保质期、位置、分类等补充信息允许 LLM 语义推断为默认值。
- 语义推断字段必须标记来源和置信度，不能伪装成图像或订单中的事实。
- 示例规则：图片识别到香蕉但没看到保质期时，可建议分类为食品、位置为冰箱、保质期约 1 周；入库前用户可修改。
- 主页可提供手动触发的 AI 建议按钮，根据当前仓储摘要生成整理、补录、位置优化或消耗关注建议。
- 远端 LLM 错误、超时、限流、配置缺失和响应不可解析必须转成中文友好提示，不能导致页面额外报错。
- M3 已拆为 M3.1-M3.6：调用边界、结构化契约、候选确认、拍照识别、订单解析、主页 AI 建议。
- 临期提醒、过期状态计算和库存预警仍属于 M4；M3 只可生成候选和建议，不生成正式预警。

## Current Problem / Blocker
- 自动化无阻塞。
- Git 命令会提示无法访问用户全局 ignore 文件，不阻塞操作。

## Next Action
- 开始 M3.1 前，先确认切片范围和验收标准。
- M3.1 实现时优先读 `docs/TASKS.md`、`docs/TECH_PLAN.md`、`docs/API.md`、`docs/QUALITY.md` 和 `docs/AGENT_HANDOFF.md`。

## Verification Status
- 本次 M3.0 同步只更新文档和项目记忆，未修改业务代码，未运行代码级验证。
- 已完成文档一致性同步：M3.0 规划、M3.1-M3.6 子切片、AI 候选、语义推断默认值、主页 AI 建议、远端错误提示。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/API.md`
- `docs/TECH_PLAN.md`
- `docs/QUALITY.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DOMAIN.md`

## Do Not Do
- M3.1 不直接实现拍照识别、订单解析、主页 AI 建议或候选确认 UI。
- 不把 M4 的临期提醒、过期状态计算和库存预警混入 M3。
- 不实现图片上传、Docker、备份恢复、批量操作或标签管理，除非后续切片明确进入对应范围。
- 不提交 `docs/`、`CLAUDE.md`、`AGENTS.md`，它们按用户要求保持 Git 忽略；`.memory` 继续随代码提交。
