# 同行旅 设计 Token 规范

> V4.0 建立。后续所有页面样式的唯一依据。
> 对应 `app.wxss` 中 `page {}` 内 CSS 自定义属性定义。

---

## 1. 颜色

### 1.1 品牌色

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-primary` | `#2A9D8F` | 主按钮、链接、金额、进度条、选中态 |
| `--color-primary-pressed` | `#23877B` | 按压态（预留） |
| `--color-primary-light` | `#E8F5F3` | 选中背景、编号圆圈、teal 浅底色 |

### 1.2 背景色

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-bg-page` | `#F5F7F6` | 全局页面底色 |
| `--color-bg-card` | `#FFFFFF` | 卡片、列表项底色 |
| `--color-bg-disabled` | `#F2F3F3` | 禁用态按钮背景 |

### 1.3 文字色

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-text-primary` | `#1A1A1A` | 主标题、卡片标题、核心文字 |
| `--color-text-secondary` | `#666666` | 辅助信息、section 副标题 |
| `--color-text-tertiary` | `#999999` | 提示文字、placeholder、meta 信息 |
| `--color-text-disabled` | `#B8B8B8` | 禁用态文字、极弱提示 |

### 1.4 边框色（三档）

| Token | 值 | 场景 |
|-------|-----|------|
| `--color-border-light` | `#F0F0F0` | 卡片内部弱分隔、页面顶部分割 |
| `--color-border-default` | `#E8E8E8` | 输入框、切换控件、普通边框 |
| `--color-border-strong` | `#D0D0D0` | 复选框、虚线区域、强调边界 |

### 1.5 语义色

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-danger` | `#E74C3C` | 删除、超预算、负向金额、错误、不可逆操作 |
| `--color-danger-light` | `#FDEDEC` | 危险操作浅底色 |
| `--color-success` | `#27AE60` | 入账类型标识、已完成标记 |
| `--color-success-light` | `#EAF7EF` | 成功状态浅底色 |
| `--color-warning` | `#E67E22` | 进行中/即将开始状态、冲突提示 |
| `--color-warning-light` | `#FFF4E8` | 警告浅底色 |

### 1.6 业务语义色

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-income` | `#E74C3C` | 入账金额展示。当前值与 danger 相同，但语义独立，后续可单独调整 |
| `--color-stale-bg` | `#FFF8E1` | 结算过期提示背景 |
| `--color-stale-text` | `#B8860B` | 结算过期提示文字 |

### 1.7 旧变量别名

以下别名保留用于向后兼容，已映射到新 Token。后续版本逐步移除页面中的旧变量引用。

| 旧变量 | 映射 |
|--------|------|
| `--primary` | `var(--color-primary)` |
| `--danger` | `var(--color-danger)` |
| `--text` | `var(--color-text-primary)` |
| `--text-secondary` | `var(--color-text-secondary)` |
| `--text-hint` | `var(--color-text-tertiary)` |
| `--bg` | `var(--color-bg-page)` |
| `--border` | `var(--color-border-light)` |

---

## 2. 圆角

| 类型 | 圆角值 | 对应 class |
|------|--------|-----------|
| 标准卡片 | `20rpx` | `.ui-card` |
| 输入框 | `14rpx` | `.ui-input`、`.form-input` |
| 提示横幅 | `12rpx` | `.ui-banner` |
| 小型标签 | `6rpx` | `.ui-tag` |
| 分段切换控件 | `28rpx` | `.ui-segment-item` |
| 主按钮（pill） | `48rpx` | `.ui-btn--primary`、`.ui-btn--secondary` |
| 危险/小按钮 | `14rpx` | `.ui-btn--danger`、`.ui-btn--sm` |
| 单选（圆形） | `50%` | 成员单选、待办勾选 |
| 多选（圆角方） | `8rpx` | 成员多选复选框 |
| 进度条 | `4rpx` | 预算进度条 |
| 弹层 | `24rpx` | 资料编辑弹窗 |

**规则**：
- 卡片统一为 `20rpx`。横幅、输入框、标签不是卡片，不强制使用 `20rpx`。
- 分段切换控件统一为 `28rpx`（行程视图切换和待办筛选同一标准）。
- 单选用圆形、多选用 `8rpx` 圆角方形。

---

## 3. 字号层级

| 层级 | 字号 | 建议字重 | 场景 |
|------|------|---------|------|
| 页面主标题 | `40rpx` | 600 | tripDetail 旅行名等 |
| 核心汇总金额 | `56rpx` | 700 | 预算总额、账单列表总金额 |
| 详情页主金额 | `64rpx` | 700 | expenseDetail 大金额 |
| 辅助金额 | `40rpx`–`44rpx` | 600 | 当前花费、预算参考 |
| 重要卡片标题 | `32rpx` | 600 | 首页旅行名 |
| Section 标题 | `28rpx` | 600 | 各区域小标题 |
| 正文/卡片标题 | `28rpx` | 400–500 | 行程标题、账单标题、待办标题 |
| 次级标题 | `26rpx` | 500 | 日期分组标题 |
| 辅助文字 | `24rpx` | 400 | meta 信息、时间、地点 |
| 标签/说明 | `22rpx` | 400 | 分类标签、备注、冲突提示 |
| 极小 | `20rpx` | 400 | 状态徽标、分类标签 |

