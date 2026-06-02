# 同行旅 微信小程序项目需求文档

## 1. 项目基本信息

项目名称：同行旅
项目类型：微信小程序
开发方式：微信小程序原生开发 + 微信云开发
目标版本：MVP 第一版
目标用户：朋友出游、同学旅行、家庭旅行、小型多人旅行团队

本项目用于多人旅行过程中的协作管理，核心功能包括：

- 创建旅行
- 邀请成员加入旅行
- 管理旅行成员
- 查看和编辑行程安排
- 添加旅行账单
- 按成员进行 AA 分摊
- 自动计算最终结算方案

第一版重点是完成可用的核心闭环，不追求复杂社交功能、商业化系统和高级 AI 功能。

------

## 2. 技术栈要求

### 2.1 前端技术

使用微信小程序原生框架：

- WXML
- WXSS
- JavaScript
- JSON

第一版不使用：

- uni-app
- Taro
- React
- Vue
- TypeScript

### 2.2 后端技术

使用微信云开发，不使用自建服务器。

使用的云开发能力包括：

- 云函数
- 云数据库
- 云存储

### 2.3 登录和身份

使用微信 openid 作为用户唯一身份标识。

要求：

- 不设计账号密码登录系统
- 不设计手机号注册登录系统
- 不在前端保存 appSecret
- 不在前端保存腾讯云 SecretId、SecretKey
- 用户 openid 必须通过云函数获取
- 权限校验应主要放在云函数中完成

------

## 3. 项目目标

### 3.1 第一版核心目标

第一版需要实现以下完整流程：

1. 用户打开小程序。
2. 用户完成微信身份识别。
3. 用户创建一个旅行。
4. 用户通过邀请码邀请其他成员加入旅行。
5. 成员可以查看旅行详情。
6. 成员可以添加行程项目。
7. 成员可以添加旅行账单。
8. 系统根据账单自动计算 AA 结果。
9. 系统输出最终谁应该给谁多少钱。

### 3.2 第一版不做的功能

以下功能第一版暂不开发：

- 微信支付
- 真实转账
- 酒店预订
- 机票预订
- 火车票预订
- 地图导航
- AI 自动生成行程
- 多币种结算
- 非平均分摊
- 好友系统
- 私信系统
- 评论系统
- 商业后台
- Web 管理端
- App 端
- 公众号联动

------

## 4. 页面结构

### 4.1 首页

路径：

```text
pages/index/index
```

功能：

- 显示用户当前加入的旅行列表
- 显示旅行名称、目的地、日期
- 提供“创建旅行”按钮
- 提供“加入旅行”入口
- 点击旅行卡片后进入旅行详情页

页面状态：

- 如果用户没有任何旅行，显示空状态提示
- 如果用户已有旅行，显示旅行列表

------

### 4.2 创建旅行页

路径：

```text
pages/createTrip/createTrip
```

功能：

- 输入旅行名称
- 输入目的地
- 选择开始日期
- 选择结束日期
- 点击按钮创建旅行
- 创建成功后跳转到旅行详情页

表单字段：

- name：旅行名称
- destination：目的地
- startDate：开始日期
- endDate：结束日期

校验要求：

- 旅行名称不能为空
- 目的地不能为空
- 开始日期不能为空
- 结束日期不能为空
- 结束日期不能早于开始日期

------

### 4.3 加入旅行页

路径：

```text
pages/joinTrip/joinTrip
```

功能：

- 输入邀请码
- 点击按钮加入旅行
- 加入成功后跳转到旅行详情页

表单字段：

- inviteCode：邀请码

校验要求：

- 邀请码不能为空
- 如果邀请码不存在，提示用户
- 如果用户已经加入该旅行，直接跳转到旅行详情页

------

### 4.4 旅行详情页

路径：

```text
pages/tripDetail/tripDetail
```

功能：

- 显示旅行基本信息
- 显示目的地
- 显示旅行日期
- 显示成员数量
- 显示账单总金额
- 显示行程概览
- 显示成员概览
- 提供进入行程页、账单页、结算页、成员页的入口
- 显示邀请码，方便邀请成员

入口：

