# V2-1_SPEC.md

# 同行旅 V2 优化需求文档

## 1. 文档目的

本文档用于指导 Claude Code 在已有 V2 开发基础上继续优化小程序体验。

请 Claude Code 先阅读：

```text
PROJECT_SPEC.md
CLOUD_DEV_GUIDE.md
V2_SPEC.md
V2_OPTIMIZATION_SPEC.md
```

然后基于当前代码继续修改。

本次优化不要求重建项目，不要求大规模重构，只针对以下四个方向进行优化：

1. 邀请码输入体验优化。
2. 行程时间校验优化。
3. 冷启动加载状态优化。
4. 登录昵称和头像个性化优化。

------

## 2. 总体开发要求

### 2.1 禁止事项

本次优化禁止：

1. 重建整个项目。
2. 删除 V1 或 V2 已有核心功能。
3. 修改无关业务逻辑。
4. 引入新的技术栈。
5. 使用 uni-app、Taro、Vue、React、TypeScript。
6. 使用自建服务器。
7. 在前端写入 appSecret、SecretId、SecretKey。
8. 让前端伪造 openid。

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

### 2.3 修改原则

Claude Code 修改代码前必须先说明：

1. 本次准备解决哪个优化点。
2. 准备修改哪些文件。
3. 是否需要新增页面、组件、云函数或数据库字段。
4. 是否影响已有数据结构。
5. 如何保持兼容 V1/V2 已有功能。

修改完成后必须说明：

1. 实际修改了哪些文件。
2. 如何在微信开发者工具中测试。
3. 哪些地方需要用户手动配置。
4. 是否需要上传云函数。
5. 是否需要在云数据库中新建字段或集合。

------

## 3. 优化一：邀请码输入体验优化

### 3.1 当前问题

当前加入旅行时需要输入邀请码。

问题：

1. 邀请码大小写容易输错。
2. 普通输入框体验不够直观。
3. 用户不知道邀请码长度。
4. 视觉上不够像“邀请码 / 验证码”输入。

### 3.2 优化目标

将邀请码输入改成类似网页验证码输入的形式：

```text
[ A ] [ B ] [ C ] [ D ] [ E ] [ F ]
```

具体要求：

1. 显示 6 个独立输入格。
2. 用户输入小写字母时自动转成大写。
3. 每个格子只显示一个字符。
4. 输入满 6 位后，可以自动组合为完整邀请码。
5. 支持删除和重新输入。
6. 支持粘贴完整 6 位邀请码。
7. 样式要更像“分享验证码 / 邀请码”。
8. 字体、颜色、边框要明显区别于普通输入框。

------

### 3.3 邀请码格式

邀请码统一按 6 位处理。

推荐格式：

```text
A-Z
0-9
```

示例：

```text
A7K3Q9
```

### 3.4 输入规则

用户输入时：

1. 自动转大写。
2. 去除空格。
3. 只保留字母和数字。
4. 最多保留 6 位。
5. 输入不足 6 位时不能提交。
6. 输入满 6 位后可以允许点击“加入旅行”。

伪逻辑：

```js
function normalizeInviteCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
}
```

------

### 3.5 推荐 UI 实现方式

可以使用一个隐藏 input 接收真实输入，然后用 6 个 view 展示每一位。

推荐结构：

```text
真实 input：opacity: 0 或 position absolute 隐藏
展示层：6 个 code-box
```

这样可以更好支持：

1. 连续输入。
2. 删除。
3. 粘贴。
4. 移动端键盘。

不建议真的写 6 个独立 input，因为微信小程序里焦点跳转和删除处理会更复杂。

------

### 3.6 joinTrip 页面 UI 要求

页面路径：

```text
pages/joinTrip/joinTrip
```

页面应包含：

1. 标题：加入旅行
2. 说明文案：请输入 6 位邀请码
3. 六位邀请码输入格
4. 加入旅行按钮
5. 错误提示

示例文案：

