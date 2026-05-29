# 家庭仓储管理系统 - 产品需求文档 (PRD)

## Problem Statement

家庭日常生活中，经常面临以下困扰：

1. **物品管理混乱**：亲友往来赠送的礼品、日用品堆积，缺乏系统化管理
2. **查找困难**："xx东西在哪？"成为家庭高频问题
3. **过期浪费**：物品放坏了才发现，造成经济损失
4. **补货不及时**：日用品用完了才意识到，影响日常生活
5. **记录成本高**：传统手工记录耗时耗力，难以坚持

**核心痛点**：缺乏一个简单、智能、私有的家庭物品管理方案。

## Solution

开发一个**家庭仓储管理Web应用**，具备以下特点：

1. **私有部署**：托管在家庭NAS的Docker容器中，数据完全私有
2. **智能识别**：通过LLM API实现拍照识别、订单解析
3. **跨平台访问**：Web应用支持手机、平板、PC等多终端
4. **预警提醒**：临期提醒、库存不足预警，避免浪费
5. **小清新UI**：薄荷绿治愈系配色，让收纳变得舒适

## User Stories

### 核心功能

1. 作为家庭主妇，我想要拍照记录冰箱里的食材，以便快速了解库存情况
2. 作为上班族，我想要查看日用品库存，以便及时补充卫生纸、洗衣液等
3. 作为父母，我想要记录孩子奶粉的保质期，以便在过期前使用完毕
4. 作为家庭成员，我想要搜索特定物品的位置，以便快速找到需要的东西
5. 作为家庭管理员，我想要设置库存预警阈值，以便在物品不足时收到提醒

### 物品录入

6. 作为用户，我想要手动输入物品信息（名称、数量、分类、位置），以便精确记录
7. 作为用户，我想要拍照识别物品，以便快速录入多个物品
8. 作为用户，我想要上传订单截图，以便自动提取商品信息
9. 作为用户，我想要批量导入物品，以便一次性录入大量物品
10. 作为用户，我想要为物品添加标签，以便更好地分类管理

### 库存管理

11. 作为用户，我想要查看所有物品列表，以便了解整体库存情况
12. 作为用户，我想要按分类筛选物品，以便快速找到特定类型的物品
13. 作为用户，我想要按位置筛选物品，以便了解某个区域的物品分布
14. 作为用户，我想要按状态筛选物品（正常、临期、过期），以便关注需要处理的物品
15. 作为用户，我想要搜索物品名称，以便快速定位特定物品
16. 作为用户，我想要编辑物品信息，以便更新数量、位置等变化
17. 作为用户，我想要删除物品，以便清理不再需要的记录
18. 作为用户，我想要查看物品详情，以便了解入库时间、保质期等信息

### 分类与位置管理

19. 作为用户，我想要创建自定义分类（食品、日用品、礼品等），以便更好地组织物品
20. 作为用户，我想要创建自定义位置（厨房、客厅、储物间等），以便标记物品存放位置
21. 作为用户，我想要为分类设置图标，以便直观识别
22. 作为用户，我想要为位置设置图标，以便直观识别
23. 作为用户，我想要编辑和删除分类，以便维护分类体系
24. 作为用户，我想要编辑和删除位置，以便维护位置体系

### 预警系统

25. 作为用户，我想要设置临期提醒天数，以便提前处理即将过期的物品
26. 作为用户，我想要设置库存不足阈值，以便及时补充物品
27. 作为用户，我想要查看临期物品列表，以便优先处理这些物品
28. 作为用户，我想要查看库存不足物品列表，以便制定购物清单
29. 作为用户，我想要查看过期物品列表，以便清理这些物品
30. 作为用户，我想要标记物品为"已处理"，以便从预警列表中移除

### 数据统计

31. 作为用户，我想要查看库存概览（总数、分类分布），以便了解整体情况
32. 作为用户，我想要查看空间分布（各位置物品数量），以便了解物品分布
33. 作为用户，我想要查看趋势分析（消耗速度、采购频率），以便优化采购计划
34. 作为用户，我想要导出统计数据，以便进行进一步分析

### 个人中心

