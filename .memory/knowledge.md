# Project Knowledge

> Long-lived facts extracted from session memories. Updated incrementally.

## Architecture

- 项目目标：家庭局域网内私有部署的家庭 AI 仓储管理 Web 应用，用于管理物品、分类、位置、保质期、预警、出入库记录和 AI 辅助录入。
- 目标部署：家庭 NAS + Docker Compose；默认 Web 端口 3000；数据与图片通过 Docker Volume 持久化。
- 技术栈决策：React + Next.js + TypeScript + TailwindCSS；Next.js API Routes；SQLite + Prisma；LLM 使用 OpenAI 兼容 API，可接 OpenAI、Ollama 或自定义 Base URL。
- 重要边界：`docs/` 是操作真相，`.memory/` 是历史记忆，Git 是回滚边界。
- Git 仓库已于 2026-05-30 初始化，但尚未创建首次提交。
- 用户于 2026-05-30 要求 `docs/`、`CLAUDE.md`、`AGENTS.md` 不再由 Git 跟踪；本地仍保留这些文件，`.memory/` 仍被跟踪。
- M1.1 已建立 Next.js 15.5 + React 19 + TypeScript + TailwindCSS + Prisma 6 + SQLite + Vitest 基础工程。
- M1.2 已建立 `components/ui` 基础组件库：Button、Input、Card、Tag；示例页为 `/ui`。
- M1.3 已建立 `components/layout/AppShell` 响应式布局框架：移动端底部导航、平板/PC 左侧侧边栏、主内容区。
- M1.4 已建立本地认证：首次管理员初始化、用户名密码登录、HttpOnly Cookie 会话、当前用户接口和基础角色。
- M1.5 已完成 review 收口：保留 50 行函数规范，拆分超长 UI 函数，加强登录校验，用事务加固首次管理员初始化，并修正文档一致性。
- M2 规划已确定依赖顺序：先分类/位置基础管理，再物品 API，再物品 UI，再搜索筛选排序，最后做 M2 收口复查。
- M2.1 分类与位置基础管理已实现：分类/位置 CRUD API、`/categories`、`/locations`、共用 taxonomy 校验和管理 UI。
- M2.2 物品 API 与领域逻辑已实现：物品 CRUD API、列表查询、详情读取、输入/查询校验，以及创建物品时自动写入 `ItemRecord(type=IN)` 的事务。
- M2.3 物品管理 UI 已实现：`/items` 物品工作区、移动端卡片列表、PC 端高密度列表、详情面板、创建/编辑表单、删除确认、空/错误/loading 状态。
- M2.4 搜索、筛选、排序与列表打磨已实现：`/items` 支持搜索、分类/位置/状态筛选、排序、分页和 URL 查询参数同步。
- M2.5 M2 收口与复查已完成：M2 总验收、完整验证、文档和项目记忆已对齐到 M2 完成状态。
- M2 体验打磨已完成：物品详情最近记录时间显示到分钟；分类/位置图标字段支持 emoji 候选。
- M2 代码已完成 Git 收口，最新代码提交为 `69e2111 feat: 完成 M2 物品工作区收口`；M3 新会话交接记忆已单独提交。
- 发布路线已确认：不插入提前 NAS 试用版，继续按 M2-M5 完整路线推进；M5 后作为家庭 NAS 1.0 发布候选。
- M3 AI 功能是关键里程碑，进入 M3 前必须先专项规划 LLM 功能边界、System Prompt、结构化响应、解析校验、失败兜底、隐私和成本。
- M3.0 AI 专项规划已完成：后续从 M3.1 LLM 配置与调用边界开始，再推进结构化契约、候选确认、拍照识别、订单解析和主页 AI 建议。
- M3.1 LLM 配置与调用边界已完成：新增 `lib/ai/config.ts`、`lib/ai/client.ts`、`lib/api/ai.ts` 和 `GET /api/ai/health`，支持配置解析、OpenAI 兼容调用、有限重试、错误分类和脱敏中文错误。
- M3 AI 统一边界：AI 输出只作为候选；图片或订单中可见信息优先作为证据；缺失信息可语义推断为默认值但必须标明来源和置信度；用户确认或修改后才写入正式物品。
- M3 主页 AI 建议必须由用户手动触发，不做后台自动调用；远端 LLM 异常必须展示中文友好提示，不能导致页面额外报错。
- 本地 SQLite 开发库位于 `data/dev.db`，`data/` 被 Git 忽略。

