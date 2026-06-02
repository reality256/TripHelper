# CLOUD_DEV_GUIDE.md

# 同行旅 微信云开发使用规范

本文档用于约束 Claude Code 在本项目中如何使用微信云开发。

本项目是微信小程序项目，使用：

- 微信小程序原生开发
- 微信云开发
- 云函数
- 云数据库
- 云存储

本项目不使用自建服务器。

------

## 1. 官方文档链接

开发前请优先阅读微信官方云开发文档：

```text
https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html
```

该文档用于参考以下内容：

1. 微信云开发基础概念。
2. 云开发环境创建方式。
3. `wx.cloud.init` 初始化方式。
4. 云函数创建和调用方式。
5. 小程序端调用云函数方式。
6. 云函数端使用 `wx-server-sdk` 的方式。
7. 云数据库基础操作。
8. 云存储基础操作。
9. 微信开发者工具中云开发相关配置。

如果 Claude Code 无法读取该在线文档，请明确说明：

```text
我无法读取微信官方在线文档。
```

然后继续基于本项目文档和通用微信云开发知识完成当前任务，不要编造不确定的官方细节。

如果遇到 API 用法不确定的地方，应提示用户补充官方文档片段，而不是自行臆造。

------

## 2. 本项目云开发定位

本项目使用微信云开发作为后端，不使用自建服务器。

云开发承担以下职责：

1. 用户身份识别。
2. 获取用户 `openid`。
3. 数据库读写。
4. 权限校验。
5. 创建旅行。
6. 加入旅行。
7. 添加账单。
8. 添加行程。
9. 计算 AA 结算结果。
10. 存储图片、票据等文件。

前端只负责：

1. 页面展示。
2. 表单输入。
3. 基础用户体验校验。
4. 调用 service 层。
5. 通过 service 层调用云函数。
6. 展示云函数返回结果。

------

## 3. 技术边界

### 3.1 必须使用

本项目必须使用：

```text
微信小程序原生框架
微信云开发
云函数
云数据库
云存储
JavaScript
WXML
WXSS
JSON
```

### 3.2 不使用

第一版不使用：

```text
自建后端服务器
Express
Koa
NestJS
Spring Boot
Django
Flask
MySQL
PostgreSQL
Redis
MongoDB 自建实例
uni-app
Taro
React
Vue
TypeScript
```

### 3.3 不要过度设计

MVP 阶段优先保证：

1. 功能跑通。
2. 数据结构清晰。
3. 权限不出大问题。
4. 页面能正常使用。
5. 后续可扩展。

不要在第一版引入复杂架构。

------

## 4. 安全原则

### 4.1 禁止放在前端的内容

以下内容绝对不能写入小程序前端代码：

```text
appSecret
腾讯云 SecretId
腾讯云 SecretKey
数据库管理员密钥
云环境管理密钥
任何第三方服务密钥
任何可以绕过权限校验的敏感凭据
```

### 4.2 前端不是安全边界

前端校验只用于改善用户体验，不能作为安全边界。

例如：

- 前端可以提示“金额不能为空”。
- 前端可以提示“请选择付款人”。
- 前端可以隐藏某些按钮。

但真正的权限校验必须在云函数中完成。

### 4.3 云函数必须做权限校验

涉及以下操作时，必须在云函数中校验权限：

1. 创建旅行。
2. 加入旅行。
3. 查看旅行详情。
4. 添加账单。
5. 查看账单。
6. 添加行程。
7. 查看行程。
8. 计算结算。
9. 修改旅行成员。
10. 上传与旅行相关的文件。

------

## 5. 用户身份规则

本项目使用微信 `openid` 作为用户唯一身份标识。

### 5.1 基本原则

1. 不设计账号密码登录。
2. 不设计手机号注册登录。
3. 不允许前端传入或伪造 `openid`。
4. `openid` 必须由云函数通过微信云开发能力获取。
5. 数据库中所有与用户相关的数据都应以 `openid` 关联。

### 5.2 云函数中获取 openid

云函数应使用 `wx-server-sdk` 获取当前调用者身份。

示例逻辑：