35. 作为用户，我想要修改个人资料，以便个性化设置
36. 作为用户，我想要管理家庭成员，以便多人协作管理
37. 作为用户，我想要设置通知偏好，以便控制提醒方式
38. 作为用户，我想要备份和恢复数据，以便保护重要信息
39. 作为用户，我想要查看操作日志，以便追溯历史操作

### 移动端优化

40. 作为手机用户，我想要触摸友好的界面，以便单手操作
41. 作为手机用户，我想要快速添加按钮，以便随时记录物品
42. 作为手机用户，我想要离线访问功能，以便在没有网络时查看库存
43. 作为手机用户，我想要PWA支持，以便像原生应用一样使用

### PC端优化

44. 作为PC用户，我想要宽屏布局，以便查看更多信息
45. 作为PC用户，我想要键盘快捷键，以便提高操作效率
46. 作为PC用户，我想要批量操作功能，以便一次性处理多个物品

## Implementation Decisions

### 技术架构

#### 前端技术栈
- **框架**：React + Next.js + TypeScript
- **UI框架**：TailwindCSS
- **状态管理**：React Context / Zustand
- **路由**：Next.js App Router
- **HTTP客户端**：Fetch API / Axios

#### 后端技术栈
- **运行时**：Node.js（Next.js API Routes）
- **数据库**：SQLite
- **ORM**：Prisma（类型安全，自动生成TypeScript类型）
- **文件处理**：Multer
- **LLM集成**：OpenAI SDK（支持OpenAI API、Ollama等兼容格式）

#### 部署方案
- **容器化**：Docker + Docker Compose（必选）
- **数据持久化**：Docker Volume
- **端口配置**：默认3000，可通过环境变量修改

### 数据库设计

#### 设计原则
- 保留可扩展性，便于后期添加功能
- 使用Prisma ORM，自动生成TypeScript类型
- 支持数据迁移，版本控制

#### 核心表结构

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           Int       @id @default(autoincrement())
  username     String    @unique
  passwordHash String
  displayName  String?
  role         String    @default("member") // admin, member
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  // 关联
  itemRecords  ItemRecord[]
}

model Item {
  id           Int       @id @default(autoincrement())
  name         String
  description  String?
  quantity     Int       @default(1)
  categoryId   Int?
  locationId   Int?
  imageUrl     String?
  expiryDate   DateTime?
  purchaseDate DateTime?
  purchasePrice Float?
  notes        String?
  status       String    @default("normal") // normal, expiring, expired, low_stock
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  // 关联
  category     Category? @relation(fields: [categoryId], references: [id])
  location     Location? @relation(fields: [locationId], references: [id])
  tags         Tag[]     @relation("ItemTags")
  records      ItemRecord[]
  alerts       Alert[]
}

model Category {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  icon        String?
  color       String?
  description String?
  createdAt   DateTime  @default(now())
  
  // 关联
  items       Item[]
}

