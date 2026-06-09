# HomeKeeperAI 爱管家

**Home** + **Keeper** + **AI** — 你的 AI 家庭管家，管理你的家。

"爱"谐音 **AI**，管家既是"帮你管家的人"，也是"管理这个家"的动作。

---

面向家庭局域网和 NAS 私有部署的 AI 仓储管理 Web 应用。记录家庭物品、分类、位置、保质期、库存状态，通过 OpenAI 兼容 LLM 服务辅助拍照识别物品、订单截图解析和首页整理建议。

## 主要功能

- **私有部署**：面向家庭 NAS + Docker Compose，默认仅局域网访问，数据不出家门。
- **本地认证**：首次管理员初始化、用户名密码登录、HttpOnly Cookie 会话。
- **分类和位置管理**：支持自定义分类、存放位置、图标和说明。
- **物品管理**：支持物品创建、查看、编辑、删除、搜索、筛选、排序和分页。
- **入库记录**：创建物品时自动记录入库时间，详情页展示最近记录。
- **AI 拍照识别**：手机拍照或上传图片，AI 自动识别物品并生成录入候选。
- **AI 订单解析**：粘贴订单截图，AI 批量提取商品信息并生成候选。
- **AI 候选确认**：所有 AI 识别结果先进入候选确认流程，用户确认或修改后才写入正式数据。
- **首页 AI 建议**：手动触发，生成整理、补录、位置优化和消耗关注建议。
- **预警中心**：自动生成临期、过期、低库存预警，支持标记已处理。
- **基础统计**：库存总览、状态统计、分类分布、位置分布。
- **系统设置**：配置 LLM Base URL、模型和 API Key，API Key 加密存储且不回显明文。
- **数据备份与恢复**：SQLite 手动备份、列表、恢复前保护性备份、恢复和删除。

## 技术栈

- Next.js App Router
- React
- TypeScript
- TailwindCSS
- Prisma
- SQLite
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

至少需要设置生产密钥：

```bash
AUTH_SECRET="replace-with-a-long-random-secret"
```

可以用 Node.js 生成一个随机密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

如果你的 NAS 只在家庭局域网通过纯 HTTP 访问，没有 HTTPS 或反向代理，需要显式关闭 Secure Cookie：

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

默认访问地址：`http://localhost:3000`

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
- `home-storage-uploads:/app/uploads`：未来图片上传目录预留。
- `home-storage-backups:/app/backups`：SQLite 备份文件。

容器内数据库路径固定为 `DATABASE_URL=file:/app/data/home-storage.db`。

删除或重建容器不会删除数据库和备份；如果执行 `docker compose down -v`，会删除所有 Volume，请谨慎使用。

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 宿主机访问端口 | `3000` |
| `AUTH_SECRET` | 生产必填，用于 Cookie 签名和设置加密 | 无 |
| `AUTH_COOKIE_SECURE` | Cookie 是否带 `Secure` 标记 | `true` |
| `DATABASE_URL` | 本地开发数据库路径 | `file:../data/dev.db` |
| `BACKUP_DIR` | 备份目录 | 空 |
| `IMAGE_TAG` | Compose 构建镜像标签 | `latest` |
| `NODE_IMAGE` | Node 基础镜像覆盖 | 空 |
| `LLM_BASE_URL` | OpenAI 兼容服务地址 | `https://api.openai.com/v1` |
| `LLM_MODEL` | LLM 模型名 | 空 |
| `LLM_API_KEY` | LLM API Key，数据库设置可覆盖环境默认值 | 空 |

## 本地开发

```bash
# 安装依赖
npm install

# 初始化 Prisma Client 和 SQLite
npm run prisma:generate
npm run prisma:push

# 启动开发服务
npm run dev
```

默认访问 `http://localhost:3000`。

本地开发未配置 `AUTH_SECRET` 时，系统会使用开发 fallback secret；生产环境不能依赖这个机制。

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

- **创建备份**：复制当前 SQLite 数据库到备份目录。
- **查看备份**：按时间查看已有备份文件。
- **恢复备份**：恢复前会要求确认，并先创建当前数据库的保护性备份。
- **删除备份**：只允许删除合法备份文件名，禁止路径穿越。

备份文件名形如：

```text
home-storage-YYYYMMDD-HHmmss.db
home-storage-protect-YYYYMMDD-HHmmss.db
```

## 范围和限制

**已实现**：核心仓储管理、AI 辅助录入和建议、应用内预警、基础统计、Docker/Compose 部署、SQLite 备份恢复。

**未实现**：图片上传和持久化、多图/缩略图、标签管理、批量操作、购物清单、出库/库存调整流程、趋势统计/导出/高级图表、第三方推送、多家庭权限/密码重置/完整用户管理、PWA 和离线访问。

## 许可证

MIT
