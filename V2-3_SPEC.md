# V2.3_SPEC.md

# 同行旅 V2.3 需求文档

## 1. 文档目的

本文档用于指导 Claude Code 在 V2.2 完成后继续开发 V2.3。

V2.3 的目标不是重建项目，而是在现有版本基础上继续补齐真实使用中必须具备的细节能力，包括：

1. 项目文档结构整理。
2. CHANGELOG 版本记录。
3. 邀请码输入光标问题修复。
4. 账单编辑和删除。
5. 账单分类。
6. 成员退出后的历史账单结算兼容。
7. 创建者移除成员。
8. 待办筛选。

Claude Code 开发前必须先阅读当前项目中的所有需求文档，包括但不限于：

```text
PROJECT_SPEC.md
CLOUD_DEV_GUIDE.md
V2_SPEC.md
V2-1_SPEC.md
V2-2SPEC.md
V2.3_SPEC.md
```

------

## 2. 总体要求

### 2.1 禁止事项

本次 V2.3 开发禁止：

1. 重建整个项目。
2. 删除已有 V1、V2、V2.1、V2.2 核心功能。
3. 大规模重构无关代码。
4. 引入新技术栈。
5. 使用 uni-app、Taro、Vue、React、TypeScript。
6. 使用自建服务器。
7. 在前端写入 appSecret、SecretId、SecretKey。
8. 信任前端传入的 openid。
9. 绕过云函数权限校验。
10. 在没有确认当前项目结构前直接覆盖文件。

### 2.2 技术要求

继续使用：

```text
微信小程序原生开发
微信云开发
云函数
云数据库
JavaScript
WXML
WXSS
JSON
```

### 2.3 开发原则

1. 每次只完成一个阶段。
2. 修改代码前必须说明本阶段目标和拟修改文件。
3. 修改代码后必须更新 `CHANGELOG.md`。
4. 所有涉及 `tripId` 的云函数必须校验当前用户是否属于该旅行。
5. 所有涉及用户身份的逻辑必须使用 `cloud.getWXContext().OPENID`。
6. 不要信任前端传入的 openid。
7. 危险操作必须有二次确认。
8. 保持与已有数据兼容，不要破坏旧数据。

------

# 3. 阶段 1：重构文档结构与 CHANGELOG

## 3.1 当前问题

当前项目中的需求文档散落在项目根目录，后续版本越来越多后会难以管理。

已有文档可能包括：

```text
PROJECT_SPEC.md
CLOUD_DEV_GUIDE.md
V2_SPEC.md
V2_OPTIMIZATION_SPEC.md
V2.2_DETAIL_OPTIMIZATION_SPEC.md
V2.3_SPEC.md
```

需要统一整理。

------

## 3.2 目标

新增：

```text
/spec
```

文件夹，并把所有需求文档和规范文档移动到该文件夹中。

目标结构：

```text
/spec
  PROJECT_SPEC.md
  CLOUD_DEV_GUIDE.md
  V2_SPEC.md
  V2_OPTIMIZATION_SPEC.md
  V2.2_DETAIL_OPTIMIZATION_SPEC.md
  V2.3_SPEC.md

CHANGELOG.md
README.md
```

说明：

1. `spec/` 用于保存需求文档、开发规范、版本说明文档。
2. `CHANGELOG.md` 保留在项目根目录。
3. `README.md` 保留在项目根目录。
4. 后续所有新需求文档都应放入 `spec/`。

------

## 3.3 CHANGELOG.md 要求

如果项目根目录还没有 `CHANGELOG.md`，需要创建。

如果已经存在，则在原文件基础上追加，不要删除旧内容。

`CHANGELOG.md` 需要记录：

1. 每个版本做了什么。
2. 每次 Claude Code 修改了什么文件。
3. 每次新增了什么云函数。
4. 每次修改了什么数据库结构。
5. 每次是否需要用户手动上传云函数。
6. 每次是否需要用户手动创建数据库集合或字段。

------

## 3.4 第一次创建 CHANGELOG.md 时的初始内容

第一次创建 `CHANGELOG.md` 时，需要补全前几次版本记录。

可以按照以下结构整理：

