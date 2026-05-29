# Tasks

## 当前里程碑：M0 项目协作体系初始化

### 目标
建立项目记忆与文档驱动开发体系，使后续开发可以按切片推进、验证和交接。

### 范围
- 初始化 `.memory/` 项目级记忆。
- 补齐 `docs/TASKS.md`、`docs/TECH_PLAN.md`、`docs/AGENT_HANDOFF.md`。
- 从 `docs/PRD.md` 和 `docs/CONTEXT.md` 提取第一阶段开发计划。

### 明确不在范围
- 不初始化 Next.js 应用代码。
- 不实现登录、物品 CRUD、AI 识别或 Docker 部署。
- 不引入第一阶段非目标：云同步、多语言、多家庭、短信/邮件、语音输入、AR。

### 验收标准
- [x] `.memory/context.md` 存在且非空。
- [x] `.memory/index.md`、`.memory/knowledge.md`、`.memory/sessions/` 已创建。
- [x] `docs/TASKS.md`、`docs/TECH_PLAN.md`、`docs/AGENT_HANDOFF.md` 已创建。
- [x] Git 仓库已初始化。
- [x] `.gitignore` 已调整，`docs/`、`.memory/`、`CLAUDE.md`、`AGENTS.md` 可被 Git 跟踪。
- [x] `docs/CONTEXT.md` 已调整为符合 handoff-driven-development 的轻量项目上下文文档。
- [x] 领域、决策、API、数据模型、UI、质量、部署内容已拆分到对应文档。
- [x] 用户确认 M1.1 的范围、非目标和验收标准。

## 已完成切片：M1.1 Next.js 项目初始化 + Prisma + SQLite

### 目标
搭建可运行、可测试、可容器化扩展的 Next.js 全栈基础工程。

### 范围
- 初始化 Next.js + TypeScript 项目结构。
- 配置 TailwindCSS、ESLint、Prettier 或项目等价格式化方案。
- 配置 Prisma + SQLite，创建初始 schema 和迁移。
- 添加基础环境变量样例，不提交真实密钥。
- 补充最小运行、构建、测试命令。

### 明确不在范围
- 不实现完整认证流程。
- 不实现物品、分类、位置 CRUD。
- 不接入真实 LLM API。
- 不制作完整 UI 页面，只保留能验证工程可运行的最小页面。

### 验收标准
- [x] `npm run dev` 可启动本地开发服务。
- [x] `npm run build` 可通过。
- [x] Prisma Client 可生成，SQLite 数据库可连接。
- [x] `.env.example` 包含必要配置项且无真实密钥。
- [x] 文档记录运行命令和验证结果。

### 验证记录
- `npm run prisma:generate`：通过。
- `npm run prisma:push`：通过；当前环境下 Prisma CLI 写库失败时回退到 SQLite 迁移。
- `npm run db:check`：通过，输出 `SQLite connection ok. users=0`。
- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm run test`：通过，1 个烟雾测试通过。
- `npm run build`：通过。
- `npm run dev`：前台运行可进入 Ready 状态，地址为 `http://localhost:3000`；当前自动化后台启动会因隐藏 shell 标准输入关闭而退出。

## 后续里程碑

## 下一切片：M1.2 基础 UI 组件库
- [ ] Button、Input、Card、Tag 等基础组件。
- [ ] 使用项目配色、字体、圆角和移动端触摸尺寸。
- [ ] 建立 Story 或简单示例页用于人工验收。

## M1.3 响应式布局框架
- [ ] 移动端底部导航。
- [ ] 平板端可折叠侧边栏。
- [ ] PC 端左侧侧边栏 + 主内容区。

## M1.4 用户认证系统
- [ ] 初始化管理员创建流程。
- [ ] 用户名 + 密码登录。
- [ ] JWT 或 Cookie 会话方案。
- [ ] 管理员和普通成员角色。

## M2 核心功能
- [ ] 物品 CRUD。
- [ ] 分类管理。
- [ ] 位置管理。
- [ ] 物品列表搜索、筛选、排序。

## M3 AI 功能
- [ ] OpenAI 兼容 LLM 配置。
- [ ] 拍照识别物品。
- [ ] 订单截图解析。
- [ ] 位置推荐、智能分类、保质期识别。

## M4 预警与统计
- [ ] 临期、过期、库存不足预警。
- [ ] 应用内预警入口。
- [ ] 第三方推送预留或实现。
- [ ] 库存概览和位置分布图表。

## M5 部署与维护
- [ ] Dockerfile。
- [ ] Docker Compose。
- [ ] 初始化设置流程。
- [ ] 数据备份与恢复。
- [ ] 性能与测试补强。

## 技术债 / 待确认
- [ ] Git 仓库已初始化但尚未创建首次提交。
- [ ] PRD 中 AI 功能优先级与“阶段三”安排存在轻微张力：`CONTEXT.md` 标记 AI 功能为 P0，但阶段规划放在 Week 3，后续切片需按基础设施优先推进。
- [ ] 当前 Windows/M 盘环境下 Next 原生 SWC 无法加载，已通过本地 wasm SWC 和 readlink 补丁绕过；后续 Docker 环境应重新验证是否仍需要。