```text
请输入好友分享的 6 位邀请码
```

按钮状态：

```text
邀请码不足 6 位：按钮禁用或点击提示
邀请码达到 6 位：允许提交
```

------

### 3.7 邀请码样式要求

样式方向：

1. 每个格子为正方形或接近正方形。
2. 字体较大。
3. 字母居中。
4. 字体加粗。
5. 当前输入位置有高亮边框。
6. 已输入字符使用明显颜色。
7. 整体像“验证码 / 分享码”。

推荐视觉：

```text
背景：浅色
边框：蓝绿色或项目主色
当前格：边框加深
字体：加粗、大号、等宽字体
圆角：8px - 12px
间距：8px - 12px
```

示例类名：

```text
invite-code-wrapper
invite-code-box
invite-code-box-active
invite-code-char
```

------

### 3.8 粘贴处理

如果用户粘贴：

```text
ab12cd
```

应自动变成：

```text
AB12CD
```

如果用户粘贴：

```text
AB12CDxxxx
```

应只保留：

```text
AB12CD
```

如果用户粘贴：

```text
AB-12 CD
```

应清洗为：

```text
AB12CD
```

------

### 3.9 提交逻辑

提交时调用已有：

```text
joinTrip
```

云函数。

提交前前端校验：

```text
inviteCode.length === 6
```

云函数中也应做校验：

1. inviteCode 不能为空。
2. inviteCode 转大写。
3. inviteCode 长度必须为 6。
4. 根据大写后的 inviteCode 查询旅行。

如果当前云函数没有统一转大写，需要补充。

------

### 3.10 兼容旧邀请码

如果旧数据里已有小写邀请码，建议在查询时兼容：

1. 创建新旅行时邀请码统一生成大写。
2. 加入旅行时输入统一转大写。
3. 如果需要兼容旧数据，可以查询前先转大写；如旧数据确实有小写，需要一次性修复或在云函数里兼容大小写。

V2 优先要求：

```text
新生成的邀请码统一大写
用户输入的邀请码统一大写
```

------

### 3.11 测试场景

测试 1：输入小写

```text
输入：abc123
预期：显示 ABC123
```

测试 2：粘贴带空格

```text
输入：ab 12 cd
预期：显示 AB12CD
```

测试 3：输入特殊字符

```text
输入：a@b#12cd
预期：显示 AB12CD
```

测试 4：不足 6 位提交

```text
输入：ABC12
预期：提示“请输入 6 位邀请码”
```

测试 5：正确邀请码

```text
输入：ABC123
预期：成功加入旅行
```

------

## 4. 优化二：行程时间校验

### 4.1 当前问题

添加或编辑行程时，用户可能选择：

```text
结束时间早于开始时间
```

例如：

```text
开始时间：15:00
结束时间：13:00
```

这会导致行程逻辑混乱。

### 4.2 优化目标

在添加或编辑行程时自动检测：

```text
endTime 是否早于 startTime
```

如果结束时间早于开始时间，应阻止提交并提示用户。

------

### 4.3 适用页面

适用于：

```text
pages/addItinerary/addItinerary
```

如果项目中存在编辑行程页面，也应一并处理。

------

### 4.4 校验规则

当同时存在：

```text
startTime
endTime
```

时，检查：

```text
endTime >= startTime
```

如果：

```text
endTime < startTime
```

则提示：

```text
结束时间不能早于开始时间
```

并阻止提交。

### 4.5 是否允许结束时间等于开始时间

V2 暂时允许：

```text
endTime === startTime
```

因为有些事项可能是瞬时提醒，例如：

```text
集合
打卡
办理入住
```

如果后续需要严格限制，可以再改成：

```text
endTime > startTime
```

------

### 4.6 跨天行程说明

V2 暂不支持跨天行程。

如果用户确实需要跨天行程，建议拆成两条行程。

因此本次校验基于同一天内的 `HH:mm` 时间比较。

------