- 行程管理
- 账单管理
- 结算结果
- 成员管理

------

### 4.5 行程页

路径：

```text
pages/itinerary/itinerary
```

功能：

- 按日期展示行程项目
- 添加行程项目
- 编辑行程项目
- 删除行程项目

行程字段：

- date：日期
- title：行程标题
- location：地点
- startTime：开始时间
- endTime：结束时间
- note：备注

校验要求：

- 行程标题不能为空
- 日期不能为空
- 当前用户必须属于该旅行

------

### 4.6 添加行程页

路径：

```text
pages/addItinerary/addItinerary
```

功能：

- 新增行程项目
- 编辑已有行程项目

表单字段：

- title：标题
- date：日期
- location：地点
- startTime：开始时间
- endTime：结束时间
- note：备注

------

### 4.7 账单页

路径：

```text
pages/expenses/expenses
```

功能：

- 显示当前旅行的账单列表
- 显示每笔账单标题、金额、付款人、参与分摊人数
- 显示当前旅行总消费金额
- 提供“添加账单”按钮
- 点击账单可查看详情

账单列表字段：

- title：账单标题
- amount：金额
- payer：付款人
- participantCount：参与分摊人数
- createdAt：创建时间

------

### 4.8 添加账单页

路径：

```text
pages/addExpense/addExpense
```

功能：

- 添加新的旅行账单
- 输入账单标题
- 输入账单金额
- 选择付款人
- 选择参与分摊成员
- 输入备注
- 提交账单

表单字段：

- title：账单标题
- amount：金额
- payerOpenid：付款人 openid
- participantOpenids：参与分摊成员 openid 数组
- note：备注

校验要求：

- 账单标题不能为空
- 金额必须大于 0
- 必须选择付款人
- 必须至少选择一个参与分摊成员
- 付款人必须属于当前旅行
- 所有参与分摊成员必须属于当前旅行

第一版只支持平均分摊。

------

### 4.9 结算页

路径：

```text
pages/settlement/settlement
```

功能：

- 显示每个成员的实付金额
- 显示每个成员的应付金额
- 显示每个成员的净额
- 显示最简转账方案

展示示例：

```text
张三 应收 50.00 元
李四 应付 20.00 元
王五 应付 30.00 元

结算方案：
李四 转给 张三 20.00 元
王五 转给 张三 30.00 元
```

------

### 4.10 成员页

路径：

```text
pages/members/members
```

功能：

- 显示当前旅行所有成员
- 显示成员昵称
- 显示成员头像
- 显示创建者标识
- 显示邀请码

第一版暂不支持：

- 踢出成员
- 转让创建者
- 成员权限分级

------

## 5. 数据库集合设计

### 5.1 users 集合

集合名：

```text
users
```

用途：

存储用户基本信息。

字段设计：

```js
{
  _id: string,
  openid: string,
  nickName: string,
  avatarUrl: string,
  createdAt: Date,
  updatedAt: Date
}
```

字段说明：

| 字段      | 类型   | 说明              |
| --------- | ------ | ----------------- |
| _id       | string | 数据库自动生成 ID |
| openid    | string | 微信用户唯一标识  |
| nickName  | string | 用户昵称          |
| avatarUrl | string | 用户头像          |
| createdAt | Date   | 创建时间          |
| updatedAt | Date   | 更新时间          |

------

### 5.2 trips 集合

集合名：

```text
trips
```

用途：

存储旅行基本信息。

字段设计：

```js
{
  _id: string,
  name: string,
  destination: string,
  startDate: string,
  endDate: string,
  creatorOpenid: string,
  memberOpenids: string[],
  inviteCode: string,
  createdAt: Date,
  updatedAt: Date
}
```

字段说明：

| 字段          | 类型     | 说明             |
| ------------- | -------- | ---------------- |
| _id           | string   | 旅行 ID          |
| name          | string   | 旅行名称         |
| destination   | string   | 目的地           |
| startDate     | string   | 开始日期         |
| endDate       | string   | 结束日期         |
| creatorOpenid | string   | 创建者 openid    |
| memberOpenids | string[] | 成员 openid 数组 |
| inviteCode    | string   | 邀请码           |
| createdAt     | Date     | 创建时间         |
| updatedAt     | Date     | 更新时间         |