## Conventions

- 工作语言、文档、提交信息、会话记录统一使用简体中文。
- 业务术语优先使用：物品、分类、位置、保质期、临期、预警。
- 变量、函数、类型、组件等代码标识符保持英文并遵循项目编码规范。
- API 返回错误使用中文用户可读信息，统一格式 `{ code, message, data? }`。
- 所有用户输入和外部边界必须验证；禁止硬编码密钥。
- 当前环境中 Next 命令通过 `scripts/run-next.mjs` 使用 wasm SWC，并预加载 `scripts/patch-readlink.cjs`。
- 当前环境中 `npm run prisma:push` 通过 `scripts/push-db.mjs` 在 Prisma CLI 失败时回退到 SQLite migration。
- 基础 UI 组件使用 `lucide-react` 作为线性图标来源。
- 应用主导航配置集中在 `lib/navigation.ts`；当前仅暴露已存在页面 `/` 和 `/ui`，避免导航到未实现路由。
- 密码使用 Node `crypto.scrypt` 加随机盐哈希；会话 token 使用 HMAC 签名并写入 HttpOnly Cookie。
- 生产环境必须配置 `AUTH_SECRET`；依赖 Cookie 或数据库状态的页面必须 `force-dynamic`。
- 本地和容器端口配置使用 `PORT`，不要使用旧的 `APP_PORT`。
- 首次管理员当前通过 `/setup` 页面创建，不使用环境变量硬编码初始管理员密码。
- 开发环境未配置 `AUTH_SECRET` 时，fallback secret 必须通过 `globalThis.authDevSecret` 在同一 dev 进程内保持稳定，避免 Next dev 模块重载后 Cookie 失效。
- 如果 `npm run build` 因 `.next/trace` EPERM 失败，先检查残留 dev server 是否占用 3000 端口并清理 `.next` 后重跑。
- M2 删除分类或位置时不删除物品，物品外键按 Prisma `onDelete: SetNull` 置空。
- M2 创建物品时自动创建 `ItemRecord(type=IN)`，操作人使用当前登录用户 ID。
- M2 物品详情接口返回最近 20 条出入库记录；M2 更新物品数量只更新当前值，不创建库存调整记录。
- 分类和位置管理共用 `components/inventory/taxonomy-manager.tsx`、`lib/api/taxonomy.ts`、`lib/validation/taxonomy.ts`。
- 物品 API 共用 `lib/api/items.ts`，物品输入和查询参数校验放在 `lib/validation/item.ts`。
- 物品 UI 共用 `components/inventory/item-manager.tsx`，表单 payload、日期输入和状态标签辅助逻辑放在 `lib/inventory/item-view.ts`。
- 物品列表筛选控件位于 `components/inventory/item-list-controls.tsx`；`lib/inventory/item-view.ts` 同时负责列表筛选状态的查询串构建和安全解析。
- 物品详情最近记录时间使用 `lib/inventory/item-view.ts` 的分钟级显示辅助函数，格式为 `YYYY-MM-DD HH:mm`。
- 分类/位置图标 emoji 候选集中在 `lib/inventory/taxonomy-icon-options.ts`，UI 通过 `components/inventory/taxonomy-manager.tsx` 消费。

## User Preferences

- 偏好简洁直接的中文沟通。
- 使用 `project-memory` 和 `handoff-driven-development` 管理长期协作。
- 进入编码前需先确认当前切片、范围、非目标和验收标准。
- 每个 slice 结束后，如果存在需要用户亲自确认的 UI、体验或运行结果，Agent 应在会话中输出一份人工验收/验证清单，方便用户逐项检查。

## Decisions Log