### 4.7 推荐实现

可以在 `utils/date.js` 或页面中增加时间比较函数。

推荐放入：

```text
utils/date.js
```

示例：

```js
export function compareTime(timeA, timeB) {
  const [hourA, minuteA] = String(timeA || '').split(':').map(Number)
  const [hourB, minuteB] = String(timeB || '').split(':').map(Number)

  const totalA = hourA * 60 + minuteA
  const totalB = hourB * 60 + minuteB

  return totalA - totalB
}

export function isEndTimeBeforeStartTime(startTime, endTime) {
  if (!startTime || !endTime) return false
  return compareTime(endTime, startTime) < 0
}
```

提交前：

```js
if (isEndTimeBeforeStartTime(startTime, endTime)) {
  wx.showToast({
    title: '结束时间不能早于开始时间',
    icon: 'none'
  })
  return
}
```

------

### 4.8 云函数侧校验

前端校验不能作为唯一边界。

如果 `addItinerary` 或 `updateItinerary` 云函数中接收 `startTime` 和 `endTime`，也应增加校验。

云函数中如果检测到结束时间早于开始时间，应返回：

```js
{
  success: false,
  data: null,
  message: '结束时间不能早于开始时间'
}
```

------

### 4.9 测试场景

测试 1：

```text
开始时间：09:00
结束时间：10:00
预期：允许提交
```

测试 2：

```text
开始时间：10:00
结束时间：10:00
预期：允许提交
```

测试 3：

```text
开始时间：15:00
结束时间：13:00
预期：阻止提交，提示“结束时间不能早于开始时间”
```

测试 4：

```text
开始时间为空
结束时间：13:00
预期：不触发该校验，由原有必填规则处理
```

------

## 5. 优化三：冷启动加载状态优化

### 5.1 当前问题

冷启动或首次进入 `tripWorkspace` 时，用户点击：

```text
账单
待办
```

可能会先看到空内容，然后数据才加载出来。

这会造成误解，让用户以为：

```text
没有账单
没有待办
```

但实际上只是数据还没加载完成。

### 5.2 优化目标

在数据未返回前，不展示空状态和列表内容，而是显示加载中状态。

要求：

1. 正在加载时显示转圈 loading。
2. 数据加载完成后再判断是否为空。
3. 加载失败时显示错误状态。
4. 不要在数据未返回时显示“暂无账单”或“暂无待办”。
5. 行程、账单、待办三个 tab 都应有明确 loading 状态。

------

### 5.3 状态设计

建议为不同模块分别维护加载状态。

在 `tripWorkspace.js` 中设计：

```js
data: {
  activeTab: 'itinerary',

  tripLoading: true,
  itineraryLoading: false,
  expensesLoading: false,
  settlementLoading: false,
  todosLoading: false,

  itineraryLoaded: false,
  expensesLoaded: false,
  settlementLoaded: false,
  todosLoaded: false,

  itineraryError: '',
  expensesError: '',
  settlementError: '',
  todosError: '',

  itineraryList: [],
  expenses: [],
  settlement: null,
  todos: []
}
```

说明：

```text
loading：正在请求中
loaded：是否已经请求完成过
error：请求失败信息
```

------

### 5.4 展示逻辑

每个 tab 内容展示应遵守以下顺序：

```text
如果 loading === true:
  显示加载中

否则如果 error 不为空:
  显示错误提示和重试按钮

否则如果 loaded === true 且数据为空:
  显示空状态

否则:
  显示数据内容
```

不要在：

```text
loaded === false
```

的时候显示空状态。

------

### 5.5 加载中 UI

加载中可以使用：

```text
wx.showLoading
```

或页面内自定义 loading。

本需求更推荐页面内自定义 loading，因为 tab 内容切换时更自然。

示例 UI：

```text
正在加载账单...
```

或：

```text
加载中...
```

可以使用微信小程序原生 loading 组件或 CSS 动画。

要求：