**金额层级规则**：
- 汇总卡片（预算总览、账单总金额）：`56rpx`
- 详情页唯一主金额（expenseDetail）：`64rpx`
- 辅助金额数据（当前花费、人均）：`40rpx`–`44rpx`

---

## 4. 间距

尽量采用 4rpx 的整数倍。

| 场景 | 值 |
|------|-----|
| 页面水平边距 | `32rpx` |
| 页面顶部间距 | `32rpx` |
| 表单页顶部间距 | `40rpx` |
| 页面主要区块间距 | `32rpx` |
| 卡片间距 | `20rpx` |
| 卡片内部元素间距 | `16rpx`–`20rpx` |
| 标准卡片内边距 | `28rpx 32rpx` |
| 紧凑列表卡片内边距 | `24rpx 28rpx` |
| 小型标签内边距 | `2rpx 10rpx` |

---

## 5. 控件高度

| 控件 | 高度 |
|------|------|
| 主按钮 | `96rpx` |
| 次按钮 | `96rpx` |
| 危险按钮 | `88rpx` |
| 小按钮 | `72rpx` |
| 输入框 | `88rpx` |
| 分段切换 | `64rpx`（含 padding） |
| 最小点击区域 | `88rpx` |

---

## 6. 阴影

标准卡片：

```css
box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.04);
```

规则：
- 普通列表卡片使用上述极轻阴影。
- 同一页面不允许出现多种卡片阴影。
- 弹层可使用更明显阴影，但需独立定义。
- 不使用大面积彩色阴影。

---

## 7. 动效时长

| 类型 | 时长 |
|------|------|
| 按压反馈 | `100ms–150ms` |
| 状态切换 | `160ms–200ms` |
| 弹层进出 | `200ms–240ms` |
| 进度条变化 | `200ms–300ms` |
| spinner 动画 | `0.8s` 一圈 |

---

## 8. 页面例外

以下页面/区域因布局特殊性，允许不完全遵循上述规范：

| 页面/区域 | 例外内容 | 原因 |
|----------|---------|------|
| `index` 头部 | 品牌名 `56rpx`、居中布局 | 首页品牌展示个性 |
| `tripDetail` 头部 | 旅行名 `40rpx`、独立间距 | 信息密度需要 |
| `schedule-map` 地图区 | 地图高度 `600rpx` 硬编码 | 地图组件需要固定高度 |
| `tripWorkspace` 底部导航 | 自定义 tabBar 样式 | 非标准卡片/按钮体系 |
| 资料编辑弹窗 | `24rpx` 圆角、`580rpx` 宽 | 弹层独立规范 |

所有例外必须在本文档中登记，不得随意新增。

---

## 9. 全局 class 速查

### 卡片

```html
<view class="ui-card">标准卡片</view>
<view class="ui-card ui-card--compact">紧凑列表卡片</view>
```

### 按钮

```html
<button class="ui-btn ui-btn--primary">主操作</button>
<button class="ui-btn ui-btn--secondary">次要操作</button>
<button class="ui-btn ui-btn--danger">危险操作</button>
<button class="ui-btn ui-btn--sm">小按钮</button>
<button class="ui-btn ui-btn--disabled" disabled>禁用</button>
```

### 输入框

```html
<input class="ui-input" placeholder="请输入" />
```

### 排版

```html
<view class="ui-section-title">区域标题</view>
<text class="ui-text-secondary">辅助文字</text>
<text class="ui-text-tertiary">说明文字</text>
```

### 分割线

```html
<view class="ui-divider-light"></view>  <!-- 卡片内部 -->
<view class="ui-divider"></view>         <!-- 区块之间 -->
```

### 标签

```html
<text class="ui-tag ui-tag--primary">进行中</text>
<text class="ui-tag ui-tag--warning">冲突</text>
<text class="ui-tag ui-tag--danger">超预算</text>
<text class="ui-tag ui-tag--default">已结束</text>
```

### 分段切换

```html
<view class="ui-segment">
  <view class="ui-segment-item active">列表</view>
  <view class="ui-segment-item">时间线</view>
</view>
```

### 状态

```html
<!-- Loading -->
<view class="ui-loading">
  <view class="ui-loading-spinner"></view>
  <text>正在加载...</text>
</view>

<!-- 空状态 -->
<view class="ui-empty">
  <view class="ui-empty-icon">📋</view>
  <view class="ui-empty-text">暂无数据</view>
  <view class="ui-empty-desc">点击下方按钮添加</view>
</view>

<!-- 错误 -->
<view class="ui-error">
  <view class="ui-error-icon">⚠️</view>
  <view class="ui-error-text">加载失败</view>
  <button class="ui-btn ui-btn--sm">重试</button>
</view>

<!-- 横幅 -->
<view class="ui-banner ui-banner--warning">结算结果可能已过期</view>
<view class="ui-banner ui-banner--danger">已超预算 ¥320</view>
```

---

## 10. 使用原则

1. **新代码必须使用 `ui-` 前缀 class**，旧 class（`.card`、`.btn-primary` 等）仅用于未迁移页面的兼容。
2. **颜色优先使用 CSS 变量**，禁止新增硬编码颜色值。必须硬编码时需在代码注释中说明原因。
3. **间距使用 4rpx 整数倍**，非特殊布局不随意使用奇数值。
4. **卡片只有标准和紧凑两档**，不得新增第三档内边距。
5. **分割线只用三档**（light/default/strong），不得新增近似灰色。
6. **页面例外必须先登记**再实现。