```md
# CHANGELOG

## V1.0 - MVP 核心闭环

### 已完成
- 初始化微信小程序项目结构。
- 接入微信云开发。
- 实现用户登录和 openid 获取。
- 实现创建旅行。
- 实现通过邀请码加入旅行。
- 实现旅行详情展示。
- 实现行程添加和展示。
- 实现账单添加和展示。
- 实现 AA 结算计算。
- 实现基础成员展示。

### 主要云函数
- login
- createTrip
- joinTrip
- getMyTrips
- getTripDetail
- addExpense
- getExpenses
- addItinerary
- getItinerary
- calculateSettlement

---

## V2.0 - 旅行工作台与底部菜单

### 已完成
- 优化启动逻辑：已有旅行时自动进入最近旅行。
- 新增 tripWorkspace 页面作为旅行内主页面。
- 在 tripWorkspace 内实现底部菜单切换。
- 底部菜单包含：行程、账单、待办、设置。
- 行程、账单、待办、设置在同一旅行工作台内展示。
- 账单页面集成结算展示。
- 新增待办事项模块。
- 新增设置模块，展示成员、邀请码、旅行切换等内容。

### 主要新增内容
- pages/tripWorkspace/tripWorkspace
- pages/addTodo/addTodo
- services/todoService.js
- todos 集合
- addTodo
- getTodos
- updateTodoStatus
- deleteTodo

---

## V2.1 - 体验优化

### 已完成
- 优化邀请码输入体验。
- 邀请码输入改为 6 格验证码样式。
- 邀请码输入自动转大写。
- 支持粘贴邀请码。
- 增加行程结束时间不能早于开始时间的校验。
- 优化冷启动加载状态。
- 行程、账单、待办在数据未返回前显示 loading，不误显示空状态。
- 优化用户昵称和头像设置。
- 新用户不再统一显示为“微信用户”。
- 设置页增加修改昵称和头像入口。

### 主要新增或修改内容
- updateUserProfile 云函数。
- login 云函数默认昵称逻辑优化。
- joinTrip 页面邀请码输入优化。
- addItinerary 时间校验。
- tripWorkspace loading 状态优化。

---

## V2.2 - 旅行生命周期与账单结算优化

### 已完成
- 增加创建者解散旅行功能。
- 增加普通成员退出旅行功能。
- 已解散旅行不再出现在旅行列表。
- 退出旅行后当前用户不再看到该旅行。
- 进入账单 tab 时不再自动计算结算。
- 增加“计算结算”按钮，用户点击后才计算。
- 优化账单 tab 加载速度。
- 将“添加账单”按钮移动到账单 tab 顶部。

### 主要新增或修改内容
- dissolveTrip 云函数。
- leaveTrip 云函数。
- getMyTrips 过滤已解散旅行。
- getTripDetail 拒绝访问已解散旅行。
- createTrip 默认增加 status: active。
- tripWorkspace 账单 tab 手动结算逻辑。
```

------

## 3.5 后续每次修改 CHANGELOG 的格式

Claude Code 每完成一个阶段，都必须追加：

```md
## V2.3 - 阶段名称

### 修改时间
- YYYY-MM-DD

### 本次目标
- ...

### 修改文件
- ...

### 新增文件
- ...

### 新增云函数
- ...

### 修改云函数
- ...

### 数据库变更
- ...

### 测试方式
- ...

### 注意事项
- ...
```

如果当前无法准确知道日期，可以使用：

```text
待填写
```

但不能完全不写。

------

# 4. 阶段 2：修复邀请码输入光标闪烁问题

## 4.1 当前问题

加入旅行页面已经将邀请码 input 做成透明输入框，但用户仍能看到输入光标，即竖条在页面上闪烁。

这会影响视觉效果。

当前表现：

```text
input 透明了，但光标还在闪烁
```

目标是：

```text
保留输入能力，但不要看到光标竖条
```

------

## 4.2 适用页面

主要修改：

```text
pages/joinTrip/joinTrip
```

可能涉及：

```text
pages/joinTrip/joinTrip.wxml
pages/joinTrip/joinTrip.wxss
pages/joinTrip/joinTrip.js
```

------

## 4.3 修复要求

要求：

1. 六格邀请码样式保持不变。
2. 用户仍然可以点击输入区域后输入邀请码。
3. 用户仍然可以粘贴完整邀请码。
4. 用户仍然可以删除和重新输入。
5. 页面上不应该看到 input 光标竖条闪烁。
6. 不要破坏小写自动转大写逻辑。
7. 不要破坏只允许字母和数字的逻辑。
8. 不要破坏邀请码长度限制。

------

## 4.4 推荐实现方式

可以采用以下方式之一。

### 方式 A：隐藏 input 到不可见区域

将真实 input 放到视觉区域外：

```css
.hidden-code-input {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
}
```