1. 视觉上有转圈。
2. 文案明确。
3. 不遮挡整个小程序太久。
4. 不影响用户切换 tab。

------

### 5.6 账单 tab 特殊要求

账单 tab 涉及两个请求：

1. `getExpenses`
2. `calculateSettlement`

展示时建议：

1. 账单列表和结算结果分别有 loading。
2. 如果账单还在加载，不展示“暂无账单”。
3. 如果结算还在加载，显示“正在计算结算结果...”。
4. 如果没有账单，结算区域可以显示“暂无账单，暂不需要结算”。

------

### 5.7 待办 tab 特殊要求

待办 tab 首次切换时：

1. 先显示“正在加载待办...”。
2. 请求完成后：
   - 如果有待办，显示待办列表。
   - 如果没有待办，显示“暂无待办事项”。
3. 不允许先显示“暂无待办事项”再变成列表。

------

### 5.8 行程 tab 特殊要求

行程 tab 是默认 tab。

进入 `tripWorkspace` 时，应先加载行程。

如果行程请求未完成：

```text
显示“正在加载行程...”
```

请求完成且为空时才显示：

```text
暂无行程安排
```

------

### 5.9 重试按钮

加载失败时显示：

```text
加载失败，请重试
```

并提供：

```text
重试
```

按钮。

点击后重新加载当前 tab 对应数据。

------

### 5.10 测试场景

测试 1：冷启动进入账单 tab

```text
步骤：冷启动小程序，进入 tripWorkspace 后立即点击账单
预期：先显示“正在加载账单...”，数据返回后再显示账单或空状态
```

测试 2：冷启动进入待办 tab

```text
步骤：冷启动小程序，进入 tripWorkspace 后立即点击待办
预期：先显示“正在加载待办...”，数据返回后再显示待办或空状态
```

测试 3：无账单

```text
预期：请求完成后才显示“暂无账单”
```

测试 4：无待办

```text
预期：请求完成后才显示“暂无待办事项”
```

测试 5：请求失败

```text
预期：显示错误提示和重试按钮
```

------

## 6. 优化四：登录昵称和头像个性化

### 6.1 当前问题

当前用户可能都显示为：

```text
微信用户
```

这会导致多人旅行中无法区分成员。

例如：

```text
微信用户
微信用户
微信用户
```

在账单、待办、成员列表、负责人选择等场景中都不清晰。

### 6.2 优化目标

增加用户个性化资料设置能力。

要求：

1. 初次进入小程序时，引导用户使用微信昵称和头像。
2. 用户可以设置或修改自己在小程序内显示的昵称和头像。
3. 设置页提供修改昵称和头像入口。
4. 成员列表、账单付款人、待办负责人等位置优先显示用户设置后的昵称和头像。
5. 不要让所有用户都显示为“微信用户”。

------

### 6.3 重要平台说明

微信小程序目前不能像早期版本一样无条件自动获取用户头像和昵称。

应使用符合微信小程序规范的方式：

1. 用户主动点击按钮。
2. 使用 `open-type="chooseAvatar"` 选择头像。
3. 使用昵称输入能力让用户填写或确认昵称。
4. 不要假设可以静默获取用户微信昵称和头像。

因此，本需求中的“自动弹出使用微信昵称和头像”应理解为：

```text
初次进入时自动弹出资料设置弹窗，引导用户主动授权或填写昵称头像。
```

而不是后台静默获取。

------

### 6.4 用户资料字段

建议扩展 `users` 集合。

字段：

