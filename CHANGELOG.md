# CHANGELOG

## V3.2 - 头像、账单计算与权限修复（2026-07-15）

### 头像系统修复
- **根因**：`saveProfile` 将 `getTempFileURL` 生成的临时 HTTPS URL 写入了数据库，签名过期后全部页面报 403
- 增加 `hasNewAvatar` 标记追踪用户是否选择了新头像，未选新头像时回退到数据库中的 `cloud://` fileID
- 上传判定改为反向检测：不是 `cloud://` 且不是过期 temp URL → 即本地路径需上传，兼容不同 `chooseAvatar` 返回格式
- `loadTrip` / `members` 页面：`cloud://` fileID 批量转 temp URL 后标记 `fromFileMap`，避免新鲜 temp URL 被误判为过期
- 全部头像 `<image>` 标签增加 `binderror` 降级处理
- `utils/user.js` 新增 `isCloudFileID()` / `isCloudTempUrl()`，删除零调用的 `getDisplayAvatar` / `batchConvertAvatars` / `resolveAvatarUrl`
- `app.json` 补充 `permission.scope.userLocation` 声明（行程选址 `wx.chooseLocation` 必需）

### 金额计算口径统一
- `getExpenses` 云函数 `totalAmount` 修复：改为 `支出总额 - 入账总额`，与前端 `calculateTotalExpense` 一致
- `getTripDetail` 云函数 `expenseSummary.totalAmount` 同样修复，并增加排除已删除账单
- 全项目统一：`expense` 计入、`income` 扣减、已删除跳过

### 死代码清理
- 删除 `utils/money.js`（全项目零引用）
- `budget.js` 删除 `refund` 类型遗留分支，正式类型仅 `expense` / `income`

### 结算防御性校验
- `calculateSettlement` 云函数增加空参与人账单检测：发现异常账单时返回明确错误 + 异常账单 ID 列表，不再静默跳过

### 本次修改文件
- `miniprogram/app.json`
- `miniprogram/utils/user.js`
- `miniprogram/utils/budget.js`
- `miniprogram/utils/money.js`（删除）
- `miniprogram/pages/tripWorkspace/tripWorkspace.js`
- `miniprogram/pages/tripWorkspace/tripWorkspace.wxml`
- `miniprogram/pages/members/members.js`
- `miniprogram/pages/members/members.wxml`
- `cloudfunctions/getExpenses/index.js`
- `cloudfunctions/getTripDetail/index.js`
- `cloudfunctions/calculateSettlement/index.js`

### 需要重新部署的云函数
- `getExpenses`、`getTripDetail`、`calculateSettlement`

---

## V3.0 - 地图行程与预算管理升级（开发中）

### 修改时间
- 2026-06-02

### 已完成

**数据结构与工具函数**
- 新增 `utils/schedule.js`：行程分组、排序、日序号、状态判断（upcoming/ongoing/ended）、冲突检测、旧数据兼容
- 新增 `utils/budget.js`：净消费计算、分类花费统计、预算总览、人均消耗
- 新增 `utils/map.js`：地点归一化、marker/polyline 构建、Haversine 直线距离、驾车时间估算

**地图选址接入**
- `addItinerary` 云函数支持 locationName/locationAddress/latitude/longitude 字段
- `addItinerary` 页面接入 `wx.chooseLocation()`，点击选择地图地点，自动回填名称/地址/经纬度
- 已选地点显示绿色卡片，支持清除重选
- 旧数据兼容：无经纬度行程正常展示

**行程展示升级**
- 每日行程序号（①②③），按 startTime 排序
- 卡片布局优化：序号+标题左、时间右
- 状态感知：进行中蓝色左边框高亮、已结束 55% 透明变灰
- 冲突检测：同天时间重叠自动提示 ⚠ 冲突项名称
- 列表/时间线双视图切换，时间线带圆点竖线和状态色

**地图全览**
- 新增 `pages/schedule-map/schedule-map` 页面
- 日期下拉切换，marker 带编号常驻气泡，绿色带箭头 polyline 路线
- 接入腾讯地图 WebService API（`getRouteDistance` 云函数）计算真实驾车距离和耗时
- 路线摘要栏：地点数、距离、预计耗时

**预算管理（前端工具已就绪，UI 待开发）**
- `utils/budget.js` 完整预算计算逻辑

### 本次新增云函数
- `getRouteDistance`：调用腾讯地图 API 计算驾车路线

### 本次修改云函数
- `addItinerary`：新增地图选址字段

### 本次新增页面
- `pages/schedule-map/schedule-map`

### 本次新增工具函数
- `utils/schedule.js`
- `utils/budget.js`
- `utils/map.js`

### 需要部署的云函数
- `addItinerary`、`getRouteDistance`

### 未尽事宜（后续继续）
- 分类预算展示与超预算提醒（产品需求商议中）

### V3.0 预算联动修复（2026-06-03）

**修复问题**
- 预算设置页新增"当前总花费"展示，直接复用 `utils/budget.js` 的 `calculateNetExpense`，确保与账单页总消费完全一致
- 修复账单页返回后仍显示"暂未设置预算"：`tripWorkspace.onShow` 现在先刷新 trip 数据再加载账单
- 修复清除预算只在本地清空、未写库：清除时调用云函数，数据库 `budget` 字段设为 `null`
- 统一 `hasBudget` 判断：全项目使用 `budget && budget.totalBudget && Number(budget.totalBudget) > 0`
- `updateTripBudget` 云函数支持清除模式（`totalBudget=0` → `budget: null`）