点击六格展示区域时，主动 focus 到隐藏 input。

要求：

1. 用户点击任意 code box 时聚焦隐藏 input。
2. 输入值仍由隐藏 input 接收。
3. 展示层仍用 6 个 box 显示字符。

### 方式 B：使用极小尺寸透明 input

```css
.hidden-code-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  color: transparent;
  caret-color: transparent;
}
```

注意：微信小程序 WXSS 对 `caret-color` 的支持可能有限，如果不稳定，优先使用方式 A。

------

## 4.5 测试场景

测试 1：点击输入区域

```text
步骤：点击 6 格邀请码输入区域
预期：可以输入，但看不到竖条光标
```

测试 2：输入小写

```text
输入：abc123
预期：显示 ABC123，且没有可见光标
```

测试 3：粘贴邀请码

```text
粘贴：ab 12 cd
预期：显示 AB12CD，且没有可见光标
```

测试 4：删除输入

```text
步骤：输入 6 位后删除
预期：字符正常减少，没有可见光标
```

------

# 5. 阶段 3：账单编辑与删除

## 5.1 当前问题

当前账单功能主要支持添加和展示，但真实使用中经常需要修改或删除账单。

例如：

```text
金额输错
付款人选错
分摊成员选错
备注写错
重复添加
分类选错
```

因此 V2.3 需要增加账单编辑和删除。

------

## 5.2 权限规则

账单编辑和删除必须严格遵守以下规则：

### 5.2.1 账单创建者

如果：

```js
expense.createdBy === currentOpenid
```

则该用户可以：

```text
编辑自己创建的账单
删除自己创建的账单
```

### 5.2.2 旅行创建者

如果：

```js
trip.creatorOpenid === currentOpenid
```

则该用户可以：

```text
编辑该旅行下所有账单
删除该旅行下所有账单
```

### 5.2.3 普通成员

普通成员如果不是账单创建者，也不是旅行创建者，则不能编辑或删除别人的账单。

### 5.2.4 权限判断总结

允许编辑或删除的条件：

```js
const canManageExpense =
  expense.createdBy === currentOpenid ||
  trip.creatorOpenid === currentOpenid
```

但此判断必须在云函数中执行，不能只在前端判断。

前端可以根据该逻辑隐藏按钮，但不能作为安全边界。

------

## 5.3 新增云函数

建议新增：

```text
getExpenseDetail
updateExpense
deleteExpense
```

------

## 5.4 getExpenseDetail

### 功能

获取单个账单详情，用于编辑页面回显。

### 输入

```js
{
  tripId: string,
  expenseId: string
}
```

### 校验

1. 当前用户必须属于该旅行。
2. 账单必须存在。
3. 账单必须属于该 tripId。
4. 已解散旅行不能继续编辑。

### 输出

```js
{
  success: true,
  data: {
    expense: {}
  },
  message: ""
}
```

------

## 5.5 updateExpense

### 功能

编辑账单。

### 输入

```js
{
  tripId: string,
  expenseId: string,
  title: string,
  amount: number,
  payerOpenid: string,
  participantOpenids: string[],
  category: string,
  customCategory: string,
  note: string
}
```

### 校验

1. 当前用户必须属于该旅行。
2. 账单必须存在。
3. 账单必须属于该 tripId。
4. 当前用户必须是账单创建者或旅行创建者。
5. title 不能为空。
6. amount 必须大于 0。
7. payerOpenid 必须属于该旅行，或属于历史账单允许范围。
8. participantOpenids 至少包含一个成员。
9. participantOpenids 中所有成员必须属于该旅行，或属于历史账单允许范围。
10. category 必须是允许分类之一。
11. 如果 category 是 other 且用户填写了 customCategory，则保存 customCategory。
12. 已解散旅行不能继续编辑。

### 更新字段

```js
{
  title,
  amount,
  payerOpenid,
  participantOpenids,
  category,
  customCategory,
  note,
  updatedAt: new Date()
}
```

------

## 5.6 deleteExpense

### 功能

删除账单。

V2.3 推荐使用软删除，不直接物理删除。

### 输入

```js
{
  tripId: string,
  expenseId: string
}
```

### 校验

1. 当前用户必须属于该旅行。
2. 账单必须存在。
3. 账单必须属于该 tripId。
4. 当前用户必须是账单创建者或旅行创建者。
5. 已解散旅行不能继续删除。

### 软删除字段

给 `expenses` 集合增加：

