# 同行旅 V4.0 UI 设计系统重构 — 实施报告

> 2026-07-16

---

## 1. 版本概述

V4.0 是一次**纯视觉重构版本**，不新增业务功能，不修改云函数和数据库。目标是建立统一的设计 Token 体系，消除项目中的样式不一致，减少重复代码。

**核心原则**：零 JS 修改、零业务逻辑变更、零云函数触及。

---

## 2. 改造覆盖

### 2.1 页面覆盖

| 页面 | 分类 | 改造深度 | 主要变更 |
|------|:----:|:--------:|---------|
| `tripWorkspace` | A | 🔴 深 | spinner 移除、segment 统一、卡片阴影、banner、标题 |
| `budget-setting` | A | 🟡 中 | spinner 移除、卡片 padding 统一 |
| `settlement` | A | 🟢 浅 | section-title、loading |
| `members` | A | 🟢 浅 | 卡片 padding、font-size |
| `expenseDetail` | A | 🟡 中 | 金额、卡片圆角、阴影、容器 padding |
| `addExpense` | A | 🟡 中 | 成员选择器提取、重复样式清理 |
| `addTodo` | A | 🟡 中 | 成员选择器提取、重复样式清理 |
| `addItinerary` | A | 🟢 浅 | loading |
| `schedule-map` | A | 🟢 浅 | loading/error/empty |
| `index` | A | — | 无需改动（已对齐） |
| `tripDetail` | C | 🟢 微 | loading |
| `expenses` (旧) | C | 🟢 微 | loading |
| `itinerary` (旧) | C | 🟢 微 | loading |
| `createTrip` | A | — | 无需改动 |
| `joinTrip` | A | — | 无需改动 |

### 2.2 文件变更统计

| 类型 | 文件数 |
|------|:-----:|
| `app.wxss` | 1 |
| 页面 WXML | 10 |
| 页面 WXSS | 8 |
| 新增文档 | 2（DESIGN_TOKENS.md + V4_UI_REVIEW.md） |
| JS 修改 | **0** |
| 云函数修改 | **0** |

---

## 3. 完成项

### 3.1 设计 Token ✅

- 21 个 `--color-*` CSS 自定义属性
- 7 个旧变量别名保持兼容
- 三档边框色、四档文字色、六种语义色
- 统一危险色为 `#E74C3C`（旧 `#E8685A` 退役）

### 3.2 全局基础类 ✅

30+ 个 `ui-` 前缀全局 class：
- 卡片：标准 + 紧凑
- 按钮：主/次/危险/小/禁用
- 输入框、标签、分段切换
- 分割线、排版辅助
- loading spinner、空状态、错误状态、提示横幅
- 成员选择器

### 3.3 重复样式清理 ✅

| 删除项 | 来源 | ~行数 |
|--------|------|:----:|
| `@keyframes spin` 重复 | tripWorkspace, budget-setting | 14 |
| `.loading-spinner` 重复 | tripWorkspace, budget-setting | 16 |
| `.itin-view-tab` + `.todo-filter-item` | tripWorkspace | 27 |
| `.member-*` 系列 | addExpense, addTodo | 51 |
| `.stale-banner` 样式 | tripWorkspace | 6 |
| `.budget-empty` 样式 | tripWorkspace | 3 |
| `.page-loading` | budget-setting | 9 |
| `.loading` + `.error-state` | schedule-map | 6 |
| 其他分散清理 | 各处 | ~70 |
| **合计** | | **~200 行** |

### 3.4 风格统一 ✅

- 卡片内边距：标准 `28rpx 32rpx` / 紧凑 `24rpx 28rpx`
- 卡片圆角：`20rpx`
- 卡片阴影：`0 4rpx 16rpx rgba(26,26,26,0.04)`
- Section 标题：`28rpx / 600`
- 分段切换控件：`28rpx` 圆角
- 金额层级：汇总 `56rpx` / 详情 `64rpx` / 辅助 `40-44rpx`
- 红色：全项目统一 `#E74C3C`
- 成员选择器：单选用圆形、多选用 `8rpx` 方角

---

## 4. 未处理项（有意保留）

| 项目 | 原因 |
|------|------|
| C 类页面深度改造 | 已无有效入站路由，仅做最小必要统一 |
| 旧全局类名替换 | `.card`、`.btn-primary` 等仍在使用，后续版本逐步迁移 |
| 硬编码颜色 → `var()` | 当前颜色值已全部统一到 Token 规范值，`var()` 化是后续优化 |
| 行程和账单独立旧页面 | 保留现状，不在 V4 删除 |
| Emoji 图标 | V4 spec §15 允许现有无问题图标继续保留 |
| 暗色模式 | 不在 V4 范围（spec §4.9） |

---

## 5. 已知问题

（无已知阻塞性问题）

- `#F5F5F5` 分割线颜色与 Token 的 `#F0F0F0` 有微小偏差（2 处，视觉差异极微）
- 部分旧页面（C 类）的 WXSS 未深度清理，但已无有效用户访问
- 按钮禁用态仅在 `ui-btn` 系列定义，旧 `.btn-primary` 等类未同步（需后续迁移）

---

## 6. 疑似废弃页面（C 类）

| 页面 | 判定依据 |
|------|---------|
| `tripDetail` | 零入站导航，V2.0 被 tripWorkspace 取代 |
| `itinerary` | 仅被 tripDetail 引用 |
| `expenses` | 仅被 tripDetail 引用 |
| `settlement` (独立) | 仅被 tripDetail 引用，功能已在 tripWorkspace 内联 |
| `members` (独立) | 仅被 tripDetail 引用，功能已在 tripWorkspace 内联 |

**建议**：V5.0 评估是否从 `app.json` 取消注册并删除。当前保留以兼容可能的深度链接。

---

## 7. 真机测试建议

1. iOS 真机 + Android 真机各完整走一遍核心流程
2. 重点关注：tripWorkspace 四个 tab、预算设置和超预算、结算结果、账单详情金额
3. 小屏设备（iPhone SE 尺寸）检查底部安全区域
4. 检查 `ui-loading-spinner` 动画在真机上的流畅度

---

## 8. 后续版本建议

- **V4.1**：将旧全局类（`.card`、`.btn-primary` 等）替换为 `ui-` 类；清理 WXML 中无用的旧 class 标记
- **V4.2**：图标体系统一（替换 Emoji 为统一风格图标）
- **V4.3**：动效与过渡优化
- **V5.0**：新的大型功能模块
