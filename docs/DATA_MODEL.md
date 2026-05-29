# Data Model

## 设计原则

- 使用 Prisma 管理 schema、迁移和类型生成。
- 使用 SQLite，数据库文件存储在 Docker Volume 中。
- 保留扩展性，但第一阶段优先实现核心表。
- 所有用户输入在 API 边界进行验证。

## 核心模型

### User

- `id`
- `username`
- `passwordHash`
- `displayName`
- `role`: `admin` 或 `member`
- `createdAt`
- `updatedAt`

### Item

- `id`
- `name`
- `description`
- `quantity`
- `categoryId`
- `locationId`
- `imageUrl` 或后续图片关联表
- `expiryDate`
- `purchaseDate`
- `purchasePrice`
- `notes`
- `status`: `normal`、`expiring`、`expired`、`low_stock`
- `createdAt`
- `updatedAt`

### Category

- `id`
- `name`
- `icon`
- `color`
- `description`
- `createdAt`

### Location

- `id`
- `name`
- `icon`
- `color`
- `description`
- `createdAt`

### Tag

- `id`
- `name`

### ItemRecord

- `id`
- `itemId`
- `type`
- `quantityChange`
- `operator`
- `notes`
- `createdAt`

### Alert

- `id`
- `itemId`
- `type`: `expiring`、`expired`、`low_stock`
- `status`: `pending`、`resolved`
- `createdAt`

## 关系

- Category 一对多 Item。
- Location 一对多 Item。
- Item 多对多 Tag。
- Item 一对多 ItemRecord。
- Item 一对多 Alert。
- User 一对多 ItemRecord。

## 待实现时确认

- 图片是否第一阶段使用单字段 `imageUrl`，还是直接设计 `ItemImage` 表。
- `operator` 使用用户 ID 还是用户名快照。
- 低库存阈值是物品级字段、分类默认值，还是全局设置。