```js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  return {
    success: true,
    data: {
      openid
    },
    message: ''
  }
}
```

要求：

1. 不要让前端传入 `openid` 作为可信身份。
2. 即使前端传了 `openid`，云函数也不能直接信任。
3. 所有用户身份都以 `cloud.getWXContext().OPENID` 为准。

------

## 6. 云开发初始化规范

### 6.1 app.js 初始化

在 `app.js` 中初始化云开发。

示例：

```js
App({
  globalData: {
    user: null,
    openid: null
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用支持云开发的微信开发者工具')
      return
    }

    wx.cloud.init({
      env: '请替换为实际云环境 ID',
      traceUser: true
    })
  }
})
```

### 6.2 env 规则

`env` 是微信云开发环境 ID。

要求：

1. 开发时可以暂时写入实际环境 ID。
2. 不要使用别人的环境 ID。
3. 不要把 `env` 和 `appSecret` 混淆。
4. `env` 不是 `AppID`。
5. `env` 不是 `appSecret`。
6. `env` 不应写成示例中的假 ID 后就忘记替换。

### 6.3 初始化注意事项

Claude Code 在生成代码时应注意：

1. `wx.cloud.init` 只能在小程序端使用。
2. 云函数端使用 `wx-server-sdk` 初始化。
3. 小程序端和云函数端的初始化方式不同。
4. 不要把前端初始化代码写进云函数。
5. 不要把云函数初始化代码写进前端。

------

## 7. 云函数开发规范

### 7.1 云函数目录

云函数统一放在：

```text
/cloudfunctions
```

推荐结构：

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

### 7.2 云函数统一结构

每个云函数建议使用以下结构：

```js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    // 1. 读取 event 参数
    // 2. 校验参数
    // 3. 校验权限
    // 4. 执行业务逻辑
    // 5. 返回统一格式

    return {
      success: true,
      data: {},
      message: ''
    }
  } catch (err) {
    console.error(err)

    return {
      success: false,
      data: null,
      message: err.message || '服务器错误'
    }
  }
}
```

### 7.3 云函数返回格式

所有云函数必须使用统一返回格式。

成功：

```js
{
  success: true,
  data: {},
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

前端必须根据 `success` 判断请求是否成功。

不要让每个云函数返回完全不同的数据结构。

------

## 8. 前端调用云函数规范

### 8.1 不要在页面中直接散落调用

页面文件中不要到处直接写：

```js
wx.cloud.callFunction({
  name: 'xxx',
  data: {}
})
```

应通过 service 层封装。

### 8.2 cloudService.js

路径：

```text
/miniprogram/services/cloudService.js
```

推荐写法：

```js
export async function callCloudFunction(name, data = {}) {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data
    })

    const result = res.result

    if (!result) {
      throw new Error('云函数无返回结果')
    }

    if (!result.success) {
      throw new Error(result.message || '请求失败')
    }

    return result.data
  } catch (err) {
    console.error(`[cloudService] ${name} 调用失败`, err)
    throw err
  }
}
```

### 8.3 service 层示例

路径：

```text
/miniprogram/services/tripService.js
```

示例：

```js
import { callCloudFunction } from './cloudService'

export function createTrip(data) {
  return callCloudFunction('createTrip', data)
}

export function joinTrip(inviteCode) {
  return callCloudFunction('joinTrip', { inviteCode })
}

export function getMyTrips() {
  return callCloudFunction('getMyTrips')
}

export function getTripDetail(tripId) {
  return callCloudFunction('getTripDetail', { tripId })
}
```

### 8.4 页面调用示例

页面中只调用 service 方法。

示例：

```js
import { getMyTrips } from '../../services/tripService'

