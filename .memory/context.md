# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
M4 预警与统计已完成并通过用户验收；当前准备进入 M5 部署与维护规划。

## Current Slice
M4.5 M4 收口验收已完成：完整自动验证、代码卫生、范围扫描、docs 和 `.memory` 同步均完成。下一步应先做 M5.0 规划，不直接编码 Docker 或备份恢复。

## Last Known Good State
M2 核心功能和体验打磨已完成并由用户确认。M3.0-M3.7 已完成自动验证和用户人工验收。M4.0-M4.5 已完成自动验证、用户验收和阶段收口。

## Latest Commits
- 最新代码提交仍是：`899ab85 feat: 完成 M3.2 AI 结构化契约`
- M3.3-M3.7、M4.0-M4.5 相关代码和 `.memory` 会话记录尚未提交

## Active Files
- `Readme.md`
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/QUALITY.md`
- `docs/CONTEXT.md`
- `docs/PRD.md`
- `docs/DOMAIN.md`
- `docs/DECISIONS.md`
- `.memory/context.md`
- `.memory/index.md`
- `.memory/knowledge.md`
- `.memory/sessions/20260605-211544.md`

## Working State
- M4.1 预警计算纯逻辑已完成。
- M4.2 预警同步与 API 已完成。
- M4.3 `/alerts` 预警入口、列表、筛选和“标记已处理”已完成；已处理预警回弹 bug 已修复并由用户复验通过。
- M4.4 `/stats` 基础统计视图已完成；用户已于 2026-06-05 验收通过。
- M4.5 收口已完成；M4 不包含第三方推送、趋势统计、统计导出、ECharts、Docker、备份恢复、批量操作、标签管理或 AI 新能力。

## Current Problem / Blocker
- 无 M4 功能阻塞。
- 两个早期运行时验证临时 SQLite 文件可能仍在 `data/m3_6_runtime_*.db`，被 Git 忽略，不影响开发。

## Next Action
进入 M5.0 部署与维护规划。先按 handoff-driven-development 输出 M5 切片计划并等待用户确认，再开始编码。

## Verification Status
- M4.5 完整验证：`npm run test` 通过，34 个测试文件、113 个测试。
- `npm run typecheck` 通过。
- `npm run lint` 通过。
- `npm run build` 通过，路由表包含 `/alerts`、`/stats`、`/api/alerts`、`/api/stats/overview` 和 `/api/stats/distribution`。
- `npm run db:check` 通过，SQLite connection ok。
- 代码卫生：`rg "DEBUG-|console\.log|console\.debug" app components lib tests` 未发现残留调试输出。
- 密钥扫描：业务代码未发现硬编码真实密钥；测试中的 `sk-test`、`sk-secret` 为固定假值。
- 范围扫描：未发现批量处理、趋势统计、统计导出、ECharts、Docker、备份恢复、AI 统计或阈值设置 UI 混入 M4。
- 用户人工验收：预警页、预警处理和基础统计视图均已由用户确认可用。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/QUALITY.md`
- `docs/DEPLOYMENT.md`
- `docs/TECH_PLAN.md`

## Do Not Do
- M5.0 编码前必须先输出切片计划并等待用户确认。
- 不把 M4 范围外能力回填进 M4：第三方推送、趋势统计、导出、高级图表、阈值设置 UI、AI 统计、批量操作、标签管理、图片上传或订单历史。
- 不提交 `docs/`、`CLAUDE.md`、`AGENTS.md`；它们按用户要求保持 Git 忽略。
- `.memory` 继续随代码提交。