------

### 5.3 expenses 集合

集合名：

```text
expenses
```

用途：

存储旅行账单。

字段设计：

```js
{
  _id: string,
  tripId: string,
  title: string,
  amount: number,
  payerOpenid: string,
  participantOpenids: string[],
  splitType: "equal",
  note: string,
  createdBy: string,
  createdAt: Date,
  updatedAt: Date
}
```

字段说明：

| 字段               | 类型     | 说明                         |
| ------------------ | -------- | ---------------------------- |
| _id                | string   | 账单 ID                      |
| tripId             | string   | 所属旅行 ID                  |
| title              | string   | 账单标题                     |
| amount             | number   | 金额，单位为元               |
| payerOpenid        | string   | 付款人 openid                |
| participantOpenids | string[] | 参与分摊成员                 |
| splitType          | string   | 分摊方式，第一版固定为 equal |
| note               | string   | 备注                         |
| createdBy          | string   | 创建者 openid                |
| createdAt          | Date     | 创建时间                     |
| updatedAt          | Date     | 更新时间                     |

------

### 5.4 itinerary 集合

集合名：

```text
itinerary
```

用途：

存储旅行行程项目。

字段设计：

```js
{
  _id: string,
  tripId: string,
  date: string,
  title: string,
  location: string,
  startTime: string,
  endTime: string,
  note: string,
  createdBy: string,
  createdAt: Date,
  updatedAt: Date
}
```

字段说明：

| 字段      | 类型   | 说明          |
| --------- | ------ | ------------- |
| _id       | string | 行程项目 ID   |
| tripId    | string | 所属旅行 ID   |
| date      | string | 日期          |
| title     | string | 行程标题      |
| location  | string | 地点          |
| startTime | string | 开始时间      |
| endTime   | string | 结束时间      |
| note      | string | 备注          |
| createdBy | string | 创建者 openid |
| createdAt | Date   | 创建时间      |
| updatedAt | Date   | 更新时间      |

------

## 6. 云函数设计

### 6.1 login

云函数名：

```text
login
```

功能：

- 获取当前用户 openid
- 查询 users 集合中是否已有该用户
- 如果没有，则创建用户记录
- 返回用户基本信息

输入：

```js
{
  nickName: string,
  avatarUrl: string
}
```

输出：

```js
{
  success: true,
  data: {
    openid: string,
    user: object
  },
  message: ""
}
```

------

### 6.2 createTrip

云函数名：

```text
createTrip
```

功能：

- 获取当前用户 openid
- 创建旅行
- 自动将创建者加入 memberOpenids
- 生成 inviteCode
- 返回创建的 trip

输入：

```js
{
  name: string,
  destination: string,
  startDate: string,
  endDate: string
}
```

输出：

```js
{
  success: true,
  data: {
    tripId: string,
    trip: object
  },
  message: ""
}
```

校验：

- name 不能为空
- destination 不能为空
- startDate 不能为空
- endDate 不能为空
- endDate 不能早于 startDate

------

### 6.3 joinTrip

云函数名：

```text
joinTrip
```

功能：

- 根据 inviteCode 查找旅行
- 获取当前用户 openid
- 将当前用户加入 memberOpenids
- 如果用户已经加入，不重复添加
- 返回 trip 信息

输入：

```js
{
  inviteCode: string
}
```

输出：

```js
{
  success: true,
  data: {
    tripId: string,
    trip: object
  },
  message: ""
}
```

校验：

- inviteCode 不能为空
- inviteCode 必须存在

------

### 6.4 getMyTrips

云函数名：

```text
getMyTrips
```

功能：

- 获取当前用户 openid
- 查询 memberOpenids 包含当前用户 openid 的所有旅行
- 按 createdAt 或 startDate 排序返回

输入：

```js
{}
```

输出：

```js
{
  success: true,
  data: {
    trips: []
  },
  message: ""
}
```

------

### 6.5 getTripDetail

云函数名：

```text
getTripDetail
```

功能：