```js
{
  deleted: boolean,
  deletedAt: Date | null,
  deletedBy: string | null
}
```

删除时更新为：

```js
{
  deleted: true,
  deletedAt: new Date(),
  deletedBy: currentOpenid,
  updatedAt: new Date()
}
```

### 查询账单时的要求

`getExpenses` 和 `calculateSettlement` 必须排除：

```js
deleted === true
```

兼容旧数据：

```text
deleted 不存在时视为 false
```

------

## 5.7 前端页面

可以复用现有：

```text
pages/addExpense/addExpense
```

将其改造成支持新增和编辑两种模式。

### 新增模式

URL：

```text
/pages/addExpense/addExpense?tripId=xxx
```

### 编辑模式

URL：

```text
/pages/addExpense/addExpense?tripId=xxx&expenseId=yyy
```

页面逻辑：

1. 如果没有 `expenseId`，按新增模式。
2. 如果有 `expenseId`，调用 `getExpenseDetail`。
3. 回显账单字段。
4. 提交时调用 `updateExpense`。
5. 新增时调用原 `addExpense`。

按钮文案：

```text
新增模式：添加账单
编辑模式：保存修改
```

------

## 5.8 账单列表操作入口

在账单列表每条账单上，根据权限显示：

```text
编辑
删除
```

显示规则：

1. 如果当前用户是账单创建者，显示编辑/删除。
2. 如果当前用户是旅行创建者，显示编辑/删除。
3. 否则不显示。

删除前必须二次确认：

```text
确认删除账单？
删除后该账单不会参与结算。
```

------

## 5.9 添加或编辑后结算过期提示

如果用户此前已经计算过结算结果，则当发生以下操作后：

```text
新增账单
编辑账单
删除账单
```

应设置：

```js
settlementStale: true
```

提示：

```text
账单已更新，当前结算结果可能不是最新。请重新计算。
```

------

# 6. 阶段 4：账单分类

## 6.1 目标

给账单增加分类，方便用户查看和后续统计。

分类包括：

```text
餐饮
交通
住宿
门票
购物
其他
```

------

## 6.2 数据字段

给 `expenses` 集合增加字段：

```js
{
  category: string,
  customCategory: string
}
```

推荐枚举：

```js
category: "food" | "transport" | "hotel" | "ticket" | "shopping" | "other"
```

对应中文：

```js
const EXPENSE_CATEGORIES = [
  { key: 'food', label: '餐饮' },
  { key: 'transport', label: '交通' },
  { key: 'hotel', label: '住宿' },
  { key: 'ticket', label: '门票' },
  { key: 'shopping', label: '购物' },
  { key: 'other', label: '其他' }
]
```

如果选择：

```text
其他
```

则允许用户填写：

```text
自定义分类名称
```

保存到：

```js
customCategory
```

示例：

```js
{
  category: "other",
  customCategory: "签证"
}
```

展示时：

```text
如果 category !== other：展示分类中文 label
如果 category === other 且 customCategory 不为空：展示 customCategory
如果 category === other 且 customCategory 为空：展示“其他”
```

------

## 6.3 添加账单页面要求

`pages/addExpense/addExpense` 需要增加分类选择区域。

要求：

1. 默认分类可以是 `food` 或空。
2. 用户必须选择分类。
3. 选择“其他”后显示自定义分类输入框。
4. 自定义分类可选，但如果用户填写则保存。
5. 自定义分类建议限制在 10 个字符以内。
6. 分类字段在新增和编辑模式下都要支持。

------

## 6.4 云函数要求

需要修改：

```text
addExpense
updateExpense
getExpenses
getExpenseDetail
calculateSettlement
```

### addExpense

新增接收：

```js
category
customCategory
```

校验：

1. category 必须属于允许枚举。
2. customCategory 最长不超过 10 个字符。
3. 如果 category 不是 other，则 customCategory 可以保存为空字符串。

### getExpenses

返回账单时包含：

```js
category
customCategory
```

### getExpenseDetail

返回账单详情时包含：

```js
category
customCategory
```

### calculateSettlement

结算逻辑不直接依赖分类，但必须排除已删除账单。

------

## 6.5 账单列表展示

账单列表中展示分类标签。

示例：

```text
[餐饮] 午饭 120.00 元
[交通] 打车 36.50 元
[签证] 签证费 400.00 元
```

------

# 7. 阶段 5：成员退出后的历史账单结算兼容

## 7.1 当前问题

V2.2 支持普通成员退出旅行。

但如果某个成员参与过历史账单，退出后仍应参与历史账单结算。

