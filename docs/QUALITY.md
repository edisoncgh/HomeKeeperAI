# Quality Plan

## 自动化检查

当前命令：
- `npm run lint`：代码风格和潜在问题。
- `npm run typecheck`：TypeScript 类型检查。
- `npm run test`：单元测试和集成测试。
- `npm run build`：生产构建验证。
- `npm run db:check`：SQLite + Prisma Client 连接验证。

待后续补齐：
- `npm run test:e2e`：核心流程 E2E。

## M1.1 验证结果

- `npm run prisma:generate`：通过。
- `npm run prisma:push`：通过。
- `npm run db:check`：通过。
- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm run test`：通过。
- `npm run build`：通过。

## 测试范围

### 单元测试

- 工具函数。
- 业务逻辑。
- 数据处理。
- 预警计算。

### 集成测试

- API 路由。
- Prisma 数据库操作。
- LLM 结构化输出解析。

### E2E 测试

- 登录和登出。
- 手动物品录入。
- 物品搜索和筛选。
- 预警查看和处理。
- 数据统计查看。

## 手工验收

- 移动端单手操作是否顺畅。
- PC 端是否能高效浏览列表和详情。
- AI 识别结果是否始终进入用户确认流程。
- Docker Compose 启动后数据是否持久化。

## TDD 边界

- 预警计算、筛选排序、API 输入校验等纯逻辑优先测试驱动。
- UI 视觉、响应式和 Docker 部署以 Playwright、截图和人工验收为主。

## 覆盖率目标

- 单元测试目标覆盖率：80% 以上。
- 核心 API 集成测试：优先覆盖 100% 关键路径。
- 核心 E2E 流程：覆盖登录、录入、搜索筛选、预警处理。
