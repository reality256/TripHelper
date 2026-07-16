# 同行旅 V3.2 需求文档：账单/头像/权限修复

## 1. 背景

V3.2 是一次**修复性版本**，不新增功能。V3.0～V3.1 引入的预算管理、地图行程等功能在真机使用中暴露出三个深层 Bug，均涉及数据一致性和权限安全。本版本逐一修复根因而非绕过症状。

---

## 2. 头像系统修复

### 2.1 问题表现

多个页面（tripWorkspace、members、首页列表）中的用户头像在运行一段时间后全部显示为裂图（HTTP 403）。

### 2.2 根因分析

微信云存储的文件访问链路如下：

```
选择头像 → 本地临时路径 (wxfile://)
         → wx.cloud.uploadFile → cloud:// fileID (永久)
         → wx.cloud.getTempFileURL → HTTPS temp URL (带 sign 签名，2 小时有效)
```

**Bug 根因**：`saveProfile` 方法在用户保存个人资料时，将 `getTempFileURL` 返回的临时 HTTPS URL（含 `sign=` 签名参数）直接写入了 `users` 集合的 `avatarUrl` 字段。签名过期后，所有从数据库读取该 URL 的页面都请求失败，返回 403。

正确做法是数据库只存 `cloud://` 格式的永久 fileID，展示时再临时转换为 temp URL。

### 2.3 修复方案

**写入侧（tripWorkspace.js 资料弹窗）**：
- 新增 `hasNewAvatar` 标记，追踪用户是否通过 `wx.chooseAvatar` 选择了新头像
- 提交时反向判定上传条件：当前头像 URL 不是 `cloud://` 且不是已知的过期 temp URL → 视为需要上传的新本地路径
- 上传后取 `res.fileID`（`cloud://` 格式）存入数据库
- 未选新头像时，回退到数据库中已有的 `cloud://` fileID

**展示侧（tripWorkspace、members 页面）**：
- `loadTrip` / `loadMembers` 中收集所有 `cloud://` fileID，调用 `wx.cloud.getTempFileURL` 批量转换
- 转换后的 URL 标记 `fromFileMap: true`，与数据库中直接读出的过期 temp URL 区分
- 三步降级策略：
  1. `cloud://` fileID + 成功转换 → 使用新鲜 temp URL（`fromFileMap` 标记）
  2. `cloud://` fileID + 转换失败 → 降级为默认头像
  3. 数据库中的过期 temp URL（含 `sign=` 的 HTTPS）→ 降级为默认头像

**防御侧（全部 `<image>` 标签）**：
- 所有头像 `<image>` 增加 `binderror` 事件，加载失败时降级为默认头像或占位符

### 2.4 工具函数变更

`utils/user.js`：
- 新增 `isCloudFileID(url)` — 判断是否为 `cloud://` 永久文件 ID
- 新增 `isCloudTempUrl(url)` — 判断是否为 CloudBase 临时下载 URL（含 `sign=` 签名）
- 删除零调用函数：`getDisplayAvatar`、`batchConvertAvatars`、`resolveAvatarUrl`

### 2.5 app.json 补充权限声明

`app.json` 补充 `permission.scope.userLocation` 声明，这是 V3.0 中行程选址 `wx.chooseLocation` 正常运行的前提。缺少声明时在某些真机/基础库版本下会静默失败。

### 2.6 关键决策

| 决策 | 原因 |
|------|------|
| 数据库只存 `cloud://` fileID | 永久有效，不会过期 |
| 不做"自动刷新过期 URL" | 无法可靠判断哪个 URL 是"本应该过期的"，不如从源头切断 |
| 三步降级而非直接报错 | 头像非核心数据，不应阻塞页面渲染 |
| `fromFileMap` 标记区分来源 | 避免将新鲜 temp URL 误判为过期 URL |

---

## 3. 金额计算口径统一

### 3.1 问题表现

同一旅行的"总消费"在不同页面显示不一致：
- 账单 tab（前端 `calculateTotalExpense`）：正确扣减入账
- 账单列表（`getExpenses` 云函数 `totalAmount`）：纯累加，不入账扣减
- 旅行详情（`getTripDetail` 云函数 `expenseSummary.totalAmount`）：纯累加 + 未排除已删除账单

### 3.2 根因分析

V2.3 引入 `income`（入账）类型后，前端的 `utils/budget.js` 中 `calculateTotalExpense` 正确实现了"支出累加、入账扣减"逻辑，但两个云函数的 `totalAmount` 计算未同步更新，仍使用旧的纯累加逻辑。

此外 `getTripDetail` 的 `expenseSummary` 没有过滤 `deleted: true` 的软删除账单。