```js
{
  _id: string,
  openid: string,
  nickName: string,
  avatarUrl: string,
  profileCompleted: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

说明：

| 字段             | 类型    | 说明                       |
| ---------------- | ------- | -------------------------- |
| openid           | string  | 用户唯一标识               |
| nickName         | string  | 用户在本小程序内显示的昵称 |
| avatarUrl        | string  | 用户头像                   |
| profileCompleted | boolean | 是否已完成资料设置         |
| createdAt        | Date    | 创建时间                   |
| updatedAt        | Date    | 更新时间                   |

如果当前项目已有 `nickName`、`avatarUrl` 字段，则不要重复创建，只补充：

```text
profileCompleted
```

或者通过判断 `nickName` 是否有效来确定是否需要弹窗。

------

### 6.5 初次进入弹窗逻辑

在小程序完成 login 后判断当前用户资料是否完整。

判断条件：

```text
nickName 为空
或 nickName === '微信用户'
或 avatarUrl 为空
或 profileCompleted !== true
```

如果满足以上任意条件，则弹出资料设置弹窗。

弹窗应包含：

1. 标题：完善个人资料
2. 说明：用于在旅行成员、账单和待办中区分你
3. 头像选择按钮
4. 昵称输入框
5. 确认按钮
6. 暂不设置按钮

推荐文案：

```text
完善个人资料
设置昵称和头像后，同行成员可以更容易识别你。
```

------

### 6.6 是否允许跳过

V2 允许用户暂时跳过。

但如果跳过，应给一个更可区分的默认昵称。

默认昵称规则：

```text
旅友 + openid 后 4 位
```

示例：

```text
旅友 A82F
```

不要继续统一显示：

```text
微信用户
```

### 6.7 设置页修改入口

在 `tripWorkspace` 的设置 tab 中增加：

```text
个人资料
```

展示：

1. 当前头像。
2. 当前昵称。
3. 修改资料按钮。

点击后弹出或进入资料编辑界面。

推荐按钮文案：

```text
修改昵称和头像
```

------

### 6.8 推荐实现方式

可以新增一个页面：

```text
pages/profileEdit/profileEdit
```

也可以在设置 tab 内弹窗编辑。

推荐优先使用弹窗或半屏弹层，避免增加过多页面。

如果项目结构更适合页面，也可以新增：

```text
pages/profileEdit/profileEdit
```

------

### 6.9 头像选择

使用微信小程序头像选择能力。

推荐 WXML 结构：

```xml
<button class="avatar-button" open-type="chooseAvatar" bindchooseavatar="onChooseAvatar">
  <image class="avatar" src="{{avatarUrl || defaultAvatar}}"></image>
</button>
```

事件：

```js
onChooseAvatar(e) {
  const avatarUrl = e.detail.avatarUrl
  this.setData({ avatarUrl })
}
```

注意：

1. `chooseAvatar` 获取到的头像路径可能是临时路径。
2. 如果需要长期保存，应上传到云存储。
3. V2 可以先保存临时路径用于本地显示，但更推荐上传云存储后保存 fileID。
4. 如果实现云存储，应遵守 CLOUD_DEV_GUIDE.md 的云存储规范。

------

### 6.10 昵称输入

使用普通 input。

示例：

```xml
<input
  type="nickname"
  placeholder="请输入昵称"
  value="{{nickName}}"
  bindinput="onNickNameInput"
