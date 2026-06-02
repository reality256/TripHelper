# CHANGELOG

## V2.3 - 细节优化

### 修改时间
- 2026-06-02

### 已完成（全 7 阶段）

**阶段 1：文档结构整理**
- 新建 `spec/` 文件夹，移动全部 spec 文档。
- 修正文件名多余空格。
- 创建 `CHANGELOG.md`。

**阶段 2：修复邀请码输入光标**
- 将透明 input 移出可视区域（`left: -9999rpx`），消除闪烁光标。
- 点击展示格自动聚焦隐藏 input。
- 保留自动转大写、粘贴、6 位限制等原有功能。

**阶段 3：账单编辑与删除**
- 新增 `pages/expenseDetail/expenseDetail` 账单详情页。
- 账单列表点击卡片进入详情，而非直接显示编辑/删除按钮。
- 详情页右上角显示"··· 更多"按钮，仅权限用户可见。
- 新增 `getExpenseDetail`、`updateExpense`、`deleteExpense` 三个云函数。
- 账单创建者或旅行创建者可编辑/删除；普通成员不可操作。
- `deleteExpense` 使用软删除（`deleted: true`），不物理删除。
- `getExpenses`、`calculateSettlement` 排除已删除账单。

**阶段 4：账单分类**
- 新增 `utils/expenseCategory.js`：6 种分类（餐饮/交通/住宿/门票/购物/其他）。
- 选择"其他"可填写自定义分类（最长 10 字）。
- 账单列表卡片显示分类标签，详情页显示分类行。
- 编辑模式下回显分类。

**阶段 5：账户金额与类型优化**
- 金额输入实时限制格式：禁止非数字、多小数点、超 2 位小数。
- 云函数正则校验 `^\d+(\.\d{1,2})?$`，金额必须为正数。
- 新增账单类型：支出（expense）和入账（income）。
- 入账 UI 语义：表单标签动态切换（付款人→收款人，参与分摊成员→入账归属成员）。
- 入账显示为 `-¥x.xx`（红色），明确表示减少总花费。
- 总消费 = 支出累加 - 入账扣减，最低为 0。
- 结算逻辑正确处理入账（paid 减少、shouldPay 减少）。

**阶段 6：成员管理与历史账单兼容**
- `leaveTrip` 退出时将 openid 加入 `formerMemberOpenids`。
- 新增 `removeMember` 云函数：创建者可移除普通成员。
- 设置 tab 成员列表中创建者可见"移除"按钮。
- `calculateSettlement` 动态收集所有账单参与者（含已退出成员）。
- 已退出成员的历史账单仍参与结算，昵称兜底显示 `旅友XXXX`。

**阶段 7：待办筛选**
- 待办 tab 顶部增加筛选按钮组：我的 / 全部 / 未完成 / 已完成。
- 默认显示"我的待办"。
- 空状态文案随筛选类型变化。
- 纯前端筛选，无需云函数改动。

### 新增云函数（5 个）
- `getExpenseDetail`、`updateExpense`、`deleteExpense`、`removeMember`
- `dissolveTrip`、`leaveTrip`（V2.2 已建，V2.3 修改）

### 修改云函数（5 个）
- `addExpense`：金额正则校验、type/category 字段
- `updateExpense`：同上 + formerMemberOpenids 兼容
- `getExpenses`：排除软删除账单
- `calculateSettlement`：排除软删除账单 + 入账语义 + 动态参与者收集
- `leaveTrip`：增加 formerMemberOpenids

### 新增页面（1 个）
- `pages/expenseDetail/expenseDetail`

### 新增工具（1 个）
- `utils/expenseCategory.js`

### 数据库变更
- `expenses` 集合：`deleted`、`deletedAt`、`deletedBy`、`type`、`category`、`customCategory` 字段（云函数写入时自动创建，无需手动操作）
- `trips` 集合：`formerMemberOpenids` 字段（leaveTrip/removeMember 写入时自动创建）

### 安全审查
- 所有云函数 openid 均从 `cloud.getWXContext().OPENID` 获取。
- 解散/退出/移除/编辑/删除操作均在云函数中做权限校验。
- 前端按钮显隐仅为 UX，不可绕过云函数权限。
- 无硬编码密钥、无信任前端传入 openid。

---

## V2.2 - 旅行生命周期与账单结算优化

### 已完成
- 新增 `dissolveTrip` 云函数，创建者可解散旅行（软删除）。
- 新增 `leaveTrip` 云函数，普通成员可退出旅行。
- `getMyTrips` 过滤已解散旅行（兼容旧数据无 status 字段）。
- `getTripDetail` 拒绝访问已解散旅行，文案改为"你没有权限查看该旅行"。
- `createTrip` 新建旅行默认 `status: "active"`。
- 设置 tab 增加「旅行管理」区域：创建者看到「解散旅行」、普通成员看到「退出旅行」。
- 解散/退出前均需二次确认，成功后 `reLaunch` 到首页。
- 账单 tab 不再自动调用 `calculateSettlement`。
- 增加「计算结算」按钮，用户点击后才计算。
- 账单为空时，「计算结算」按钮被禁用或提示。
- 「添加账单」按钮移至账单 tab 顶部操作区。
- 新增账单或返回账单 tab 后，已有结算结果标记为 stale（黄色横幅提示）。
- 修复 `cloud://` 头像在 `<image>` 中无法直接渲染的问题（使用 `getTempFileURL` 转换）。

### 主要新增云函数
- `dissolveTrip`
- `leaveTrip`

### 主要修改云函数
- `createTrip`（增加 `status` 字段）
- `getMyTrips`（过滤已解散旅行）
- `getTripDetail`（拒绝已解散旅行访问）

