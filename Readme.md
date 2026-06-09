# 家庭仓储管理系统

面向家庭局域网和 NAS 私有部署的家庭 AI 仓储管理 Web 应用。它用于记录家庭物品、分类、位置、保质期、库存状态和备份数据，并通过 OpenAI 兼容 LLM 服务辅助拍照识别、订单截图解析和首页整理建议。

当前项目处于 **1.0 发布候选自动验证通过** 状态：M1-M5 规划内开发已完成，完整质量门、本地核心流程烟测、Docker/Compose 发布候选验证、代码卫生/密钥/范围扫描均已通过；仍等待最终人工验收和 Git 收口。

## 主要功能

- 私有部署：面向家庭 NAS + Docker Compose，默认仅局域网访问。
- 本地认证：首次管理员初始化、用户名密码登录、HttpOnly Cookie 会话。
- 分类和位置管理：支持自定义分类、存放位置、图标、颜色和说明。
- 物品管理：支持物品创建、查看、编辑、删除、搜索、筛选、排序和分页。
- 入库记录：创建物品时自动记录一条入库记录，详情页展示最近记录时间。
- AI 辅助录入：支持拍照识别物品、订单截图解析，并统一进入候选确认流程后再写入正式数据。
- 首页 AI 建议：用户手动触发，生成整理、补录、位置优化和消耗关注建议，不自动写库。
- 预警中心：确定性生成临期、过期、低库存预警，并支持标记已处理。
- 基础统计：库存总览、状态统计、分类分布、位置分布、未分类和未设置位置统计。
- 系统设置：在 `/settings` 配置 LLM Base URL、模型和 API Key；API Key 加密存储且不回显明文。
- 数据备份与恢复：支持 SQLite 手动备份、列表、恢复前保护性备份、恢复和删除。

## 技术栈

- Next.js App Router
- React
- TypeScript
- TailwindCSS
- Prisma
- SQLite
- Vitest
- Docker + Docker Compose
- OpenAI 兼容 LLM API

## 快速部署

### 1. 准备环境

- Docker 20.10+
- Docker Compose 2.0+
- 支持 Docker 的 NAS 或本机 Docker 环境
- 建议至少 2GB 可用内存和 10GB 可用存储空间

### 2. 配置环境变量

复制示例环境变量：

```bash
cp .env.example .env
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env
```

至少需要设置生产密钥：

```bash
AUTH_SECRET="replace-with-a-long-random-secret"
```

可以用 Node.js 生成一个随机密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

如果你的 NAS 只在家庭局域网通过纯 HTTP 访问，没有 HTTPS 或反向代理，需要显式关闭生产 Secure Cookie：

```bash
AUTH_COOKIE_SECURE="false"
```

如果使用 HTTPS 或反向代理，请保持默认：

```bash
AUTH_COOKIE_SECURE="true"
```

### 3. 启动

```bash
docker compose up -d --build
```

默认访问地址：

```text
http://localhost:3000
```

首次启动且数据库无用户时，访问 `/setup` 创建管理员；已有用户后访问 `/login` 登录。

### 4. Docker Hub 不可达时

Dockerfile 默认使用官方 `node:22.22.0-slim`。如果当前网络无法拉取 Docker Hub 镜像，可以在 `.env` 中设置可达的 Node 镜像源：

```bash
NODE_IMAGE="docker.m.daocloud.io/library/node:22.22.0-slim"
```

然后重新构建：

```bash
docker compose up -d --build
```

## Docker 数据目录

Compose 默认挂载三个命名 Volume：

- `home-storage-data:/app/data`：SQLite 数据库。
- `home-storage-uploads:/app/uploads`：未来图片上传目录预留，1.0 不实现图片上传。
- `home-storage-backups:/app/backups`：SQLite 备份文件。

容器内数据库路径固定为：

```text
DATABASE_URL=file:/app/data/home-storage.db
```

删除或重建容器不应删除数据库和备份；如果执行 `docker compose down -v`，会删除测试或部署 Volume，请谨慎使用。

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 宿主机访问端口，Compose 映射到容器 3000 | `3000` |
| `AUTH_SECRET` | 生产必填，用于 Cookie 签名和设置加密 | 无 |
| `AUTH_COOKIE_SECURE` | Cookie 是否带 `Secure` 标记 | `true` |
| `DATABASE_URL` | 本地开发数据库路径 | `file:../data/dev.db` |
| `BACKUP_DIR` | 备份目录，Compose 默认容器内 `/app/backups` | 空 |
| `IMAGE_TAG` | Compose 构建镜像标签 | `latest` |
| `NODE_IMAGE` | Node 基础镜像覆盖 | 空 |
| `LLM_BASE_URL` | OpenAI 兼容服务地址 | `https://api.openai.com/v1` |
| `LLM_MODEL` | LLM 模型名 | 空 |
| `LLM_API_KEY` | LLM API Key，数据库设置可覆盖环境默认值 | 空 |