### 3.3 修复方案

**`getExpenses` 云函数**：
- `totalAmount` 改为 `expenses.reduce(sum + (type==='income' ? -amount : amount))`
- 与前端 `calculateTotalExpense` 完全一致

**`getTripDetail` 云函数**：
- `expenseSummary` 先 `.filter(e => !e.deleted)` 再计算
- `totalAmount` 同样改为支出 - 入账

### 3.4 统一后的计算口径

| 场景 | 计算方式 |
|------|---------|
| 账单 tab 总消费 | `calculateTotalExpense`（前端） |
| 预算卡片已花费 | 同上 |
| 预算设置页当前花费 | 同上 |
| 云函数 `getExpenses.totalAmount` | 同上（V3.2 修复） |
| 云函数 `getTripDetail.expenseSummary.totalAmount` | 同上（V3.2 修复） |
| 结算 `calculateSettlement` | 内部用分，支出 + 入账 -，排除 deleted |

全项目统一口径：**`expense` 计入、`income` 扣减、`deleted` 跳过**。

---

## 4. 死代码清理

### 4.1 删除 `utils/money.js`

- 全项目零引用
- 功能已被 `utils/budget.js` 和 `utils/amount.js` 替代
- 保留会造成未来维护者困惑（两个金额工具文件）

### 4.2 删除 `budget.js` 中 `refund` 类型遗留分支

V3 spec 最初设计了 `expense` / `refund` / `income` 三种类型，但实际实现时简化为 `expense` / `income` 两种。此前 `budget.js` 的 `calculateTotalExpense` 中保留了 `refund` 分支的条件判断，虽然从未被触发（数据库中无 `refund` 类型数据），但增加了阅读负担。

V3.2 后正式类型仅两种：`expense`（支出）、`income`（入账/退款）。

---

## 5. 结算防御性校验

### 5.1 问题

`calculateSettlement` 云函数遇到 `participantOpenids` 为空的账单时，`perPersonCents = amountInCents / 0` → `Infinity` → 所有 `shouldPay` 变为 `NaN` → 结算结果全部错误。此前云函数静默处理了此异常，用户看到的结算结果看似正常（有输出）但实际上完全错误。

### 5.2 修复

- 在计算前遍历所有有效账单，检测 `participantOpenids.length === 0` 的异常账单
- 发现时返回明确错误：`"存在 N 笔未设置参与人的账单，请先修正或删除后再结算"`
- 附带异常账单 ID 列表 `invalidExpenseIds`，方便用户定位
- 改为**拒绝计算**而非**静默跳过** — 安全原则：宁可明确报错也不输出错误结果

---

## 6. 修改清单

### 前端文件

| 文件 | 变更 |
|------|------|
| `miniprogram/app.json` | 补充 `permission.scope.userLocation` |
| `miniprogram/utils/user.js` | 新增 `isCloudFileID` / `isCloudTempUrl`，删除零调用函数 |
| `miniprogram/utils/budget.js` | 删除 `refund` 类型遗留分支 |
| `miniprogram/utils/money.js` | **删除** |
| `miniprogram/pages/tripWorkspace/tripWorkspace.js` | 头像上传修复 + 资料弹窗逻辑 |
| `miniprogram/pages/tripWorkspace/tripWorkspace.wxml` | 头像 `binderror` 降级 |
| `miniprogram/pages/members/members.js` | 头像展示批量转换 + 降级 |
| `miniprogram/pages/members/members.wxml` | 头像 `binderror` 降级 |

### 云函数

| 云函数 | 变更 |
|--------|------|
| `getExpenses` | `totalAmount` 改为支出 - 入账 |
| `getTripDetail` | `expenseSummary` 排除 deleted + 支出 - 入账 |
| `calculateSettlement` | 空参与人账单防御性检测 |

### 需要重新部署的云函数

`getExpenses`、`getTripDetail`、`calculateSettlement`

---

## 7. 经验教训

1. **云存储头像的正确模式**：数据库只存 `cloud://` fileID，展示时临时转换。任何将 temp URL 持久化的代码都是 Bug。
2. **金额计算必须有单一真相来源**：`calculateTotalExpense` 是唯一正确的计算方式，所有位置（前端 + 每个云函数）必须一致。后续新增统计功能时，优先复用而非重写。
3. **结算这类输出"钱数"的功能**：遇到异常数据时必须**拒绝计算+明确报错**，而不是静默跳过或输出看似正确的结果。用户按错误结果转账的后果远大于一个报错提示。
4. **删除文件前先全局搜索引用**：`utils/money.js` 的零引用状态应在更早版本就发现和清理。