例如：

```text
A、B、C 三人旅行
C 退出旅行
C 之前参与过某些账单
结算时仍应计算 C 在历史账单中的应付金额
```

否则会导致历史账务不准确。

------

## 7.2 目标

成员退出旅行后：

1. 该成员不再能访问该旅行。
2. 该成员不再出现在当前旅行活跃成员列表中。
3. 但该成员如果参与过历史账单，结算时仍参与结算。
4. 账单历史中的 payerOpenid、participantOpenids 不应因为成员退出而被自动删除。
5. 结算结果中应能显示已退出成员的昵称或兜底名称。

------

## 7.3 推荐数据结构调整

当前 trips 可能只有：

```js
memberOpenids: string[]
```

为了兼容退出历史，建议新增：

```js
formerMemberOpenids: string[]
```

普通成员退出时：

1. 从 `memberOpenids` 移除。
2. 加入 `formerMemberOpenids`。
3. 不重复加入。

更新后结构：

```js
{
  memberOpenids: string[],
  formerMemberOpenids: string[]
}
```

兼容旧数据：

```text
formerMemberOpenids 不存在时视为空数组
```

------

## 7.4 leaveTrip 云函数调整

普通成员退出时：

```js
memberOpenids: 移除 currentOpenid
formerMemberOpenids: 添加 currentOpenid
updatedAt: new Date()
```

不要删除该成员历史账单中的 openid。

------

## 7.5 calculateSettlement 云函数调整

结算时，参与成员来源不能只依赖当前 `memberOpenids`。

应基于账单动态收集所有参与过账单的人：

```text
结算成员集合 = 当前成员 + 所有账单 payerOpenid + 所有账单 participantOpenids
```

伪逻辑：

```js
const settlementOpenidSet = new Set()

trip.memberOpenids.forEach(openid => settlementOpenidSet.add(openid))

expenses.forEach(expense => {
  settlementOpenidSet.add(expense.payerOpenid)
  expense.participantOpenids.forEach(openid => settlementOpenidSet.add(openid))
})
```

这样即使成员已退出，只要历史账单里出现过，仍会进入结算。

------

## 7.6 用户信息查询

结算结果需要显示用户昵称。

查询 users 集合时，应查询：

```text
当前成员 + 历史账单涉及成员
```

如果某个 openid 找不到用户记录，显示兜底名称：

```text
旅友 XXXX
```

其中 `XXXX` 是 openid 后四位。

如果该用户已退出，可以在 UI 上标注：

```text
已退出
```

例如：

```text
王五（已退出） 应付 120.00 元
```

------

## 7.7 成员列表展示

设置页成员列表默认展示当前活跃成员。

可以另增加一个小区域：

```text
历史成员
```

用于展示已退出但仍涉及历史账单的成员。

V2.3 不强制展示历史成员，但结算结果必须能展示已退出成员。

------

# 8. 阶段 6：创建者移除成员

## 8.1 当前问题

如果开放邀请码加入，可能有人误加入旅行。

需要支持：

```text
创建者移除成员
```

------

## 8.2 功能目标

旅行创建者可以在设置 tab 的成员管理区域移除普通成员。

规则：

1. 只有旅行创建者可以移除成员。
2. 创建者不能移除自己。
3. 普通成员不能移除任何人。
4. 被移除成员不再能访问该旅行。
5. 被移除成员如果参与过历史账单，仍参与历史结算。
6. 移除前必须二次确认。

------

## 8.3 新增云函数：removeMember

### 输入

```js
{
  tripId: string,
  targetOpenid: string
}
```

### 校验

1. 当前用户必须属于该旅行。
2. 当前用户必须是旅行创建者。
3. targetOpenid 不能为空。
4. targetOpenid 必须属于当前 `memberOpenids`。
5. targetOpenid 不能等于 creatorOpenid。
6. 旅行不能是 dissolved 状态。
7. openid 必须从 `cloud.getWXContext().OPENID` 获取。
8. 不信任前端传入的当前用户 openid。

### 更新逻辑

与普通成员退出类似：

```js
memberOpenids: 移除 targetOpenid
formerMemberOpenids: 添加 targetOpenid
updatedAt: new Date()
```

不要删除该成员创建的历史账单、行程或待办。

------

## 8.4 设置页 UI

在 `tripWorkspace` 的设置 tab 成员列表中，如果当前用户是创建者，则对每个普通成员显示：

```text
移除
```

不对创建者自己显示移除按钮。

