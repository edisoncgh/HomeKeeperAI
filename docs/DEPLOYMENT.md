# Deployment Plan

## 目标环境

- NAS：支持 Docker 的群晖、威联通或类似设备。
- 网络：家庭局域网访问，不默认暴露公网。
- 内存：至少 2GB 可用内存。
- 存储：至少 10GB 可用空间。
- 浏览器：Chrome 90+、Firefox 88+、Safari 14+、Edge 90+。

## 容器化

- Dockerfile 是必选项。
- Docker Compose 是必选项。
- 默认端口：3000，可通过环境变量修改。
- 数据库、图片、备份和配置必须通过 Volume 持久化。

## 环境变量

计划配置项：

- `DATABASE_URL`，本地默认示例为 `file:../data/dev.db`
- `APP_PORT`
- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`
- `INITIAL_ADMIN_USERNAME`
- `INITIAL_ADMIN_PASSWORD`

仓库只能提交 `.env.example`，不得提交真实 `.env` 或密钥。

## 本地数据目录

- 本地 SQLite 开发库位于 `data/dev.db`。
- `data/` 已在 `.gitignore` 中忽略，不进入版本控制。
- `.env` 可在本机保存非密钥开发配置，但不得提交。

## 初始化设置

首次访问流程：

1. 检查是否存在管理员账户。
2. 不存在则进入初始化页面。
3. 创建初始管理员。
4. 配置 LLM 服务。
5. 配置家庭主要位置。
6. 进入首页。

## 数据持久化

- SQLite 数据库文件存储在 Docker Volume。
- 物品图片存储在 Docker Volume。
- 系统配置存储在数据库。
- 备份文件存储在独立 Volume 或用户指定目录。

## 备份与恢复

- 自动备份默认每 7 天执行一次，可修改或关闭。
- 支持手动备份。
- 默认保留最近 30 天备份。
- 恢复前应展示备份点和恢复内容摘要，用户确认后执行。

## 安全约束

- 默认仅局域网访问。
- 用户名和密码本地认证。
- 密码必须哈希存储。
- 所有用户输入必须验证。
- SQL 访问通过 Prisma 参数化。
- HTML 输出必须避免 XSS。