**本次修改文件**
- `cloudfunctions/updateTripBudget/index.js`：支持清除预算
- `pages/budget-setting/budget-setting.js`：加载账单数据、显示总花费、真正清除
- `pages/budget-setting/budget-setting.wxml`：新增总花费卡片
- `pages/budget-setting/budget-setting.wxss`：新增样式
- `pages/tripWorkspace/tripWorkspace.js`：onShow 刷新 trip 数据
- `utils/budget.js`：显式化 hasBudget 判空

**需要重新部署的云函数**
- `updateTripBudget`

### V3.0 预算模块精简（2026-06-03）

**预算卡片优化**
- 未设置预算时，预算卡片移至账单页底部（不再干扰账单浏览）
- 已设置预算时，卡片保持靠上位置作为重要状态信息
- 预算卡片删除"人均已花费""旅行入账"等冗余展示，简化为：当前已花费/预算、进度条、使用率、剩余预算/超预算提醒
- `calculateBudgetSummary` 移除 `perPerson`、`incomeTotal` 返回值，新增 `remainingBudget`

**金额校验统一**
- 新增 `utils/amount.js`：`formatAmountInput()` 实时格式化、`validateAmount()` 提交校验
- 账单金额（`addExpense.js`）和预算金额（`budget-setting.js`）统一使用同一校验函数

**代码清理**
- 删除 `tripWorkspace.wxss` 中废弃样式
- 删除 WXML 中入账说明等被移除区块

**本次修改文件**
- `utils/amount.js`（新增）、`utils/budget.js`
- `pages/tripWorkspace/tripWorkspace.wxml`、`pages/tripWorkspace/tripWorkspace.wxss`
- `pages/budget-setting/budget-setting.js`、`pages/addExpense/addExpense.js`

### V3.1 预算体验修正（2026-06-03）

**阶段一：未设置预算时优化展示**
- 未设预算时隐藏预算卡片中的"当前总花费"（不展示金额统计）
- 加入者端完全不可见预算 UI（不显示设置入口、不显示暂未设置预算）
- 仅创建者在未设预算时可见底部「暂未设置预算 [设置预算]」

**阶段二：消除已设预算后的重复统计**
- 已设预算时，预算卡片承载金额信息，下方账单统计区去除「总消费 ¥X」
- 账单统计区改为轻量「账单概览」：共 X 笔账单 + 最近更新时间
- 未设预算时保持原有「总消费 ¥X · X 笔」

**阶段三：修复加入者端预算刷新时机**
- `switchTab` 切换到账单 tab 时改为 `refreshTripThenReloadExpenses()`
- 每次进入账单页都先刷新 trip 数据（含 budget）再加载账单
- 加入者切 tab 即可看到预算变化，不再依赖点击「添加账单」

**预算卡片 UI 强化**
- 重构预算卡片布局：标题「旅行预算」+ 「设置」按钮
- 双列金额对比：左侧 48rpx 大字「已花费」+ 右侧 34rpx「总预算」
- 进度条 + 居中进度说明：「剩余 ¥X · 已使用 X%」
- 超预算时已花费金额和进度条变红，提示「已超出 ¥X」

**本次修改文件**
- `pages/tripWorkspace/tripWorkspace.wxml`：预算卡片重构、统计区条件渲染、权限条件
- `pages/tripWorkspace/tripWorkspace.wxss`：预算卡片样式重写
- `pages/tripWorkspace/tripWorkspace.js`：switchTab 刷新链路修正

---

### 修改时间
- 2026-06-03

### 已完成

**预算管理系统**
- 新增 `updateTripBudget` 云函数：仅旅行创建者可设置/更新总预算，含完整权限校验和金额格式校验
- 新增 `pages/budget-setting/budget-setting` 预算设置页面：支持设置总预算，显示人均预算参考，非创建者只读
- 账单 tab 顶部新增预算总览卡片：展示总花费/预算、使用率进度条、人均已花费、超预算警告
- 预算权限控制：前端仅创建者可见「设置」入口，云函数二次校验
- `getTripDetail` 返回 trip 对象中包含 `budget` 字段（云函数写入时自动创建，无需手动操作）

**时间线视图点击跳转**
- 行程列表视图和时间线视图均支持点击行程项跳转编辑
- 新增 `updateItinerary` 云函数：行程创建者或旅行创建者可编辑行程
- `addItinerary` 页面支持编辑模式：加载已有数据、回填表单（含地图地点）、提交时调用更新
- `services/itineraryService.js` 新增 `updateItinerary`

**地图 marker 优化**
- `buildMapMarkers` 升级：使用圆形编号标签（`label`）替代文字气泡，支持状态着色（进行中橙色/已结束灰色/默认绿色）
- label 样式：白色数字 + 彩色圆形背景，常驻显示
- callout 改为点击显示（`BYCLICK`），展示行程标题
- `schedule-map` 页面同日 marker 加入状态映射

### 本次新增云函数
- `updateTripBudget`：设置/更新旅行总预算
- `updateItinerary`：编辑已有行程

### 本次新增页面
- `pages/budget-setting/budget-setting`

### 本次修改云函数
- `addItinerary`：新增地图选址字段（上期）

### 本次修改页面
- `pages/tripWorkspace/tripWorkspace`：预算总览卡片、行程点击跳转编辑
- `pages/addItinerary/addItinerary`：支持编辑模式
- `pages/schedule-map/schedule-map`：marker 状态着色

### 本次修改工具函数
- `utils/map.js`：`buildMapMarkers` 改用 label + BYCLICK callout

### 本次修改服务层
- `services/tripService.js`：新增 `updateTripBudget`
- `services/itineraryService.js`：新增 `updateItinerary`

### 需要部署的云函数
- `updateTripBudget`、`updateItinerary`

### 数据库说明
- `trips` 集合新增 `budget` 字段（云函数写入时自动创建，无需手动操作）

---

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