点击后弹窗：

```text
确认移除该成员？
移除后，该成员将无法继续访问本次旅行。其历史账单不会被删除，仍可能参与结算。
```

确认按钮：

```text
确认移除
```

取消按钮：

```text
取消
```

------

## 8.5 被移除用户访问旧链接

如果被移除用户通过旧链接访问：

```text
/pages/tripWorkspace/tripWorkspace?tripId=xxx
```

应无法访问。

`getTripDetail` 应返回：

```text
你没有权限查看该旅行
```

前端可以提示后返回首页。

------

# 9. 阶段 7：待办按负责人和状态筛选

## 9.1 当前问题

多人旅行时，每个人最关心：

```text
我负责什么？
```

当前待办如果只显示全部，会导致用户难以快速定位自己负责的事项。

------

## 9.2 目标

在待办 tab 增加筛选功能。

筛选项：

```text
我的待办
全部待办
未完成
已完成
```

------

## 9.3 筛选含义

### 我的待办

显示当前用户负责的待办。

条件：

```js
todo.assigneeOpenids.includes(currentOpenid)
```

### 全部待办

显示当前旅行下全部待办。

### 未完成

显示：

```js
todo.completed === false
```

### 已完成

显示：

```js
todo.completed === true
```

------

## 9.4 筛选 UI

在待办 tab 顶部增加筛选按钮组。

推荐顺序：

```text
我的待办 | 全部待办 | 未完成 | 已完成
```

默认筛选：

```text
我的待办
```

原因：

用户最关心自己负责的事项。

如果“我的待办”为空，显示：

```text
暂无你负责的待办
```

------

## 9.5 实现方式

V2.3 可以先在前端筛选，不一定新增云函数参数。

流程：

1. `getTodos(tripId)` 仍返回全部待办。
2. 前端保存原始列表：

```js
todos: []
```

1. 前端根据 `todoFilter` 计算展示列表：

```js
filteredTodos
```

推荐状态：

```js
data: {
  todoFilter: 'mine',
  todos: [],
  currentOpenid: ''
}
```

筛选 key：

```js
todoFilter: 'mine' | 'all' | 'unfinished' | 'finished'
```

------

## 9.6 注意事项

如果当前用户信息还没加载完成，不要错误显示“暂无你负责的待办”。

加载顺序：

1. 先确保 currentOpenid 已有。
2. 再进行“我的待办”筛选。
3. 如果 currentOpenid 未就绪，显示 loading 或先用全部待办兜底。

------

# 10. 本次可能涉及文件

Claude Code 应根据实际项目结构判断，但大概率涉及以下文件。

## 10.1 文档结构

新增或修改：

```text
/spec
/spec/PROJECT_SPEC.md
/spec/CLOUD_DEV_GUIDE.md
/spec/V2_SPEC.md
/spec/V2_OPTIMIZATION_SPEC.md
/spec/V2.2_DETAIL_OPTIMIZATION_SPEC.md
/spec/V2.3_SPEC.md
/CHANGELOG.md
```

## 10.2 页面文件

可能修改：

```text
pages/joinTrip/joinTrip.wxml
pages/joinTrip/joinTrip.wxss
pages/joinTrip/joinTrip.js

pages/tripWorkspace/tripWorkspace.wxml
pages/tripWorkspace/tripWorkspace.wxss
pages/tripWorkspace/tripWorkspace.js

pages/addExpense/addExpense.wxml
pages/addExpense/addExpense.wxss
pages/addExpense/addExpense.js
```

## 10.3 service 文件

可能修改：

```text
services/expenseService.js
services/tripService.js
services/todoService.js
```

## 10.4 utils 文件

可能新增或修改：

```text
utils/expenseCategory.js
utils/user.js
```

## 10.5 云函数

新增：

```text
getExpenseDetail
updateExpense
deleteExpense
removeMember
```

可能修改：

```text
addExpense
getExpenses
calculateSettlement
leaveTrip
getTripDetail
getMyTrips
```

------

# 11. 推荐开发顺序

Claude Code 必须按以下阶段开发，不要一次性完成全部 V2.3。

## 阶段 1：文档结构整理与 CHANGELOG

目标：

1. 新建 `spec/` 文件夹。
2. 将所有 spec 和规范文档移动到 `spec/`。
3. 创建或补充 `CHANGELOG.md`。
4. 把 V1.0、V2.0、V2.1、V2.2 的历史记录补进去。
5. 记录本阶段修改内容。

完成标准：

