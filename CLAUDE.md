# CLAUDE.md

> 本文件是 Coding Agent 在本项目中的行为准则。
> 所有在本项目中工作的 Agent（Claude Code、Codex、OpenCode 等）必须遵守以下规范。

本项目的核心开发记忆管理skill是 `project-memory`和`handoff-driven-development`。请参考以下说明来遵循这两个skill

---

## 一、开发者偏好

- 工作语言：简体中文。所有文档、注释、提交信息、会话记录均使用简体中文，即使读取到的某些文档内容是英文。
- 代码中的变量名、函数名、类名等标识符保持英文（遵循编码惯例）。
- 偏好简洁直接的沟通风格，不要寒暄和客套。

---

## 二、持久化文档管理（强制）

本项目使用 `project-memory` 和 `handoff-driven-development` 两个 skill 管理持久化文档。**必须在以下时机调用对应 skill，不得跳过。**

### 必须调用 project-memory 的时机

| 时机 | 动作 |
|------|------|
| 会话开始 | 读取 `.memory/` 全部文件。若 `.memory/context.md` 缺失或为空，立即修复。 |
| 每个有意义的开发步骤结束 | 重写 `.memory/context.md`（快照，不追加，≤100 行）。更新 `index.md`，必要时更新 `knowledge.md`。 |
| 会话结束 | 重写 `context.md`，创建 session 记录，更新 `index.md`。 |

### 必须调用 handoff-driven-development 的时机

| 时机 | 动作 |
|------|------|
| 会话开始 | 读取 `docs/AGENT_HANDOFF.md`、`TASKS.md`、`TECH_PLAN.md`、`CONTEXT.md`。向用户确认当前切片后才开始编码。 |
| 切片开始前 | 规划切片（目标、范围、非目标、验收标准），更新 `TASKS.md`。用户确认后才实现。 |
| 切片完成时 | 运行验证，用户确认后勾选 `TASKS.md`，更新 `AGENT_HANDOFF.md`。 |
| 会话结束 / Agent 切换 | 更新 `AGENT_HANDOFF.md`，确保新 Agent 能在 2 分钟内理解下一步。 |

### 两个体系的边界

- `docs/` = 操作真相（做什么、做完没、怎么验证、下一步）
- `.memory/` = 历史记忆（做过什么决定、停在哪、有哪些坑）
- `.memory/context.md` 只引用 `docs/` 路径，不复制其内容。三个文件各司其职。

---

## 三、编码规范

### 命名

- 变量和函数：`camelCase`，使用描述性名称
- 布尔值：优先使用 `is`、`has`、`should`、`can` 前缀
- 接口/类型/组件：`PascalCase`
- 常量：`UPPER_SNAKE_CASE`
- 文件：遵循项目现有命名风格（kebab-case 或 snake_case）

### 函数设计

- 函数不超过 50 行。超过则拆分。
- 一个函数只做一件事。
- 优先使用纯函数，减少副作用。

### 文件组织

- 单文件不超过 800 行。超过则提取模块。
- 按功能/领域组织，不按类型组织。
- 高内聚、低耦合。

### 错误处理

- 在系统边界（用户输入、外部 API、文件操作）必须验证。
- 不要静默吞掉错误。
- 错误信息对用户友好，对开发者有调试价值。

### 安全

- 禁止硬编码密钥、密码、令牌。使用环境变量或密钥管理器。
- 所有用户输入必须验证。
- SQL 查询使用参数化。
- HTML 输出必须转义。

---

## 四、Git 规范

### 提交信息格式

```
<类型>: <描述>

<可选正文>
```

类型：`feat`、`fix`、`refactor`、`docs`、`test`、`chore`、`perf`、`ci`

### 分支命名

- 功能：`feature/<名称>`
- 修复：`fix/<名称>`
- 重构：`refactor/<名称>`

### 提交原则

- 每次提交只做一件事。
- 提交前检查：无硬编码密钥、无调试日志残留、测试通过。
- 不要提交 `.env`、凭证文件、大型二进制文件。

---

## 五、异常处理

| 场景 | 处理方式 |
|------|----------|
| 文档与代码冲突 | 停止编码，以代码为准更新文档，再继续 |
| TASKS.md 过时 | 运行测试、检查 git log、检查文件，更新 TASKS.md 反映现实 |
| `.memory/context.md` 缺失 | 立即从模板创建，从最近会话和项目文档填充 |
| 切片太大无法一次完成 | 拆分为子切片，在 TASKS.md 中标记部分进度 |
| 用户跳过验证 | 验证项保持未勾选，在 AGENT_HANDOFF.md 中记录 |
| 多 Agent 同时修改文档 | 用 `git diff` 查看差异，手动合并，禁止 last-write-wins |

---

## 六、文档优先级

当文档之间出现矛盾时，按以下优先级处理：

1. **代码**（最终真相）
2. **`docs/TASKS.md`**（任务源）
3. **`docs/AGENT_HANDOFF.md`**（交接源）
4. **`.memory/context.md`**（现场快照）
5. **`.memory/knowledge.md`**（历史知识）
6. **`docs/TECH_PLAN.md`**（架构文档）

低优先级文档应向高优先级文档对齐。

---

## 七、自检清单

每次会话结束前，逐项检查：

- [ ] `.memory/context.md` 存在且非空
- [ ] `.memory/context.md` 不超过 100 行
- [ ] `.memory/context.md` 没有复制 `TASKS.md` 或 `AGENT_HANDOFF.md` 的内容
- [ ] `docs/AGENT_HANDOFF.md` 已更新，新 Agent 能在 2 分钟内理解下一步
- [ ] `docs/TASKS.md` 中的勾选状态与实际代码一致
- [ ] 没有硬编码的密钥或凭证
- [ ] 没有残留的调试日志
- [ ] 提交信息符合规范

---

## 八、可用 Skill 速查

本项目已安装以下开发 Skill，按开发阶段排列。Coding Agent可根据需要选择使用。

### 需求 & 规划
- `/mp-to-prd` — 将对话上下文综合为 PRD，发布到 Issue Tracker
- `/grill-me` — 对设计方案进行压力测试
- `/grill-with-docs` — 压力测试 + 同步更新 CONTEXT.md 和 ADR

### 架构
- `/mp-zoom-out` — 获取全局模块地图
- `/mp-improve-codebase-architecture` — 发现架构深化机会

### 开发
- `/mp-tdd` — 测试驱动开发（Red-Green-Refactor）
- `/mp-diagnose` — 六阶段诊断循环（难缠 bug / 性能回退）

### 审查
- `/mp-review` — 双轴审查（Standards + Spec）

### 知识管理
- `/neat-freak` — 会话结束前的知识洁癖级审查与同步
- `/mp-handoff` — 压缩对话为交接文档

### 持续机制（自动激活）
- `project-memory` — 跨会话项目记忆（`.memory/` 目录）
- `handoff-driven-development` — 文档驱动开发（`docs/` 目录）

### 必要时的图像生成任务
- `dmxapi-image-gen` — 调用DMXPI配置的图像生成模型来进行图像(或图像组)的生成、编辑、与融合。

### 前端设计类
- `frontend-design` — anthropic开源的前端设计skill。
- `design-taste-frontend` — 知名前端设计品味skill。

---