- 获取当前用户 openid
- 校验当前用户是否属于该旅行
- 返回旅行基本信息
- 返回成员信息
- 返回账单概览
- 返回行程概览

输入：

```js
{
  tripId: string
}
```

输出：

```js
{
  success: true,
  data: {
    trip: object,
    members: [],
    expenseSummary: object,
    itineraryPreview: []
  },
  message: ""
}
```

校验：

- tripId 不能为空
- 当前用户必须属于该旅行

------

### 6.6 addExpense

云函数名：

```text
addExpense
```

功能：

- 获取当前用户 openid
- 校验当前用户是否属于该旅行
- 校验付款人是否属于该旅行
- 校验参与分摊成员是否都属于该旅行
- 写入 expenses 集合

输入：

```js
{
  tripId: string,
  title: string,
  amount: number,
  payerOpenid: string,
  participantOpenids: string[],
  note: string
}
```

输出：

```js
{
  success: true,
  data: {
    expenseId: string,
    expense: object
  },
  message: ""
}
```

校验：

- tripId 不能为空
- title 不能为空
- amount 必须大于 0
- payerOpenid 不能为空
- participantOpenids 不能为空
- 当前用户必须属于该旅行
- payerOpenid 必须属于该旅行
- participantOpenids 中所有成员必须属于该旅行

------

### 6.7 getExpenses

云函数名：

```text
getExpenses
```

功能：

- 获取当前用户 openid
- 校验当前用户是否属于该旅行
- 查询该旅行下所有账单
- 返回账单列表

输入：

```js
{
  tripId: string
}
```

输出：

```js
{
  success: true,
  data: {
    expenses: [],
    totalAmount: number
  },
  message: ""
}
```

------

### 6.8 addItinerary

云函数名：

```text
addItinerary
```

功能：

- 获取当前用户 openid
- 校验当前用户是否属于该旅行
- 添加行程项目

输入：

```js
{
  tripId: string,
  date: string,
  title: string,
  location: string,
  startTime: string,
  endTime: string,
  note: string
}
```

输出：

```js
{
  success: true,
  data: {
    itineraryId: string,
    itinerary: object
  },
  message: ""
}
```

------

### 6.9 getItinerary

云函数名：

```text
getItinerary
```

功能：

- 获取当前用户 openid
- 校验当前用户是否属于该旅行
- 查询该旅行下所有行程
- 按日期和开始时间排序返回

输入：

```js
{
  tripId: string
}
```

输出：

```js
{
  success: true,
  data: {
    itinerary: []
  },
  message: ""
}
```

------

### 6.10 calculateSettlement

云函数名：

```text
calculateSettlement
```

功能：

- 获取当前用户 openid
- 校验当前用户是否属于该旅行
- 查询该旅行下所有账单
- 计算每个成员的实付金额
- 计算每个成员的应付金额
- 计算每个成员的净额
- 生成最简转账方案

输入：

```js
{
  tripId: string
}
```

输出：

```js
{
  success: true,
  data: {
    balances: [
      {
        openid: string,
        paid: number,
        shouldPay: number,
        net: number
      }
    ],
    transfers: [
      {
        from: string,
        to: string,
        amount: number
      }
    ]
  },
  message: ""
}
```

------

## 7. 结算算法要求

第一版只支持平均分摊。

计算逻辑：

1. 查询当前旅行下所有账单。
2. 初始化每个成员的 paid、shouldPay、net。
3. 遍历每一笔账单：
   - payerOpenid 对应成员的 paid 增加 amount。
   - participantOpenids 中每个成员的 shouldPay 增加 amount / participantCount。
4. 遍历所有成员：
   - net = paid - shouldPay。
5. net > 0 的成员为应收款人。
6. net < 0 的成员为应付款人。
7. 使用贪心算法生成最简转账方案：
   - 应付款人向应收款人转账。
   - 每次转账金额取二者绝对值中的较小值。
   - 直到所有 net 接近 0。

金额处理要求：

- 页面显示金额时保留两位小数。
- 结算计算应尽量避免浮点误差。
- 推荐内部使用“分”为单位进行计算。
- 最终展示时转换为“元”。

------

## 8. 权限规则

### 8.1 基本原则