1. 文档结构清晰。
2. 根目录不再堆放大量 spec 文件。
3. CHANGELOG.md 存在并包含历史版本记录。

------

## 阶段 2：修复邀请码输入光标

目标：

1. 修复 joinTrip 页面透明 input 光标闪烁问题。
2. 保留 6 格邀请码 UI。
3. 保留输入、删除、粘贴、自动大写功能。

完成标准：

1. 看不到竖条光标闪烁。
2. 输入功能正常。
3. 粘贴功能正常。

------

## 阶段 3：账单编辑和删除

目标：

1. 新增 getExpenseDetail 云函数。
2. 新增 updateExpense 云函数。
3. 新增 deleteExpense 云函数。
4. addExpense 页面支持新增和编辑两种模式。
5. 账单列表中根据权限显示编辑和删除按钮。
6. getExpenses 和 calculateSettlement 排除软删除账单。

完成标准：

1. 账单创建者可以编辑/删除自己创建的账单。
2. 旅行创建者可以编辑/删除所有账单。
3. 普通成员不能编辑/删除别人创建的账单。
4. 删除账单后不参与结算。
5. 编辑或删除后结算结果提示过期。

------

## 阶段 4：账单分类

目标：

1. addExpense 增加分类字段。
2. 支持餐饮、交通、住宿、门票、购物、其他。
3. 选择其他时可以填写自定义分类。
4. 账单列表展示分类标签。
5. 编辑账单时可以修改分类。

完成标准：

1. 新增账单可以选择分类。
2. 编辑账单可以回显和修改分类。
3. 账单列表显示分类。
4. 其他分类支持自定义名称。

------

## 阶段 5：成员退出后历史账单结算兼容

目标：

1. leaveTrip 将退出成员加入 formerMemberOpenids。
2. calculateSettlement 基于账单动态收集所有历史参与者。
3. 已退出成员仍能参与历史账单结算。
4. 结算结果中可以显示已退出成员兜底名称或标识。

完成标准：

1. 成员退出后不能访问旅行。
2. 该成员如果参与过历史账单，仍出现在结算结果中。
3. 历史账务不因成员退出而丢失。

------

## 阶段 6：创建者移除成员

目标：

1. 新增 removeMember 云函数。
2. 设置 tab 成员列表中为创建者显示“移除”按钮。
3. 创建者不能移除自己。
4. 普通成员不能移除他人。
5. 被移除成员加入 formerMemberOpenids。
6. 被移除成员无法继续访问旅行。
7. 被移除成员历史账单仍参与结算。

完成标准：

1. 创建者可以移除普通成员。
2. 普通成员看不到移除按钮。
3. 被移除用户不再看到该旅行。
4. 被移除用户历史账单仍可参与结算。

------

## 阶段 7：待办筛选

目标：

1. 待办 tab 增加筛选按钮组。
2. 支持我的待办、全部待办、未完成、已完成。
3. 默认显示我的待办。
4. 空状态文案按筛选类型变化。

完成标准：

1. 我的待办只显示当前用户负责的事项。
2. 全部待办显示所有事项。
3. 未完成只显示未完成。
4. 已完成只显示已完成。
5. 不因为 currentOpenid 未加载而误显示空状态。

------

## 阶段 8：整体测试和修复

目标：

1. 测试文档结构。
2. 测试邀请码输入。
3. 测试账单编辑删除权限。
4. 测试账单分类。
5. 测试成员退出后的结算。
6. 测试创建者移除成员。
7. 测试待办筛选。
8. 修复明显 bug。
9. 更新 CHANGELOG。

------

# 12. 关键测试场景

## 12.1 账单权限测试

### 创建者编辑所有账单

步骤：

1. 用旅行创建者账号进入账单 tab。
2. 尝试编辑别人创建的账单。
3. 尝试删除别人创建的账单。

预期：

```text
允许编辑
允许删除
```

### 账单创建者编辑自己的账单

步骤：

1. 用普通成员账号创建一笔账单。
2. 编辑该账单。
3. 删除该账单。

预期：

```text
允许编辑
允许删除
```

### 普通成员不能编辑别人的账单

步骤：

1. 用普通成员 A 创建账单。
2. 用普通成员 B 登录。
3. 尝试编辑或删除该账单。

预期：

```text
前端不显示按钮
即使构造请求调用云函数也被拒绝
```

------

## 12.2 分类测试

步骤：

1. 新增一笔餐饮账单。
2. 新增一笔交通账单。
3. 新增一笔其他账单，并填写自定义分类“签证”。
4. 查看账单列表。

