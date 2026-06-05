# Current Context

> Volatile working snapshot. Keep this short. This is not the task tracker and not the full history.
> Max 100 lines. Rewrite on each update. Do not append.

## Status
ACTIVE

## Current Goal
M4 预警与统计已完成并通过用户验收；M3.3-M4.5 累积代码和 `.memory` 已按切片完成 Git 分段提交。当前准备进入 M5 部署与维护规划。

## Current Slice
提交收口已完成。下一步应先做 M5.0 规划，不直接编码 Docker、Compose、初始化、备份恢复或性能补强。

## Last Known Good State
M2 核心功能和体验打磨已完成并由用户确认。M3.0-M3.7 已完成自动验证和用户人工验收。M4.0-M4.5 已完成自动验证、用户验收、阶段收口和 Git 分段提交。

## Latest Commits
- `51efb32 docs: 完成 M4.5 收口记忆同步`
- `10b4b45 feat: 完成 M4.4 基础统计视图`
- `17f4c53 feat: 完成 M4.3 预警入口与列表 UI`
- `3f376d5 feat: 完成 M4.2 预警同步 API`
- `85f72ed feat: 完成 M4.1 预警计算规则`
- `0ca4e09 docs: 记录 M4.0 预警统计规划`
- `6472cd5 feat: 完成 M3.6-M3.7 主页建议与移动拍照入口`
- `9c0af96 feat: 完成 M3.4-M3.5 AI 图片与订单解析`
- `103437f feat: 完成 M3.3 AI 候选确认边界`

## Active Files
- `.memory/context.md`
- `.memory/index.md`
- `.memory/knowledge.md`
- `.memory/sessions/20260605-213459.md`

## Working State
- M3.3-M4.5 累积工作已提交成 9 条切片提交。
- docs/、CLAUDE.md、AGENTS.md 仍按规则被 Git 忽略，仅本地维护。
- `.codegraph/` 仍为未跟踪本地索引目录，不纳入项目提交。

## Current Problem / Blocker
- 无功能阻塞。
- Git status 仅剩 `.codegraph/` 未跟踪；这是本地 codegraph 索引，不应提交。

## Next Action
进入 M5.0 部署与维护规划。先按 handoff-driven-development 输出 M5 切片计划并等待用户确认，再开始编码。

## Verification Status
- M4.5 完整验证此前已通过：`npm run test` 34 个测试文件、113 个测试；`npm run typecheck`、`npm run lint`、`npm run build`、`npm run db:check` 均通过。
- Git 收口验证：`git log --oneline -12` 确认 M3.3-M4.5 已形成切片提交链；`git status --short` 仅剩 `.codegraph/` 未跟踪。

## Relevant Docs
- `docs/TASKS.md`
- `docs/AGENT_HANDOFF.md`
- `docs/QUALITY.md`
- `docs/DEPLOYMENT.md`
- `docs/TECH_PLAN.md`

## Do Not Do
- M5.0 编码前必须先输出切片计划并等待用户确认。
- 不提交 `.codegraph/`、`docs/`、`CLAUDE.md`、`AGENTS.md`。
- `.memory` 继续随代码提交。