/>
```

提交前校验：

1. 昵称不能为空。
2. 昵称去除首尾空格。
3. 昵称长度建议不超过 20。
4. 昵称不能全是空格。

错误提示：

```text
请输入昵称
昵称不能超过 20 个字符
```

------

### 6.11 云函数：updateUserProfile

建议新增云函数：

```text
updateUserProfile
```

输入：

```js
{
  nickName: string,
  avatarUrl: string
}
```

云函数逻辑：

1. 通过 `cloud.getWXContext().OPENID` 获取当前用户。
2. 校验 nickName。
3. 更新 `users` 集合中当前用户记录。
4. 设置 `profileCompleted: true`。
5. 更新 `updatedAt`。
6. 返回更新后的用户信息。

返回：

```js
{
  success: true,
  data: {
    user: {}
  },
  message: ''
}
```

失败：

```js
{
  success: false,
  data: null,
  message: '错误原因'
}
```

------

### 6.12 userService.js

增加：

```js
export function updateUserProfile(data) {
  return callCloudFunction('updateUserProfile', data)
}
```

------

### 6.13 login 云函数兼容

如果用户第一次登录，没有昵称和头像，login 云函数可以创建默认用户：

```js
{
  openid,
  nickName: `旅友${openid.slice(-4).toUpperCase()}`,
  avatarUrl: '',
  profileCompleted: false,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

不要默认统一写：

```text
微信用户
```

------

### 6.14 显示优先级

在所有展示用户的地方，昵称显示优先级：

```text
user.nickName
旅友 + openid 后 4 位
未知用户
```

头像显示优先级：

```text
user.avatarUrl
默认头像
```

适用位置：

1. 成员列表。
2. 账单付款人。
3. 账单分摊人。
4. 结算结果。
5. 待办负责人。
6. 待办完成人。
7. 设置页用户资料。

------

### 6.15 测试场景

测试 1：新用户首次进入

```text
预期：登录后弹出完善个人资料弹窗
```

测试 2：新用户跳过设置

```text
预期：用户昵称显示为“旅友XXXX”，而不是“微信用户”
```

测试 3：设置昵称头像

```text
步骤：选择头像，输入昵称，保存
预期：users 集合更新，profileCompleted 为 true
```

测试 4：设置页修改资料

```text
步骤：进入设置 tab，点击修改昵称和头像
预期：可以重新设置昵称和头像
```

测试 5：多人旅行展示

```text
预期：成员列表、账单、待办负责人显示不同昵称，不再全部是“微信用户”
```

------

## 7. 本次新增或修改的文件建议

Claude Code 应根据当前项目实际情况判断，但大概率涉及以下文件。

### 7.1 页面文件

可能修改：

```text
pages/joinTrip/joinTrip.wxml
pages/joinTrip/joinTrip.wxss
pages/joinTrip/joinTrip.js

pages/addItinerary/addItinerary.wxml
pages/addItinerary/addItinerary.js

pages/tripWorkspace/tripWorkspace.wxml
pages/tripWorkspace/tripWorkspace.wxss
pages/tripWorkspace/tripWorkspace.js
```

可能新增：

```text
pages/profileEdit/profileEdit
```

如果使用弹窗实现资料编辑，则可以不新增页面。

------

### 7.2 service 文件

可能修改：

```text
services/userService.js
services/tripService.js
services/itineraryService.js
```

------

### 7.3 utils 文件

可能修改或新增：

```text
utils/date.js
utils/format.js
utils/user.js
```

建议新增：

```text
utils/user.js
```

用于统一处理昵称、头像默认值。

------

### 7.4 云函数

可能新增：

```text
cloudfunctions/updateUserProfile
```

可能修改：

```text
cloudfunctions/login
cloudfunctions/joinTrip
cloudfunctions/createTrip
cloudfunctions/addItinerary
cloudfunctions/updateItinerary
```

说明：

1. `createTrip`：确保生成的邀请码为大写。
2. `joinTrip`：确保输入的邀请码转大写后查询。
3. `addItinerary`：增加结束时间校验。
4. `updateItinerary`：如果存在编辑功能，也要增加结束时间校验。
5. `login`：创建用户时不要统一叫“微信用户”。
6. `updateUserProfile`：保存昵称头像。

------

## 8. 推荐开发顺序

请 Claude Code 按以下顺序开发。

### 阶段 1：邀请码输入优化

目标：

1. 修改 joinTrip 页面输入方式。
2. 实现 6 格验证码样式。
3. 输入自动转大写。
4. 支持粘贴。
5. joinTrip 云函数兼容大写邀请码。
6. createTrip 云函数生成大写邀请码。

完成标准：

1. 小写输入自动变大写。
2. 输入不足 6 位不能提交。
3. 粘贴邀请码正常。
4. 正确邀请码可以加入旅行。

------

### 阶段 2：行程时间校验

目标：

1. 前端添加行程时校验结束时间。
2. 云函数添加行程时校验结束时间。
3. 如果存在编辑行程，也同步校验。

完成标准：

1. 结束时间早于开始时间时不能提交。
2. 前端和云函数都有校验。
3. 提示文案明确。

------

### 阶段 3：冷启动 loading 优化

目标：

1. 为行程、账单、待办增加 loading / loaded / error 状态。
2. 请求未返回前不显示空状态。
3. 显示页面内加载中转圈。
4. 请求失败显示重试按钮。

完成标准：

1. 冷启动立即点账单，不会先显示“暂无账单”。
2. 冷启动立即点待办，不会先显示“暂无待办”。
3. 数据返回后再显示真实内容。
4. 请求失败可以重试。

------

### 阶段 4：用户昵称头像优化

目标：

1. 修改 login 默认用户创建逻辑。
2. 新增 updateUserProfile 云函数。
3. 新增前端资料设置弹窗或页面。
4. 初次进入时自动弹出资料设置。
5. 设置 tab 增加修改昵称头像入口。
6. 所有用户展示位置优先使用用户设置昵称和头像。

完成标准：

1. 新用户不会全部显示为“微信用户”。
2. 用户可以设置昵称和头像。
3. 设置页可以修改昵称和头像。
4. 多人旅行成员可区分。

------

## 9. 验收标准

本次优化完成后，应满足以下标准：

### 9.1 邀请码

```text
邀请码输入为 6 个格子
小写自动转大写
支持粘贴
样式明显像验证码/邀请码
不足 6 位不能提交
```

### 9.2 行程

```text
结束时间早于开始时间时无法提交
前端和云函数均有校验
提示文案清晰
```

### 9.3 冷启动

```text
账单数据未返回前显示 loading
待办数据未返回前显示 loading
行程数据未返回前显示 loading
不会先误显示空状态
加载失败有重试按钮
```

### 9.4 用户资料

```text
新用户首次进入会被引导设置资料
用户可以设置昵称和头像
设置页可以修改昵称头像
成员、账单、待办中可以区分不同用户
默认不再统一显示“微信用户”
```

------

## 10. 给 Claude Code 的启动 Prompt

请使用以下 prompt 开始本次优化：

```text
请先阅读 PROJECT_SPEC.md、CLOUD_DEV_GUIDE.md、V2_SPEC.md 和 V2_OPTIMIZATION_SPEC.md。

当前任务：开始执行 V2 优化。

请注意：
1. 不要重建项目。
2. 不要删除已有 V1/V2 核心功能。
3. 不要一次性完成全部优化。
4. 严格按照 V2_OPTIMIZATION_SPEC.md 的推荐开发顺序推进。
5. 当前只执行阶段 1：邀请码输入优化。

阶段 1 目标：
1. 将 joinTrip 页面的邀请码输入改为 6 格验证码样式。
2. 输入自动转大写。
3. 只允许字母和数字。
4. 支持粘贴完整邀请码。
5. 不足 6 位不能提交。
6. 修改 joinTrip 云函数，使其查询前统一把 inviteCode 转大写。
7. 检查 createTrip 云函数，确保新生成的邀请码统一为大写。

修改代码前，请先说明：
1. 你理解的阶段 1 目标。
2. 当前项目中相关文件有哪些。
3. 准备修改哪些文件。
4. 是否需要修改云函数。
5. 是否需要上传云函数。

修改完成后，请说明：
1. 实际修改了哪些文件。
2. 如何在微信开发者工具中测试小写输入、粘贴输入、错误邀请码和正确邀请码。
3. 下一阶段应该做什么。
```

------

## 11. 备注

本次优化的重点不是增加大功能，而是提升可用性。

优先级如下：

```text
邀请码输入准确性
行程时间数据正确性
冷启动状态不误导用户
多人旅行成员可区分
```

这些优化会明显提升小程序的实际使用体验，尤其是在多人旅行和真实测试场景中。