预期：

```text
显示 [餐饮]
显示 [交通]
显示 [签证]
```

------

## 12.3 退出成员结算测试

步骤：

1. A 创建旅行。
2. B、C 加入旅行。
3. C 参与一笔账单。
4. C 退出旅行。
5. A 点击计算结算。

预期：

```text
C 无法继续访问旅行
C 仍出现在结算结果中
C 的历史账单仍参与计算
```

------

## 12.4 移除成员测试

步骤：

1. A 是创建者。
2. B 是普通成员。
3. A 在设置 tab 移除 B。
4. B 尝试访问旧旅行链接。

预期：

```text
B 被移出 memberOpenids
B 加入 formerMemberOpenids
B 无法访问该旅行
B 历史账单仍参与结算
```

------

## 12.5 待办筛选测试

步骤：

1. 创建多个待办。
2. 分别指定不同负责人。
3. 切换我的待办、全部待办、未完成、已完成。

预期：

```text
各筛选结果正确
空状态文案正确
```

------

# 13. 给 Claude Code 的 V2.3 启动 Prompt

请使用以下 prompt 开始 V2.3：

```text
请先阅读当前项目中的所有需求文档。如果文档已经被移动到 spec/ 文件夹，则阅读 spec/ 下的所有文档；如果还没移动，则阅读根目录下的 PROJECT_SPEC.md、CLOUD_DEV_GUIDE.md、V2_SPEC.md、V2_OPTIMIZATION_SPEC.md、V2.2_DETAIL_OPTIMIZATION_SPEC.md 和 V2.3_SPEC.md。

当前任务：开始 V2.3 开发。

请注意：
1. 不要重建项目。
2. 不要删除已有 V1 / V2 / V2.1 / V2.2 核心功能。
3. 不要一次性完成全部 V2.3。
4. 严格按照 V2.3_SPEC.md 的推荐开发顺序推进。
5. 当前只执行阶段 1：文档结构整理与 CHANGELOG。
6. 阶段 1 完成后必须更新 CHANGELOG.md。

阶段 1 目标：
1. 新建 spec/ 文件夹。
2. 将所有需求文档和规范文档移动到 spec/ 文件夹。
3. 创建或补充 CHANGELOG.md。
4. 在 CHANGELOG.md 中补全 V1.0、V2.0、V2.1、V2.2 的历史记录。
5. 在 CHANGELOG.md 中记录本次 V2.3 阶段 1 修改了什么。

修改代码前，请先说明：
1. 你理解的阶段 1 目标。
2. 当前项目中发现了哪些 spec 或规范文档。
3. 准备移动哪些文件。
4. 准备新增或修改哪些文件。
5. 是否存在文档命名冲突。

修改完成后，请说明：
1. 实际移动了哪些文件。
2. 实际新增或修改了哪些文件。
3. CHANGELOG.md 中新增了哪些内容。
4. 下一阶段应该做什么。
```

------

# 14. V2.3 验收标准

V2.3 完成后应满足：

## 14.1 文档管理

```text
所有 spec 文档都在 spec/ 文件夹中
CHANGELOG.md 存在
CHANGELOG.md 记录 V1.0 至 V2.3 的修改内容
后续每次修改都会更新 CHANGELOG.md
```

## 14.2 邀请码输入

```text
6 格邀请码输入正常
小写自动大写
粘贴正常
看不到透明 input 的竖条光标
```

## 14.3 账单

```text
账单可以编辑
账单可以删除
账单权限正确
账单支持分类
其他分类支持自定义名称
删除账单不参与结算
编辑或删除账单后结算结果提示过期
```

## 14.4 成员与结算

```text
成员退出后无法访问旅行
成员被移除后无法访问旅行
退出或被移除成员的历史账单仍参与结算
创建者可以移除普通成员
普通成员不能移除他人
```

## 14.5 待办

```text
待办支持我的待办
待办支持全部待办
待办支持未完成
待办支持已完成
默认显示我的待办
```

------

# 15. 特别注意

V2.3 中最容易出错的地方是：

```text
成员退出或被移除后，历史账单结算不能丢失该成员
```

因此不要简单地认为：

```text
结算成员 = 当前 memberOpenids
```

正确逻辑应是：

```text
结算成员 = 当前成员 + 历史账单中出现过的付款人和参与人
```

另外，账单编辑和删除必须在云函数中做权限校验，前端隐藏按钮只是用户体验，不是安全边界。
