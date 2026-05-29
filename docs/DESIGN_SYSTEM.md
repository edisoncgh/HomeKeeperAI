# Design System

## 视觉方向

整体视觉应是治愈、清爽、触摸友好的家庭管理工具，但 PC 端要保持管理后台的效率感。避免做成营销落地页，第一屏应直接进入可用的管理体验。

## 色彩

```css
:root {
  --primary: #4FBF8F;
  --primary-light: #EAF8F1;
  --warning: #F6A04D;
  --danger: #E85D5A;
  --background: #F7F5EF;
  --card: #FFFFFF;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --border: #E8E2D8;
}
```

## 字体

使用系统字体栈：

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, "Noto Sans", sans-serif,
  "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
  "Noto Color Emoji";
```

## 字号

- `12px`: 标签、辅助文字。
- `14px`: 正文。
- `16px`: 主要内容。
- `18px`: 小标题。
- `20px`: 标题。
- `24px`: 大标题。
- `30px`: 页面标题。

## 间距和圆角

- 间距：4、8、16、24、32、48。
- 卡片圆角默认 8px。
- 输入框圆角默认 8px。
- 触摸目标不小于 44px。

## 布局

- 移动端：单列布局，底部固定导航。
- 平板端：两列布局，侧边栏可折叠。
- PC 端：左侧侧边栏 + 右侧主工作区，类似 WordPress 管理后台。

## 组件

- 基础组件：Button、Input、Tag、Card。
- 组合组件：SearchBar、FilterBar、ItemCard。
- 模板组件：PageLayout、ListPage、DetailPage。
- 图标：优先使用 Lucide 或 Heroicons 的线性图标。

## 参考素材

设计时可参考 `docs/reference/` 中的界面截图，但实现必须服务于本项目的领域语言和家庭局域网使用场景。