1. 用户只能查看自己加入的旅行。
2. 用户只能操作自己加入的旅行。
3. 用户不能向未加入的旅行添加账单。
4. 用户不能向未加入的旅行添加行程。
5. 用户不能修改不属于自己的旅行数据。
6. 关键权限校验必须在云函数中完成。
7. 前端校验只用于用户体验，不能作为安全边界。

### 8.2 trips 权限

用户可以：

- 创建旅行
- 查看自己加入的旅行
- 加入有正确邀请码的旅行

用户不可以：

- 查看未加入的旅行详情
- 修改未加入的旅行
- 删除未加入的旅行

### 8.3 expenses 权限

用户可以：

- 查看自己所在旅行的账单
- 向自己所在旅行添加账单

用户不可以：

- 查看其他旅行账单
- 向其他旅行添加账单
- 使用不属于该旅行的成员作为付款人
- 使用不属于该旅行的成员作为分摊成员

### 8.4 itinerary 权限

用户可以：

- 查看自己所在旅行的行程
- 向自己所在旅行添加行程

用户不可以：

- 查看其他旅行行程
- 向其他旅行添加行程

------

## 9. 统一返回格式

所有云函数应使用统一返回格式。

成功：

```js
{
  success: true,
  data: {},
  message: ""
}
```

失败：

```js
{
  success: false,
  data: null,
  message: "错误原因"
}
```

前端应根据 success 判断请求是否成功。

------

## 10. 前端代码结构

建议目录结构：

```text
/miniprogram
  /pages
    /index
      index.wxml
      index.wxss
      index.js
      index.json
    /createTrip
      createTrip.wxml
      createTrip.wxss
      createTrip.js
      createTrip.json
    /joinTrip
      joinTrip.wxml
      joinTrip.wxss
      joinTrip.js
      joinTrip.json
    /tripDetail
      tripDetail.wxml
      tripDetail.wxss
      tripDetail.js
      tripDetail.json
    /itinerary
      itinerary.wxml
      itinerary.wxss
      itinerary.js
      itinerary.json
    /addItinerary
      addItinerary.wxml
      addItinerary.wxss
      addItinerary.js
      addItinerary.json
    /expenses
      expenses.wxml
      expenses.wxss
      expenses.js
      expenses.json
    /addExpense
      addExpense.wxml
      addExpense.wxss
      addExpense.js
      addExpense.json
    /settlement
      settlement.wxml
      settlement.wxss
      settlement.js
      settlement.json
    /members
      members.wxml
      members.wxss
      members.js
      members.json

  /components
    /trip-card
    /member-avatar
    /expense-item
    /itinerary-item

  /services
    cloudService.js
    userService.js
    tripService.js
    expenseService.js
    itineraryService.js
    settlementService.js

  /utils
    format.js
    money.js
    date.js

  app.js
  app.json
  app.wxss
```

------

## 11. 云函数目录结构

建议目录结构：

```text
/cloudfunctions
  /login
    index.js
    package.json
  /createTrip
    index.js
    package.json
  /joinTrip
    index.js
    package.json
  /getMyTrips
    index.js
    package.json
  /getTripDetail
    index.js
    package.json
  /addExpense
    index.js
    package.json
  /getExpenses
    index.js
    package.json
  /addItinerary
    index.js
    package.json
  /getItinerary
    index.js
    package.json
  /calculateSettlement
    index.js
    package.json
```

------

## 12. Service 层要求

页面中不要到处直接写 `wx.cloud.callFunction`。

应封装 service 层。

示例：

```js
// services/cloudService.js

export function callCloudFunction(name, data = {}) {
  return wx.cloud.callFunction({
    name,
    data
  })
}
```

示例：

```js
// services/tripService.js

import { callCloudFunction } from './cloudService'

export function createTrip(data) {
  return callCloudFunction('createTrip', data)
}

export function joinTrip(data) {
  return callCloudFunction('joinTrip', data)
}

export function getMyTrips() {
  return callCloudFunction('getMyTrips')
}

export function getTripDetail(tripId) {
  return callCloudFunction('getTripDetail', { tripId })
}
```

------

## 13. 云开发初始化要求