Page({
  data: {
    trips: [],
    loading: false
  },

  async onLoad() {
    await this.loadTrips()
  },

  async loadTrips() {
    try {
      this.setData({ loading: true })
      const data = await getMyTrips()
      this.setData({
        trips: data.trips || []
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
```

------

## 9. 数据库访问规范

### 9.1 数据库集合

本项目使用以下集合：

```text
users
trips
expenses
itinerary
```

### 9.2 数据库读写原则

1. 创建、修改、删除关键数据必须通过云函数。
2. 涉及权限的数据读取应通过云函数。
3. 前端不要直接修改关键集合。
4. 不要让前端直接修改 `memberOpenids`。
5. 不要让前端直接伪造 `payerOpenid`。
6. 不要让前端直接伪造 `createdBy`。
7. 云函数写入数据时，应使用当前调用者的 `openid` 作为可信身份。

### 9.3 时间字段

所有主要集合建议包含：

```js
createdAt: Date,
updatedAt: Date
```

创建时写入：

```js
const now = new Date()

createdAt: now,
updatedAt: now
```

更新时写入：

```js
updatedAt: new Date()
```

### 9.4 查询用户所在旅行

查询当前用户加入的旅行，应根据 `memberOpenids` 是否包含当前 `openid`。

示例逻辑：

```js
const res = await db.collection('trips')
  .where({
    memberOpenids: _.in([openid])
  })
  .get()
```

如果实际微信云数据库数组查询语法与此不一致，请以官方文档为准。

------

## 10. 权限校验规范

### 10.1 通用权限校验

涉及某个 `tripId` 的云函数，必须先检查：

1. `tripId` 是否存在。
2. 当前用户是否属于该旅行。
3. 当前用户是否有权限执行该操作。

推荐封装逻辑：

```js
async function getTripAndCheckMember(tripId, openid) {
  if (!tripId) {
    throw new Error('tripId 不能为空')
  }

  const tripRes = await db.collection('trips').doc(tripId).get()
  const trip = tripRes.data

  if (!trip) {
    throw new Error('旅行不存在')
  }

  if (!Array.isArray(trip.memberOpenids) || !trip.memberOpenids.includes(openid)) {
    throw new Error('你没有权限操作该旅行')
  }

  return trip
}
```

### 10.2 添加账单权限

`addExpense` 云函数必须校验：

1. 当前用户属于该旅行。
2. `payerOpenid` 属于该旅行。
3. 所有 `participantOpenids` 都属于该旅行。
4. `amount` 大于 0。
5. `title` 不为空。
6. `participantOpenids` 至少有一个成员。

### 10.3 添加行程权限

`addItinerary` 云函数必须校验：

1. 当前用户属于该旅行。
2. `title` 不为空。
3. `date` 不为空。
4. 只能向该旅行添加行程。

### 10.4 查看详情权限

`getTripDetail` 云函数必须校验：

1. 当前用户属于该旅行。
2. 未加入该旅行的用户不能查看详情。
3. 未加入该旅行的用户不能查看成员。
4. 未加入该旅行的用户不能查看账单概览。
5. 未加入该旅行的用户不能查看行程概览。

------

## 11. 云存储规范

第一版云存储可以暂时不实现。

后续如果添加图片、票据、头像等文件上传功能，使用云存储。

### 11.1 可存储的文件

可以使用云存储保存：

1. 旅行封面图。
2. 票据图片。
3. 行程截图。
4. 用户主动上传的图片。

### 11.2 云存储路径建议

推荐路径：

```text
trips/{tripId}/receipts/{timestamp}_{filename}
trips/{tripId}/images/{timestamp}_{filename}
users/{openid}/avatar/{timestamp}_{filename}
```

### 11.3 上传权限

上传与旅行相关的文件时，必须校验：

1. 当前用户属于该旅行。
2. 文件大小符合限制。
3. 文件类型符合要求。
4. 上传后的文件 ID 与对应业务数据关联。

### 11.4 注意事项

不要允许用户上传任意类型文件。

第一版如无必要，不要实现云存储，避免增加复杂度。

------

## 12. 金额计算规范

本项目涉及 AA 记账，金额计算需要谨慎处理。

### 12.1 输入单位

用户输入金额单位为：

```text
元
```

示例：

```text
12.50
```

### 12.2 内部计算单位

结算计算建议使用：

```text
分
```

原因：

JavaScript 浮点数计算可能出现精度误差。

例如：

```js
0.1 + 0.2 !== 0.3
```

### 12.3 转换方法

将元转换为分：

```js
function yuanToFen(amount) {
  return Math.round(Number(amount) * 100)
}
```

将分转换为元：

```js
function fenToYuan(fen) {
  return Number((fen / 100).toFixed(2))
}
```

### 12.4 展示格式

页面展示金额时统一保留两位小数：

```js
function formatMoney(amount) {
  return Number(amount || 0).toFixed(2)
}
```

展示示例：

```text
12.50 元
```

------

## 13. 结算算法规范

第一版只支持平均分摊。

### 13.1 输入数据

每笔账单包含：

```js
{
  amount: number,
  payerOpenid: string,
  participantOpenids: string[]
}
```

### 13.2 计算逻辑

1. 查询当前旅行所有账单。
2. 初始化每个成员：
   - `paid = 0`
   - `shouldPay = 0`
3. 遍历账单：
   - 付款人的 `paid` 增加账单金额。
   - 每个参与分摊成员的 `shouldPay` 增加 `amount / participantCount`。
4. 对每个成员计算：
   - `net = paid - shouldPay`
5. `net > 0`：该成员应收钱。
6. `net < 0`：该成员应付钱。
7. 用贪心算法生成最简转账方案。

### 13.3 贪心转账逻辑

伪代码：

```js
receivers = members where net > 0
payers = members where net < 0

i = 0
j = 0

while i < payers.length and j < receivers.length:
  payAmount = min(abs(payers[i].net), receivers[j].net)

  create transfer:
    from = payers[i].openid
    to = receivers[j].openid
    amount = payAmount

  payers[i].net += payAmount
  receivers[j].net -= payAmount

  if payers[i].net == 0:
    i++

  if receivers[j].net == 0:
    j++
```

### 13.4 结算输出

输出结构：

```js
{
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
}
```

页面展示时再把 `openid` 转换成用户昵称。

------

## 14. 错误处理规范

### 14.1 云函数错误处理

云函数内部使用 `try...catch`。

错误时返回：

```js
{
  success: false,
  data: null,
  message: err.message || '服务器错误'
}
```

### 14.2 前端错误处理

前端捕获错误后使用：

```js
wx.showToast({
  title: err.message || '操作失败',
  icon: 'none'
})
```

### 14.3 常见错误提示

| 场景           | 提示                   |
| -------------- | ---------------------- |
| 未登录         | 用户初始化失败         |
| 旅行不存在     | 旅行不存在             |
| 没有权限       | 你没有权限操作该旅行   |
| 邀请码错误     | 未找到对应旅行         |
| 重复加入       | 你已经加入该旅行       |
| 金额错误       | 金额必须大于 0         |
| 未选择付款人   | 请选择付款人           |
| 未选择分摊成员 | 请至少选择一位分摊成员 |
| 云函数失败     | 请求失败，请稍后重试   |
| 网络异常       | 网络异常，请稍后重试   |

------

## 15. 云函数清单

本项目 MVP 阶段至少需要以下云函数：

### 15.1 login

职责：

1. 获取当前用户 `openid`。
2. 查询 `users` 集合。
3. 如果用户不存在，则创建用户记录。
4. 如果用户存在，则更新 `updatedAt`。
5. 返回用户信息。

### 15.2 createTrip

职责：

1. 获取当前用户 `openid`。
2. 创建旅行。
3. 设置 `creatorOpenid`。
4. 将当前用户加入 `memberOpenids`。
5. 生成 `inviteCode`。
6. 写入 `trips` 集合。

### 15.3 joinTrip

职责：

1. 获取当前用户 `openid`。
2. 根据 `inviteCode` 查询旅行。
3. 将用户加入 `memberOpenids`。
4. 避免重复加入。
5. 返回旅行信息。

### 15.4 getMyTrips

职责：

1. 获取当前用户 `openid`。
2. 查询当前用户加入的所有旅行。
3. 返回旅行列表。

### 15.5 getTripDetail

职责：

1. 获取当前用户 `openid`。
2. 校验用户是否属于该旅行。
3. 查询旅行详情。
4. 查询成员信息。
5. 查询账单概览。
6. 查询行程概览。

### 15.6 addExpense

职责：

1. 获取当前用户 `openid`。
2. 校验用户是否属于该旅行。
3. 校验付款人是否属于该旅行。
4. 校验分摊成员是否属于该旅行。
5. 写入账单。

### 15.7 getExpenses

职责：

1. 获取当前用户 `openid`。
2. 校验用户是否属于该旅行。
3. 查询该旅行所有账单。
4. 返回账单列表和总金额。

### 15.8 addItinerary

职责：

1. 获取当前用户 `openid`。
2. 校验用户是否属于该旅行。
3. 添加行程项目。

### 15.9 getItinerary

职责：

1. 获取当前用户 `openid`。
2. 校验用户是否属于该旅行。
3. 查询该旅行所有行程。
4. 按日期和时间排序返回。

### 15.10 calculateSettlement

职责：

1. 获取当前用户 `openid`。
2. 校验用户是否属于该旅行。
3. 查询旅行成员。
4. 查询旅行账单。
5. 计算每个成员实付、应付、净额。
6. 生成最简转账方案。
7. 返回结算结果。

------

## 16. 数据库集合清单

### 16.1 users

用途：

存储用户信息。

字段：

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

### 16.2 trips

用途：

存储旅行信息。

字段：

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

### 16.3 expenses

用途：

存储账单信息。

字段：

```js
{
  _id: string,
  tripId: string,
  title: string,
  amount: number,
  payerOpenid: string,
  participantOpenids: string[],
  splitType: 'equal',
  note: string,
  createdBy: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 16.4 itinerary

用途：

存储行程信息。

字段：

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

------

## 17. 开发者工具操作提醒

Claude Code 在完成相关阶段后，应提醒用户在微信开发者工具中执行必要操作。

### 17.1 云函数相关

涉及云函数时，需要提醒用户：

1. 在微信开发者工具中确认云开发环境已开通。
2. 确认 `app.js` 中的 `env` 已替换为实际云环境 ID。
3. 右键云函数目录。
4. 选择上传并部署。
5. 如使用 npm 依赖，需要安装依赖并上传。
6. 在云开发控制台查看云函数日志。

### 17.2 数据库相关

涉及数据库时，需要提醒用户：

1. 在云开发控制台创建集合。
2. 创建集合：
   - `users`
   - `trips`
   - `expenses`
   - `itinerary`
3. 根据开发阶段配置合适的数据库权限。
4. 不要把生产环境权限设置得过于开放。
5. 测试时可以先通过云函数读写数据库。

### 17.3 调试相关

调试时应关注：

1. 小程序控制台。
2. 云函数调用结果。
3. 云函数日志。
4. 数据库集合是否写入成功。
5. 当前用户 `openid` 是否正确获取。
6. `env` 是否配置正确。

------

## 18. Claude Code 执行要求

Claude Code 在每次执行任务时必须遵守：

1. 先阅读 `PROJECT_SPEC.md`。
2. 再阅读 `CLOUD_DEV_GUIDE.md`。
3. 如果需要微信云开发 API 细节，优先读取官方文档链接。
4. 每次只完成当前指定阶段。
5. 不要一次性开发所有功能。
6. 修改代码前，先说明准备修改哪些文件。
7. 修改代码后，说明实际修改了哪些文件。
8. 修改代码后，说明如何在微信开发者工具中测试。
9. 如果遇到官方 API 不确定，不要编造。
10. 如果无法读取在线文档，应明确说明。
11. 保持代码简单、清晰、可运行。
12. 优先保证 MVP 核心闭环。

------

## 19. 本文档优先级

当多个文档之间出现冲突时，优先级如下：

```text
PROJECT_SPEC.md：决定产品功能和页面需求
CLOUD_DEV_GUIDE.md：决定云开发、安全、权限、后端实现方式
微信官方文档：决定 API 的真实用法和平台限制
Claude Code 自身判断：最低优先级
```

如果官方文档与本文档中的代码示例冲突，以微信官方文档为准。

如果 PROJECT_SPEC.md 与 CLOUD_DEV_GUIDE.md 冲突，应先指出冲突，再给出建议，不要直接强行实现。
