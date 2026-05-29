# Technical Plan

## 架构摘要

本项目采用 Next.js 全栈应用架构，在家庭局域网内通过 Docker 部署到 NAS。前端负责跨端 Web 交互，后端通过 Next.js API Routes 提供 RESTful API，数据存储使用 SQLite + Prisma，图片和数据库文件通过 Docker Volume 持久化。AI 能力通过 OpenAI 兼容接口接入云端 API、局域网 Ollama 或自定义服务。

## 技术栈

- 前端：React、Next.js、TypeScript、TailwindCSS。
- 后端：Next.js API Routes。
- 数据库：SQLite。
- ORM：Prisma。
- AI：OpenAI SDK 或兼容 OpenAI 格式的 HTTP 客户端。
- 图表：ECharts 或类似响应式图表库。
- 测试：Vitest、Supertest、Playwright。
- 部署：Docker、Docker Compose。

## 文件 / 模块地图

- `docs/PRD.md`：产品需求、里程碑、功能优先级。
- `docs/CONTEXT.md`：项目目标、阶段、约束、偏好、运行状态和重要路径。
- `docs/TASKS.md`：当前任务源、切片范围、验收标准。
- `docs/AGENT_HANDOFF.md`：最新交接状态和下一步。
- `docs/DOMAIN.md`：领域语言、业务实体关系和业务规则。
- `docs/DECISIONS.md`：重要设计决策和后果。
- `docs/API.md`：API 路由、错误格式、认证边界。
- `docs/DATA_MODEL.md`：Prisma 模型和数据关系。
- `docs/DESIGN_SYSTEM.md`：UI 视觉、组件和响应式规范。
- `docs/QUALITY.md`：测试和验证策略。
- `docs/DEPLOYMENT.md`：Docker、NAS、环境变量、备份恢复。
- `.memory/`：历史记忆、当前现场快照、长期知识。
- `app/`：未来 Next.js App Router 页面与布局。
- `app/api/`：未来 RESTful API 路由。
- `components/`：未来基础组件、业务组件和布局组件。
- `lib/prisma.ts`：Prisma Client 单例和本地 SQLite 默认连接。
- `prisma/schema.prisma`：当前 Prisma 数据库模型。
- `prisma/migrations/20260530023000_init/migration.sql`：初始 SQLite 建表迁移。
- `scripts/run-next.mjs`：Next 命令包装器，当前环境使用 wasm SWC。
- `scripts/patch-readlink.cjs`：当前 M 盘环境的 `readlink` 返回码补丁。
- `scripts/push-db.mjs`：Prisma db push 的本地回退脚本。
- `scripts/check-db.ts`：SQLite 连接验证脚本。
- `public/`：未来静态资源。
- `docker/` 或根目录 Docker 文件：未来容器化配置。

## 数据模型边界

核心实体：
- 用户：管理员和普通成员，本地认证。
- 物品：家庭中被管理的对象，包含数量、分类、位置、保质期、图片、状态。
- 分类：物品的主归属。
- 位置：物品的主要存放处。
- 标签：物品的辅助属性。
- 出入库记录：记录入库和数量变化历史。
- 预警：临期、过期、库存不足状态。

建模原则：
- 一个物品只有一个主分类和一个主要位置。
- 一个物品可以有多个标签。
- LLM 给出建议，用户最终确认。
- 保质期不明显的物品不触发临期预警。

## 数据 / 控制流

### 手动录入
用户提交表单 -> API 校验输入 -> Prisma 写入物品 -> 创建入库记录 -> 返回物品详情。

### 拍照识别
用户上传图片 -> API 保存临时或持久图片 -> 调用 OpenAI 兼容 LLM -> 返回候选物品、分类、位置、标签、保质期 -> 用户确认或修改 -> 批量写入。

### 预警计算
读取物品与阈值配置 -> 根据保质期和数量计算状态 -> 创建或更新预警 -> 首页和预警页展示。

### 初始化部署
首次访问 -> 检查管理员和系统配置 -> 引导创建管理员、配置 LLM、配置位置 -> 进入首页。

## 接口契约

- API 路由使用复数资源名：`/api/items`、`/api/categories`、`/api/locations`。
- HTTP 方法：GET 查询、POST 创建、PUT 更新、DELETE 删除。
- 错误格式：`{ code: number, message: string, data?: unknown }`。
- 用户可读错误信息使用中文。
- 环境变量通过 `.env` 管理，仓库只提交 `.env.example`。

## 测试和验证策略

- 纯业务逻辑：Vitest 单元测试。
- API 与数据库：Vitest 或 Supertest 集成测试，优先使用独立测试 SQLite 数据库。
- 端到端流程：Playwright 覆盖登录、物品录入、搜索筛选、预警处理。
- 视觉与响应式：Playwright 多视口截图或人工验收。
- Docker：构建镜像并通过 Docker Compose 验证启动、持久化目录和端口配置。

## 当前运行命令

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run db:check`

## 已知风险

- 家庭 NAS 性能有限：避免重型后台任务，图片处理和 LLM 请求应限制并发。
- LLM 输出不稳定：必须使用结构化输出校验，并保留用户确认步骤。
- SQLite 并发能力有限：适合家庭局域网低并发，避免过度复杂事务。
- 图片不压缩有利于识别但占空间：后续需要策略区分原图、缩略图和备份。
- Git 仓库已初始化，但尚未创建首次提交。
- 当前 Windows/M 盘环境下，Next 原生 SWC `.node` 无法加载，且 `fs.readlink` 对普通文件返回 `EISDIR`；已通过 wasm SWC 和 `scripts/patch-readlink.cjs` 让 build/dev 可运行。
- 当前沙箱下 Prisma `db push` 的 schema engine 写库失败；`scripts/push-db.mjs` 会先尝试 Prisma CLI，失败后用已生成的 SQLite migration 初始化数据库。