model Location {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  icon        String?
  color       String?
  description String?
  createdAt   DateTime  @default(now())
  
  // 关联
  items       Item[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  
  // 关联
  items Item[] @relation("ItemTags")
}

model ItemRecord {
  id            Int      @id @default(autoincrement())
  itemId        Int
  type          String   // "in" (入库)
  quantityChange Int     // 变动数量（正数为入库，负数为出库）
  operator      String   // 操作人
  notes         String?
  createdAt     DateTime @default(now())
  
  // 关联
  item          Item     @relation(fields: [itemId], references: [id])
  user          User?    @relation(fields: [operator], references: [id])
}

model Alert {
  id        Int      @id @default(autoincrement())
  itemId    Int
  type      String   // "expiring", "expired", "low_stock"
  status    String   @default("pending") // pending, resolved
  createdAt DateTime @default(now())
  
  // 关联
  item      Item     @relation(fields: [itemId], references: [id])
}
```

### API设计

#### API风格
- RESTful API：标准、易理解、LLM熟悉
- 路由规范：`/api/resources`（复数形式）
- HTTP方法：GET（查询）、POST（创建）、PUT（更新）、DELETE（删除）

#### 错误处理
- 统一格式：`{ code: number, message: string, data?: any }`
- HTTP状态码：200（成功）、400（参数错误）、401（未认证）、404（未找到）、500（服务器错误）
- 错误信息：中文错误信息，便于用户理解

#### 认证方式
- JWT Token：登录后返回Token，后续请求携带Token
- Token存储：localStorage或Cookie

#### 物品管理API

```
GET    /api/items              # 获取物品列表（支持筛选、分页）
POST   /api/items              # 创建物品
GET    /api/items/:id          # 获取物品详情
PUT    /api/items/:id          # 更新物品
DELETE /api/items/:id          # 删除物品
POST   /api/items/batch        # 批量创建物品
POST   /api/items/recognize    # 拍照识别物品
POST   /api/items/parse-order  # 解析订单截图
```

#### 分类管理API

```
GET    /api/categories         # 获取分类列表
POST   /api/categories         # 创建分类
PUT    /api/categories/:id     # 更新分类
DELETE /api/categories/:id     # 删除分类
```

#### 位置管理API

```
GET    /api/locations          # 获取位置列表
POST   /api/locations          # 创建位置
PUT    /api/locations/:id      # 更新位置
DELETE /api/locations/:id      # 删除位置
```

#### 标签管理API

```
GET    /api/tags               # 获取标签列表
POST    /api/tags              # 创建标签
PUT    /api/tags/:id           # 更新标签
DELETE /api/tags/:id           # 删除标签
```

#### 出入库记录API

```
GET    /api/items/:id/records  # 获取物品出入库记录
POST   /api/items/:id/records  # 添加出入库记录
PUT    /api/records/:id        # 更新出入库记录
```

#### 预警管理API

```
GET    /api/alerts             # 获取所有预警
GET    /api/alerts/expiring    # 获取临期物品
GET    /api/alerts/low-stock   # 获取库存不足物品
GET    /api/alerts/expired     # 获取过期物品
PUT    /api/alerts/:id/resolve # 标记预警为已处理
POST   /api/alerts/batch-resolve # 批量处理预警
```

#### 统计API

```
GET    /api/stats/overview     # 获取库存概览
GET    /api/stats/distribution # 获取空间分布
GET    /api/stats/trends       # 获取趋势分析
GET    /api/stats/export       # 导出统计数据
```

#### 用户管理API

```
POST   /api/auth/login         # 用户登录
POST   /api/auth/logout        # 用户登出
GET    /api/users/me           # 获取当前用户信息
PUT    /api/users/me           # 更新用户信息
GET    /api/users              # 获取用户列表（管理员）
POST   /api/users              # 创建用户（管理员）
```

#### 备份管理API

```
GET    /api/backups            # 获取备份列表
POST   /api/backups            # 创建备份
POST   /api/backups/:id/restore # 恢复备份
DELETE /api/backups/:id        # 删除备份
```

### LLM集成设计

#### 拍照识别流程

1. 用户上传图片
2. 后端调用LLM API（OpenAI格式）
3. LLM返回识别结果（物品名称、分类、数量）
4. 用户确认或修正识别结果
5. 保存物品信息

#### 订单解析流程

1. 用户上传订单截图
2. 后端调用LLM API解析订单内容
3. LLM返回商品列表（名称、数量、价格）
4. 用户确认或修正商品信息
5. 批量保存物品信息

#### LLM API配置

```javascript
// 支持多种LLM提供商
const llmConfig = {
  provider: 'openai', // openai, ollama, custom
  apiKey: process.env.LLM_API_KEY,
  baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  model: process.env.LLM_MODEL || 'gpt-4-vision-preview',
  maxTokens: 1000,
  temperature: 0.1
};
```

### UI设计规范

#### 配色方案

```css
:root {
  /* 主色系 */
  --primary: #4FBF8F;        /* 主色 */
  --primary-light: #EAF8F1;  /* 主色浅背景 */
  
  /* 功能色 */
  --warning: #F6A04D;        /* 警告/临期 */
  --danger: #E85D5A;         /* 危险/过期 */
  
  /* 中性色 */
  --background: #F7F5EF;     /* 辅助背景 */
  --card: #ffffff;           /* 卡片背景 */
  --text-primary: #333333;   /* 主要文字 */
  --text-secondary: #666666; /* 次要文字 */
  --text-tertiary: #999999;  /* 弱文字 */
  --border: #E8E2D8;         /* 边框颜色 */
}
```

#### 字体

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
  'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
  'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
  'Noto Color Emoji';
```

#### 图标

- 线性图标：Heroicons、Lucide等
- 风格：现代、简洁、与小清新风格匹配
```

#### 字体规范

```css
/* 字体栈 */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
  'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
  'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
  'Noto Color Emoji';

/* 字号层级 */
--font-size-xs: 12px;    /* 标签、辅助文字 */
--font-size-sm: 14px;    /* 正文 */
--font-size-base: 16px;  /* 主要内容 */
--font-size-lg: 18px;    /* 小标题 */
--font-size-xl: 20px;    /* 标题 */
--font-size-2xl: 24px;   /* 大标题 */
--font-size-3xl: 30px;   /* 页面标题 */
```

#### 间距规范

```css
/* 间距系统 */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;

/* 圆角 */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

#### 组件设计

1. **卡片组件**
   - 白色背景，圆角8px
   - 浅灰色阴影（0 2px 8px rgba(0,0,0,0.08)）
   - 内边距16px

2. **按钮组件**
   - 主要按钮：薄荷绿背景，白色文字
   - 次要按钮：白色背景，薄荷绿边框
   - 危险按钮：红色背景，白色文字

3. **输入框组件**
   - 白色背景，灰色边框
   - 聚焦时边框变为薄荷绿
   - 圆角8px，内边距12px

4. **标签组件**
   - 分类标签：图标 + 文字，浅色背景
   - 状态标签：颜色编码（正常/临期/过期）

5. **导航栏**
   - 底部固定导航（移动端）
   - 侧边栏导航（PC端）
   - 当前页面高亮显示

### 响应式设计

#### 断点设置

```css
/* 移动端优先 */
--screen-sm: 640px;   /* 小屏手机 */
--screen-md: 768px;   /* 平板 */
--screen-lg: 1024px;  /* 笔记本 */
--screen-xl: 1280px;  /* 桌面 */
--screen-2xl: 1536px; /* 大屏 */
```

#### 布局策略

1. **移动端（<768px）**
   - 单列布局
   - 底部固定导航
   - 触摸友好的按钮尺寸（44px以上）
   - 全屏模态框

2. **平板端（768px-1024px）**
   - 两列布局
   - 侧边栏可折叠
   - 中等按钮尺寸

3. **PC端（>1024px）**
   - 左侧侧边栏 + 右侧大面积功能展示区（类似WordPress管理后台）
   - 固定侧边栏
   - 键盘快捷键支持
   - 批量操作工具栏
   - 两列布局（物品列表 + 详情）
   - 侧边栏可折叠
   - 适中的按钮尺寸

3. **PC端（>1024px）**
   - 三列布局（导航 + 列表 + 详情）
   - 固定侧边栏
   - 键盘快捷键支持
   - 批量操作工具栏

## Testing Decisions

### 测试策略

#### 单元测试
- **工具**：Vitest（前端）、Jest（后端）
- **覆盖范围**：工具函数、业务逻辑、数据处理
- **目标覆盖率**：80%以上

#### 集成测试
- **工具**：Vitest + msw（前端）、Supertest（后端）
- **覆盖范围**：API接口、数据库操作、LLM集成
- **测试环境**：内存数据库（SQLite in-memory）

#### E2E测试
- **工具**：Playwright
- **覆盖范围**：核心用户流程
- **测试场景**：
  1. 用户登录/登出
  2. 物品录入（手动、拍照）
  3. 物品搜索和筛选
  4. 预警查看和处理
  5. 数据统计查看

#### 视觉回归测试
- **工具**：Playwright + 视觉对比
- **覆盖范围**：关键页面和组件
- **测试环境**：多设备尺寸

### 测试数据管理

1. **测试数据库**：每个测试用例使用独立的内存数据库
2. **测试固件**：预定义的测试数据集
3. **清理策略**：测试结束后自动清理数据

### 持续集成

1. **代码检查**：ESLint、Prettier
2. **类型检查**：TypeScript（可选）
3. **测试运行**：每次提交自动运行测试
4. **覆盖率报告**：生成覆盖率报告并设置阈值

## Out of Scope

### 第一阶段不包含的功能

1. **多语言支持**：仅支持中文界面
2. **离线同步**：不支持离线数据同步
3. **移动端原生应用**：仅提供Web应用
4. **高级数据分析**：不包含机器学习预测
5. **第三方集成**：不对接电商平台、支付系统
6. **多家庭管理**：仅支持单家庭使用
7. **云同步**：不支持数据云端同步
8. **语音输入**：不支持语音录入物品
9. **AR识别**：不支持增强现实识别
10. **智能推荐**：不包含个性化推荐算法

### 技术限制

1. **LLM API依赖**：拍照识别功能依赖外部API
2. **NAS性能**：受限于家庭NAS的硬件性能
3. **网络环境**：仅支持局域网访问
4. **存储空间**：受限于NAS存储容量
5. **并发用户**：不支持高并发访问

## Further Notes

### 开发优先级

1. **P0（必须）**：物品CRUD、分类管理、位置管理、基础预警、用户管理
2. **P1（重要）**：拍照识别、订单解析、位置推荐、智能分类、保质期识别、购物清单生成
3. **P2（次要）**：数据统计、数据可视化、预警通知（第三方推送）
4. **P3（可选）**：数据备份、智能提醒、消耗预测、图片搜索

### 开发阶段与里程碑

**开发工具**：Codex + GPT-5.5-high（vibe coding）

**阶段一：基础框架（Week 1）**
- 里程碑1.1：Next.js项目初始化 + Prisma配置 + SQLite连接
- 里程碑1.2：基础UI组件库（按钮、输入框、卡片、导航）
- 里程碑1.3：响应式布局框架（移动端/平板/PC）
- 里程碑1.4：用户认证系统（登录/注册/权限）

**阶段二：核心功能（Week 2）**
- 里程碑2.1：物品CRUD（创建、查看、编辑、删除）
- 里程碑2.2：分类管理（创建、编辑、删除、筛选）
- 里程碑2.3：位置管理（创建、编辑、删除、筛选）
- 里程碑2.4：物品列表页（搜索、筛选、排序）

**阶段三：AI功能（Week 3）**
- 里程碑3.1：LLM API集成（OpenAI、Ollama）
- 里程碑3.2：拍照识别物品（名称、分类、数量）
- 里程碑3.3：订单截图解析
- 里程碑3.4：位置推荐 + 智能分类

**阶段四：预警与统计（Week 4）**
- 里程碑4.1：预警系统（临期、过期、库存不足）
- 里程碑4.2：预警通知（应用内 + 第三方推送）
- 里程碑4.3：数据统计（库存概览、空间分布）
- 里程碑4.4：数据可视化（ECharts图表）

**阶段五：部署与优化（Week 5）**
- 里程碑5.1：Docker容器化
- 里程碑5.2：Docker Compose编排
- 里程碑5.3：初始化设置流程
- 里程碑5.4：数据备份与恢复
- 里程碑5.5：性能优化与测试

### 部署要求

#### 硬件要求
- **NAS**：支持Docker的NAS设备（群晖、威联通等）
- **内存**：至少2GB可用内存
- **存储**：至少10GB可用空间
- **网络**：家庭局域网环境

#### 软件要求
- **Docker**：20.10.0或更高版本
- **Docker Compose**：2.0.0或更高版本
- **浏览器**：Chrome 90+、Firefox 88+、Safari 14+、Edge 90+

### 数据备份策略

1. **自动备份**：每日凌晨自动备份数据库
2. **手动备份**：支持手动触发备份
3. **备份保留**：保留最近30天的备份
4. **备份位置**：备份文件存储在NAS的独立目录

### 安全考虑

1. **访问控制**：基于用户名/密码的认证
2. **数据加密**：敏感数据加密存储
3. **网络安全**：仅限局域网访问，不暴露到公网
4. **输入验证**：所有用户输入进行严格验证
5. **SQL注入防护**：使用参数化查询
6. **XSS防护**：输出编码和内容安全策略

### 性能优化

1. **图片压缩**：上传图片自动压缩
2. **懒加载**：列表项懒加载
3. **缓存策略**：API响应缓存
4. **数据库索引**：关键字段建立索引
5. **CDN加速**：静态资源CDN（可选）

### 监控和日志

1. **应用日志**：记录关键操作和错误
2. **性能监控**：API响应时间监控
3. **错误追踪**：错误自动上报
4. **使用统计**：功能使用情况统计

---

**文档版本**：1.0.0  
**创建日期**：2026-05-29  
**最后更新**：2026-05-29  
**作者**：AI Assistant  
**审核者**：待定