在 `app.js` 中初始化云开发。

示例：

```js
App({
  onLaunch() {
    wx.cloud.init({
      env: '请替换为实际云环境 ID',
      traceUser: true
    })
  }
})
```

要求：

- env 需要替换为实际云环境 ID。
- 不要使用别人的云环境 ID。
- 不要在前端保存 appSecret。
- 不要在前端保存腾讯云 SecretId 和 SecretKey。

------

## 14. UI 风格要求

整体风格：

- 极简
- 清晰
- 轻量
- 适合旅行场景
- 页面留白充足
- 颜色不宜过多
- 交互简单直观

建议视觉方向：

- 主色：蓝绿色、浅绿色或旅行感较强的清爽色
- 背景：浅色背景
- 卡片：圆角卡片
- 按钮：大按钮，文字清晰
- 图标：线性图标或极简图标

页面文案风格：

- 简短
- 明确
- 不使用复杂术语

示例：

```text
创建旅行
加入旅行
添加账单
查看结算
添加行程
复制邀请码
```

------

## 15. 错误提示要求

常见错误提示：

| 场景                 | 提示                     |
| -------------------- | ------------------------ |
| 旅行名称为空         | 请输入旅行名称           |
| 目的地为空           | 请输入目的地             |
| 日期为空             | 请选择旅行日期           |
| 结束日期早于开始日期 | 结束日期不能早于开始日期 |
| 邀请码为空           | 请输入邀请码             |
| 邀请码错误           | 未找到对应旅行           |
| 金额为空             | 请输入金额               |
| 金额小于等于 0       | 金额必须大于 0           |
| 未选择付款人         | 请选择付款人             |
| 未选择分摊成员       | 请至少选择一位分摊成员   |
| 没有权限             | 你没有权限操作该旅行     |
| 网络错误             | 网络异常，请稍后重试     |

------

## 16. 金额处理规则

金额输入：

- 用户输入单位为“元”
- 支持小数
- 最多保留两位小数

金额存储：

- 第一版可以用 number 存储元
- 但结算计算建议转换为“分”进行内部计算

金额展示：

- 统一保留两位小数
- 示例：`12.50 元`

------

## 17. 日期和时间处理规则

日期格式：

```text
YYYY-MM-DD
```

时间格式：

```text
HH:mm
```

旅行日期：

- startDate
- endDate

行程时间：

- date
- startTime
- endTime

排序规则：

- 行程按 date 升序排列
- 同一天内按 startTime 升序排列
- 账单按 createdAt 倒序排列

------

## 18. MVP 开发顺序

请按以下顺序开发，不要一次性开发所有功能。

### 阶段 1：项目骨架

目标：

- 创建小程序目录结构
- 配置 app.json
- 初始化云开发
- 创建基础页面
- 创建 service 层目录

完成标准：

- 小程序可以在微信开发者工具中正常启动
- 页面可以正常跳转

------

### 阶段 2：登录和用户初始化

目标：

- 实现 login 云函数
- 获取 openid
- 创建或更新 users 记录
- 前端启动时完成用户初始化

完成标准：

- 可以在控制台看到当前用户 openid
- users 集合中可以看到用户记录

------

### 阶段 3：创建旅行

目标：

- 实现 createTrip 云函数
- 实现创建旅行页面
- 创建 trips 数据
- 创建成功后跳转到旅行详情页

完成标准：

- trips 集合中出现新旅行
- creatorOpenid 正确
- memberOpenids 包含创建者
- inviteCode 正确生成

------

### 阶段 4：我的旅行列表

目标：

- 实现 getMyTrips 云函数
- 首页展示当前用户加入的旅行列表

完成标准：

- 首页可以看到自己创建或加入的旅行
- 点击旅行可以进入详情页

------

### 阶段 5：加入旅行

目标：

- 实现 joinTrip 云函数
- 实现加入旅行页面
- 用户可以通过邀请码加入旅行

完成标准：

- 输入正确邀请码后可以加入旅行
- memberOpenids 正确更新
- 重复加入不会产生重复 openid

------

### 阶段 6：旅行详情

目标：