- **2026-05-30**: 初始化 `.memory/` 项目记忆体系。原因：项目将以多轮 vibe coding 方式推进，需要跨会话保留现场、决策与后续动作。
- **2026-05-30**: 初始化 `docs/TASKS.md`、`docs/TECH_PLAN.md`、`docs/AGENT_HANDOFF.md`。原因：将 `docs/` 作为开发操作真相，支持切片式实现和 Agent 交接。
- **2026-05-30**: 将 `docs/CONTEXT.md` 调整为轻量项目上下文，并拆分 `DOMAIN.md`、`DECISIONS.md`、`API.md`、`DATA_MODEL.md`、`DESIGN_SYSTEM.md`、`QUALITY.md`、`DEPLOYMENT.md`。原因：符合 handoff-driven-development 的文档职责边界。
- **2026-05-30**: M1.1 基础工程完成。原因：为后续 UI、认证、CRUD 和 AI 功能提供可运行、可验证的工程底座。
- **2026-05-30**: 保留 wasm SWC/readlink patch 与 Prisma SQLite fallback。原因：当前 Windows/M 盘沙箱环境存在原生 SWC 加载和 Prisma schema engine 写库问题。
- **2026-05-30**: 按用户要求将 `docs/`、`CLAUDE.md`、`AGENTS.md` 加入 `.gitignore` 并从 Git 索引移除。原因：用户希望这些项目不进入 Git 记录。
- **2026-05-30**: M1.2 基础 UI 组件库完成。原因：为后续物品录入、筛选、预警和设置页面提供统一控件。
- **2026-05-30**: M1.3 响应式布局框架完成。原因：为后续认证、物品管理和预警页面提供统一跨端导航外壳。
- **2026-05-30**: M1.4 用户认证系统完成。原因：为后续核心数据功能提供本地访问控制和当前用户上下文。
- **2026-05-31**: M1.5 review 收口完成。原因：进入 M2 前清理 M1 review 发现的代码规范、认证边界和文档一致性问题。
- **2026-05-31**: M2 计划确定为 M2.1 分类/位置、M2.2 物品 API、M2.3 物品 UI、M2.4 搜索筛选排序、M2.5 收口复查。原因：先完成物品依赖的外键数据，再实现物品闭环，可降低表单空状态和返工风险。
- **2026-05-31**: 用户确认 1.0 发布路线按 M2-M5 完整推进。原因：项目不急于提前试用，M3 AI 拍照智能入库是核心定位，应在完整版本中成熟实现后再上 NAS 家用。
- **2026-05-31**: 用户强调 M3 需要郑重规划。原因：AI 功能涉及产品构思、LLM API 交互、System Prompt 设计、结构化响应解析和失败兜底，是项目核心差异化能力。
- **2026-05-31**: M2.1 分类与位置基础管理实现完成并通过自动验证。原因：物品 CRUD 需要稳定分类和位置外键数据；后续用户已确认登录跳转修复，可继续推进 M2。
- **2026-05-31**: 修复开发环境访问分类/位置后反复跳登录。原因：未配置 `AUTH_SECRET` 时模块重载会重新生成临时密钥，导致旧 Cookie 签名失效；改为 `globalThis` 存储 dev fallback secret 并增加回归测试。
- **2026-06-01**: M2.2 物品 API 与领域逻辑完成。原因：M2.3 UI 需要稳定的物品 CRUD、列表查询和创建入库记录领域契约。
- **2026-06-01**: 会话交接收口完成。原因：新会话将从 M2.3 开始，需确保 docs、`.memory`、`.env.example` 对当前真实状态一致。
- **2026-06-01**: M2.3 物品管理 UI 完成代码实现并通过自动验证。原因：家庭用户需要通过 `/items` 页面维护物品，M2.4 将在此基础上打磨搜索、筛选和排序。
- **2026-06-01**: 将 slice 结束后的人工验收清单要求写入 `CLAUDE.md`。原因：后续 Agent 需要在每个切片结束时明确告诉用户哪些 UI/体验项需要人工检查。
- **2026-06-01**: M2.4 搜索、筛选、排序与列表打磨完成。原因：M2 核心闭环需要家庭用户能快速查找物品，且筛选状态可通过 URL 保留。
- **2026-06-01**: M2.5 收口复查完成。原因：M2 核心功能已闭环，下一步进入 M3 前必须先做 AI 专项规划而不是直接实现接口。
- **2026-06-01**: M2 体验打磨完成。原因：用户希望入库记录时间更精细，并让分类/位置图标字段支持更有趣的 emoji 指定体验。
- **2026-06-02**: M3.0 AI 专项规划完成。原因：用户补充确认 AI 需要支持语义默认填充、主页手动 AI 建议和远端调用友好错误提示；后续开发从 M3.1 LLM 配置与调用边界开始。
- **2026-06-02**: M3.1 LLM 配置与调用边界完成。原因：后续拍照识别、订单解析和主页 AI 建议需要稳定的 OpenAI 兼容配置、调用、重试和错误处理底座。
