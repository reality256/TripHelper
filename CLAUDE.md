# 同行旅 (TripHelper) — Claude 快速上下文

## 项目定位
微信小程序原生 + 微信云开发。多人旅行协作工具：行程规划、AA 记账、预算管理、待办。

## 技术要点
- 前端：WXML / WXSS / JS（非 TypeScript，非 uni-app）
- 后端：微信云函数（Node.js），云数据库
- **金额处理**：`Number(x.amount) || 0`，内部以分为单位避免浮点误差
- **openid**：`cloud.getWXContext().OPENID`，禁止前端传入
- **权限校验**：前端显隐仅 UX，云函数必须二次校验

## 关键文件索引

### 入口
- `miniprogram/app.js` — 云环境 `cloud1-d3gp6kk8v7af7dc9b`
- `miniprogram/app.json` — 15 个页面注册

### 核心页面（V2+）
- `miniprogram/pages/tripWorkspace/tripWorkspace.*` — 旅行工作台（行程/账单/待办/设置四 tab）
- `miniprogram/pages/addExpense/addExpense.*` — 添加/编辑账单
- `miniprogram/pages/expenseDetail/expenseDetail.*` — 账单详情
- `miniprogram/pages/settlement/settlement.*` — 结算结果
- `miniprogram/pages/addItinerary/addItinerary.*` — 添加/编辑行程（含地图选址）
- `miniprogram/pages/schedule-map/schedule-map.*` — 地图全览
- `miniprogram/pages/budget-setting/budget-setting.*` — 预算设置
- `miniprogram/pages/members/members.*` — 成员管理

### 工具函数
- `miniprogram/utils/budget.js` — 总消费/预算计算（`calculateTotalExpense`）
- `miniprogram/utils/user.js` — `isCloudFileID()` / `isCloudTempUrl()` / `getDisplayName()`
- `miniprogram/utils/amount.js` — 金额校验
- `miniprogram/utils/schedule.js` — 行程分组/排序/冲突检测
- `miniprogram/utils/map.js` — 地图 marker/polyline 构建
- `miniprogram/utils/expenseCategory.js` — 6 种账单分类
- ~~`miniprogram/utils/money.js`~~ — 已删除（V3.2）

### 服务层
- `miniprogram/services/cloudService.js` — 云函数调用基础封装
- `miniprogram/services/*Service.js` — 各模块 API 封装

### 云函数（25 个）
关键云函数见 `cloudfunctions/` 目录，需关注：
- `calculateSettlement` — AA 结算（贪心算法，内部用分）
- `addExpense` / `updateExpense` / `deleteExpense` / `getExpenses` — 账单 CRUD
- `getTripDetail` — 旅行详情 + 账单概览 + 成员
- `updateUserProfile` — 昵称/头像更新
- `updateTripBudget` — 预算设置/清除

## 结算算法概要
1. 排除 deleted 账单，收集所有参与者（含 formerMemberOpenids）
2. 逐账单计算 paid（支出+、入账-）和 shouldPay（均分，余数分配前 N 人）
3. net = paid - shouldPay，正为应收、负为应付
4. 贪心匹配：债权人/债务人按 |net| 降序，min(应收, 应付) 生成转账

## 账单类型（V3.2 起）
仅两种：`expense`（支出）、`income`（入账/退款）。`refund` 已彻底删除。

## 头像系统（V3.2 修复后）
- 写入 DB：**只存 `cloud://` fileID**，绝不存 temp URL
- 展示时：`cloud://` → `getTempFileURL` 批量转换 → 新鲜 temp URL → `<image>` 渲染
- `fromFileMap` 标记区分新鲜 temp URL 和 DB 中的过期 temp URL
- 所有 `<image>` 有 `binderror` 降级

## 数据库集合
| 集合 | 关键字段 |
|------|---------|
| `users` | openid, nickName, avatarUrl(cloud://), profileCompleted |
| `trips` | name, memberOpenids, formerMemberOpenids, inviteCode, budget, status |
| `expenses` | tripId, title, amount, type(expense/income), category, payerOpenid, participantOpenids, deleted |
| `itinerary` | tripId, title, locationName, latitude, longitude, startTime, endTime |
| `todos` | tripId, title, assigneeOpenids, completed |

## 当前版本状态
V3.1 已完成。V3.2（2026-07-15）已完成账单/头像/权限修复。下一步最可能是 V3 spec 中「分类预算」功能。

## 协作方式
- 开发前先读 `spec/` 中对应需求文档
- 修改后更新 `CHANGELOG.md`
- 遵守 `spec/CLOUD_DEV_GUIDE.md` 的安全规范
- 部署云函数：右键 → 上传并部署：云端安装依赖



微信小程序平台思维

微信小程序平台以 Bug 多、官方维护不足而"闻名"。在调试时，应始终把"平台本身存在问题"作为一个重要假设，而不是最后才考虑的可能性。
    
    默认的调试思路：
    
        1. 在假设是我们代码出错之前，先问：这种行为是否符合已知的微信平台 Bug
           或限制？
        2. 优先搜索已有问题：社区论坛（v2ex、掘金、segmentfault）、Taro 的
           GitHub issues，以及微信开放社区（developers.weixin.qq.com）——
           很多官方 Bug 报告多年都没有解决。
        3. 如果行为无法解释、只在特定环境出现（例如 iOS vs Android、开发者工具
           vs 真机），或者难以稳定复现——应高度怀疑是平台 Bug。
    
    微信平台已知的不可靠类别：
    
        iOS 与 Android 差异：CSS 渲染、JS 引擎行为、API 返回值在两端经常不同，
        必须同时测试。
    
        开发者工具 vs 真机：开发者工具基于 Chromium，而真机使用定制 JS 引擎
        （Android 为 V8，iOS 为 JavaScriptCore）。很多问题只会在真机上出现。
    
        API 不一致：同一个 API 在不同基础库版本下，返回结构或错误码可能不同。
        不要盲信文档——一定要以实际行为为准。
    
        基础库版本碎片化：用户可能使用不同版本的基础库。在某个版本修复的问题，
        可能在另一个版本出现新的问题。
    
        分包 / 异步加载问题：分包加载、预加载、独立分包存在已知的竞态条件和
        生命周期 Bug。
    
        Canvas / WebGL：非常脆弱，在不同设备和系统版本之间存在渲染差异。
    
        存储与文件系统 API：配额限制、错误码和异步行为不一致。
    
    以变通方案为先的文化：一旦确认或怀疑是平台 Bug，目标应是找到可行的变通方案，
    而不是等待官方修复（大概率不会发生）。