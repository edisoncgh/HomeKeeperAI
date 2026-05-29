# API Plan

## 风格约定

- API 使用 RESTful 风格。
- 路由使用复数资源名，如 `/api/items`、`/api/categories`、`/api/locations`。
- HTTP 方法：GET 查询、POST 创建、PUT 更新、DELETE 删除。
- 错误响应格式：`{ code: number, message: string, data?: unknown }`。
- 错误信息使用中文，便于家庭用户理解。

## 认证

- 登录后返回 Token 或设置 Cookie，会话方案在 M1.4 确认。
- 用户角色包括管理员和普通成员。
- 管理员负责用户管理和系统设置。
- 所有家庭成员可查看所有物品。

## 物品管理

```text
GET    /api/items
POST   /api/items
GET    /api/items/:id
PUT    /api/items/:id
DELETE /api/items/:id
POST   /api/items/batch
POST   /api/items/recognize
POST   /api/items/parse-order
```

列表接口应支持搜索、分类筛选、位置筛选、状态筛选、标签筛选、分页和排序。

## 分类、位置、标签

```text
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/locations
POST   /api/locations
PUT    /api/locations/:id
DELETE /api/locations/:id

GET    /api/tags
POST   /api/tags
PUT    /api/tags/:id
DELETE /api/tags/:id
```

## 出入库记录

```text
GET  /api/items/:id/records
POST /api/items/:id/records
PUT  /api/records/:id
```

## 预警

```text
GET  /api/alerts
GET  /api/alerts/expiring
GET  /api/alerts/low-stock
GET  /api/alerts/expired
PUT  /api/alerts/:id/resolve
POST /api/alerts/batch-resolve
```

## 统计

```text
GET /api/stats/overview
GET /api/stats/distribution
GET /api/stats/trends
GET /api/stats/export
```

## 用户与备份

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/users/me
PUT  /api/users/me
GET  /api/users
POST /api/users

GET    /api/backups
POST   /api/backups
POST   /api/backups/:id/restore
DELETE /api/backups/:id
```

## LLM 接口约束

- 上传图片或订单截图后，后端调用 OpenAI 兼容 API。
- LLM 输出必须解析为结构化候选数据。
- 候选数据必须返回给用户确认或修改。
- 只有用户确认后的数据才能写入正式物品记录。