- 实现 getTripDetail 云函数
- 展示旅行基本信息
- 展示成员概览
- 展示账单概览
- 展示行程概览

完成标准：

- 详情页能正确展示旅行信息
- 未加入成员无法查看详情

------

### 阶段 7：账单功能

目标：

- 实现 addExpense 云函数
- 实现 getExpenses 云函数
- 实现账单列表页
- 实现添加账单页

完成标准：

- 可以添加账单
- 可以选择付款人
- 可以选择分摊成员
- 账单列表正确展示
- 权限校验正确

------

### 阶段 8：结算功能

目标：

- 实现 calculateSettlement 云函数
- 实现结算页
- 输出每个成员 paid、shouldPay、net
- 输出最简转账方案

完成标准：

- 多人多账单情况下结算正确
- 金额显示保留两位小数

------

### 阶段 9：行程功能

目标：

- 实现 addItinerary 云函数
- 实现 getItinerary 云函数
- 实现行程列表页
- 实现添加行程页

完成标准：

- 可以添加行程
- 可以按日期查看行程
- 行程排序正确

------

### 阶段 10：UI 优化和测试

目标：

- 优化页面样式
- 统一按钮、卡片、列表样式
- 完善空状态
- 完善错误提示
- 测试完整用户流程

完成标准：

- 从创建旅行到结算的完整流程可跑通
- 页面样式统一
- 常见错误有明确提示

------

## 19. 测试场景

### 19.1 创建旅行测试

步骤：

1. 打开小程序。
2. 点击创建旅行。
3. 输入旅行名称、目的地、日期。
4. 点击确认创建。

预期结果：

- 创建成功。
- trips 集合新增数据。
- 当前用户成为创建者。
- 当前用户出现在 memberOpenids 中。
- 页面跳转到旅行详情页。

------

### 19.2 加入旅行测试

步骤：

1. 使用另一个微信用户打开小程序。
2. 输入邀请码。
3. 点击加入旅行。

预期结果：

- 加入成功。
- trips 集合中 memberOpenids 增加该用户 openid。
- 用户首页出现该旅行。

------

### 19.3 添加账单测试

步骤：

1. 进入某个旅行。
2. 进入账单页。
3. 点击添加账单。
4. 输入金额。
5. 选择付款人。
6. 选择分摊成员。
7. 提交账单。

预期结果：

- expenses 集合新增账单。
- 账单列表正确显示。
- 总金额正确更新。

------

### 19.4 结算测试

测试数据：

```text
成员 A 支付 300 元，A、B、C 三人平摊
成员 B 支付 60 元，A、B、C 三人平摊
```

计算：

```text
总金额：360 元
每人应付：120 元

A 实付 300，应付 120，净额 +180
B 实付 60，应付 120，净额 -60
C 实付 0，应付 120，净额 -120
```

预期结算方案：

```text
B 转给 A 60 元
C 转给 A 120 元
```

------

## 20. Claude Code 开发要求

请 Claude Code 严格遵守以下规则：

1. 每次只实现一个阶段，不要一次性生成全部功能。
2. 每次修改代码前，先说明本次要实现什么。
3. 每次修改代码前，列出会修改哪些文件。
4. 每次生成代码后，说明如何在微信开发者工具中测试。
5. 不要在前端写入 appSecret。
6. 不要在前端写入腾讯云 SecretId 或 SecretKey。
7. 权限校验必须主要放在云函数中。
8. 页面中不要到处直接调用 `wx.cloud.callFunction`，应通过 service 层封装。
9. 代码应保持简洁，不要过度设计。
10. 第一版优先保证功能跑通。

------

## 21. 给 Claude Code 的启动指令

请先阅读本文件，然后按阶段 1 开始开发。

第一步只需要完成：

1. 微信小程序项目基础目录结构。
2. `app.js` 中的云开发初始化。
3. `app.json` 页面注册。
4. 首页、创建旅行页、加入旅行页、旅行详情页的基础页面。
5. service 层基础封装。
6. 不需要一次性实现所有云函数。

完成后请告诉我：

1. 修改了哪些文件。
2. 如何在微信开发者工具中运行。
3. 如何测试页面跳转。
4. 下一步应该实现什么。