### 数据库变更
- `trips` 集合增加 `status`、`dissolvedAt`、`dissolvedBy` 字段。旧数据无 `status` 视为 `active`。

### 注意事项
- 需要部署 `createTrip`、`getMyTrips`、`getTripDetail`、`dissolveTrip`、`leaveTrip` 五个云函数。
- 无需手动修改数据库，字段由云函数写入时自动创建。

---

## V2.1 - 体验优化

### 已完成
- 邀请码输入改为 6 格验证码样式，小写自动转大写，支持粘贴。
- `joinTrip` 云函数邀请码查询前统一转大写。
- `createTrip` 云函数生成的邀请码统一大写。
- 添加行程时校验结束时间不能早于开始时间（前端 + `addItinerary` 云函数双重校验）。
- 冷启动时各 tab 增加 loading / error / loaded 状态，数据未返回前不显示空状态。
- loading 失败时显示重试按钮。
- 新用户默认昵称从「微信用户」改为「旅友 + 编号」。
- 新增 `updateUserProfile` 云函数，支持设置昵称和头像。
- 初次进入 `tripWorkspace` 时自动弹出资料设置弹窗。
- 设置 tab 增加「个人资料」入口，可修改昵称和头像。
- 成员列表支持显示真实头像（云存储 fileID → 临时 URL）。
- 设置 tab 移除「创建新旅行」「加入其他旅行」按钮（统一走首页入口）。

### 主要新增云函数
- `updateUserProfile`

### 主要修改云函数
- `login`（默认昵称逻辑、`profileCompleted` 字段）
- `joinTrip`（邀请码转大写）
- `createTrip`（邀请码统一大写）
- `addItinerary`（结束时间校验）

### 主要修改页面
- `pages/joinTrip/joinTrip`（6 格邀请码输入）
- `pages/addItinerary/addItinerary`（时间校验）
- `pages/tripWorkspace/tripWorkspace`（loading 状态、资料编辑弹窗、设置页优化）

### 新增工具/服务
- `utils/date.js` 新增 `compareTime`、`isEndTimeBeforeStartTime`
- `utils/user.js` 新增 `getDisplayName`、`getDisplayAvatar`
- `services/userService.js` 新增 `updateUserProfile`

### 数据库变更
- `users` 集合增加 `profileCompleted` 字段。旧数据无此字段视为 `false`。

### 注意事项
- 需要上传 `login`、`joinTrip`、`createTrip`、`addItinerary`、`updateUserProfile` 云函数。
- 云存储需开通 `avatars/` 目录用于存放头像。

---

## V2.0 - 旅行工作台与底部菜单

### 已完成
- 启动逻辑优化：有旅行时自动进入最近旅行，无旅行时留首页。
- 新增 `tripWorkspace` 页面作为旅行内主页面。
- 底部菜单四个 tab：行程、账单、待办、设置。
- 行程 tab 集成：按日期分组展示、管理行程（添加/删除）。
- 账单 tab 集成：账单列表、总金额、结算结果、添加账单入口。
- 待办模块：添加待办、指定负责人、标记完成/取消、删除待办。
- 设置 tab：成员列表、邀请码复制、旅行切换。
- 新增 `deleteItinerary` 云函数支持删除行程。

### 主要新增页面
- `pages/tripWorkspace/tripWorkspace`
- `pages/addTodo/addTodo`

### 主要新增云函数
- `addTodo`
- `getTodos`
- `updateTodoStatus`
- `deleteTodo`
- `deleteItinerary`

### 新增集合
- `todos`

### 新增服务
- `services/todoService.js`
- `services/itineraryService.js`（新增 `deleteItinerary`）

---

## V1.0 - MVP 核心闭环

### 已完成
- 微信小程序项目初始化，接入微信云开发。
- 用户登录和 openid 获取（login 云函数，users 集合）。
- 创建旅行（createTrip 云函数，trips 集合，生成邀请码）。
- 通过邀请码加入旅行（joinTrip 云函数）。
- 首页展示我的旅行列表（getMyTrips 云函数）。
- 旅行详情展示（getTripDetail 云函数，含成员、账单概览、行程概览）。
- 行程添加与展示（addItinerary、getItinerary 云函数，itinerary 集合）。
- 账单添加与展示（addExpense、getExpenses 云函数，expenses 集合）。
- AA 结算计算（calculateSettlement 云函数，贪心转账方案）。

### 主要云函数（10 个）
- `login`、`createTrip`、`joinTrip`、`getMyTrips`、`getTripDetail`
- `addExpense`、`getExpenses`、`addItinerary`、`getItinerary`、`calculateSettlement`

### 数据库集合（4 个）
- `users`、`trips`、`expenses`、`itinerary`

### 页面（10 个）
- `pages/index/index`（首页）
- `pages/createTrip/createTrip`（创建旅行）
- `pages/joinTrip/joinTrip`（加入旅行）
- `pages/tripDetail/tripDetail`（旅行详情）
- `pages/itinerary/itinerary`（行程列表）
- `pages/addItinerary/addItinerary`（添加行程）
- `pages/expenses/expenses`（账单列表）
- `pages/addExpense/addExpense`（添加账单）
- `pages/settlement/settlement`（结算页）
- `pages/members/members`（成员页）

### 服务层
- `services/cloudService.js`
- `services/userService.js`
- `services/tripService.js`
- `services/expenseService.js`
- `services/itineraryService.js`
- `services/settlementService.js`

### 工具函数
- `utils/format.js`
- `utils/money.js`
- `utils/date.js`