生产部署注意事项：

- 必须配置稳定、高熵的 `AUTH_SECRET`。
- 不要提交 `.env` 或任何真实密钥。
- 纯 HTTP 局域网部署需要 `AUTH_COOKIE_SECURE=false`。
- HTTPS 或反向代理部署建议保持 `AUTH_COOKIE_SECURE=true`。
- `/api/ai/health` 只验证文本连通性，不代表 vision 模型一定支持拍照识别或订单截图解析。

## 本地开发

安装依赖：

```bash
npm install
```

初始化 Prisma Client 和 SQLite：

```bash
npm run prisma:generate
npm run prisma:push
```

启动开发服务：

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

本地开发未配置 `AUTH_SECRET` 时，系统会使用开发 fallback secret；生产环境不能依赖这个机制。

## 验证命令

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:check
```

M5.5 最近一次完整验证结果：

- `npm run lint` 通过
- `npm run typecheck` 通过
- `npm run test` 通过，37 个测试文件、125 个测试
- `npm run build` 通过
- `npm run db:check` 通过
- Docker Compose 构建、启动、数据持久化和备份 Volume 验证通过

## 使用指南

### 初始化管理员

1. 首次访问 `/setup`。
2. 创建管理员用户名、显示名和密码。
3. 创建成功后进入应用。

系统不会通过环境变量创建初始管理员密码，避免部署时留下默认账号风险。

### 配置 LLM

1. 登录后进入 `/settings`。
2. 填写 OpenAI 兼容 `Base URL`、模型名和 API Key。
3. 点击测试连接。
4. 保存后，数据库配置优先于环境变量默认值。

API Key 会加密存储，不会在页面或 API 中回显明文。

### 备份和恢复

进入 `/settings` 的数据备份区域：

- 创建备份：复制当前 SQLite 数据库到备份目录。
- 查看备份：按时间查看已有备份文件。
- 恢复备份：恢复前会要求确认，并先创建当前数据库的保护性备份。
- 删除备份：只允许删除合法备份文件名，禁止路径穿越。

备份文件名形如：

```text
home-storage-YYYYMMDD-HHmmss.db
home-storage-protect-YYYYMMDD-HHmmss.db
```

1.0 当前只备份 SQLite 数据库；图片上传目录仍是未来能力预留。

## 1.0 发布候选人工验收清单

- `/setup` 创建管理员并登录。
- `/categories` 和 `/locations` 创建、编辑、删除分类和位置。
- `/items` 创建、编辑、删除物品，并验证搜索、筛选、排序。
- 已配置 LLM 后，在 `/items` 检查拍照识别、订单解析和候选确认入库。
- 首页 `/` 手动触发 AI 智能建议，确认失败时不影响其他内容。
- `/alerts` 查看临期、过期、低库存预警，并标记已处理。
- `/stats` 查看库存总览、状态统计、分类分布和位置分布。
- `/settings` 保存和读取 LLM 设置，确认 API Key 不明文回显。
- `/settings` 创建备份、恢复备份和删除备份。
- Docker Compose 重建容器后确认数据仍存在。

## 当前范围和限制

1.0 已实现：

- 核心仓储管理
- AI 辅助录入和建议
- 应用内预警
- 基础统计
- Docker/Compose 部署
- SQLite 备份恢复

1.0 未实现：

- 图片上传和图片持久化
- 多图、缩略图、图片目录备份
- 标签管理
- 批量操作
- 购物清单
- 出库或库存调整流程
- 趋势统计、导出和高级图表
- 第三方推送
- 多家庭权限、密码重置和完整用户管理
- PWA 和离线访问

## 项目文档

- `docs/CONTEXT.md`：项目上下文。
- `docs/TASKS.md`：里程碑、切片和验收状态。
- `docs/TECH_PLAN.md`：技术架构和模块边界。
- `docs/API.md`：API 契约。
- `docs/DATA_MODEL.md`：数据模型。
- `docs/DEPLOYMENT.md`：Docker、NAS、环境变量、Volume 和备份。
- `docs/QUALITY.md`：验证策略和验证记录。
- `docs/AGENT_HANDOFF.md`：交接状态。

说明：`docs/`、`CLAUDE.md`、`AGENTS.md` 是本地协作文档，按项目约定被 Git 忽略；`.memory/` 作为项目级记忆继续随代码提交。
