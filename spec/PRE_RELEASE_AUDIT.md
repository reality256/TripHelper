# 同行旅 TripHelper — Release Candidate 上线前全面审计报告

> 审计日期：2026-09-02
> 审计方式：6 个独立只读审计 agent 分域并行（云函数权限安全 / 金额与结算 / 行程与地图 / 待办成员头像 / UI性能代码质量 / 配置生产环境），交叉验证后汇总去重。
> 审计基准：工作区当前状态（HEAD = 4e7ad84 "V4 Warp Up"，25 个云函数、10 个注册页面）。
> 本次审计**未修改任何业务代码**。修复方案待确认后分阶段执行。

---

## 总结论

- **核心结算算法经逐行验证正确**：分单位整数运算、余数分配、贪心匹配、income 符号与转账方向均守恒，无浮点误差导致的资金错误。
- **权限模型整体健康**：25 个云函数全部从 `cloud.getWXContext().OPENID` 服务端取身份，零信任前端传入 openid；trip 级读写均有成员校验；跨旅行 IDOR（expenseId/itineraryId/todoId）均被 `tripId` 归属拦截。
- **发现 1 个 P0**：隐私授权流程缺失——新用户首启时 `wx.chooseLocation` 直接失败且无任何同意路径。
- **4 个 P1**：查询 100 条静默截断（账单金额算错）、解散旅行后数据仍可写、地图日期竞态、编辑行程失败可覆盖原数据。
- 其余为 P2（14 条）/ P3（34 条）及人工检查清单。

---

## P0 — Blocker（上线前必须解决）

### [P0] 隐私授权流程完全缺失：新用户首启定位选址直接失败，无同意路径

位置：`miniprogram/app.js:8-44`（全项目无 `onNeedPrivacyAuthorization` / `requirePrivacyAuthorize` / `getPrivacySetting` 任何调用）

问题：基础库 2.32.3+ 强制隐私协议后，用户未同意《用户隐私保护指引》时，`wx.chooseLocation` 直接 fail（errno 104/112 类），平台**不会自动弹窗**——弹窗必须由开发者实现。本项目完全未接入隐私授权流程，用户也无从进入设置页面补救。

触发条件：任何新用户首次启动小程序 → 添加行程点「选择地图地点」（或地图页 `show-location` 定位）。

影响：上线后**每一位新用户的行程选址功能永久不可用**（addItinerary 的 fail 分支只 toast「地图选址失败」，无引导），这是核心卖点功能；同时是隐私合规审核的高危项。

原因：V3 系列迭代从未接入微信隐私协议 API（2023-09 平台强制后未跟进）。

建议修复方案：`app.js` 中实现 `wx.onNeedPrivacyAuthorization`（弹出隐私同意弹窗，同意后 `resolve` 继续原流程）；或在 `chooseLocation` 的 fail 分支识别隐私类 errMsg 并 `wx.showModal` 引导调用 `wx.requirePrivacyAuthorize`。同时确保公众平台《用户隐私保护指引》已声明「位置信息」并通过审核。

修复风险：低。需配合后台隐私指引配置。

置信度：High

---

## P1 — Critical（强烈建议上线前解决）

### [P1] 列表查询无分页：单旅行数据超 100 条静默截断，账单/结算金额算错

位置：
- `cloudfunctions/getExpenses/index.js:42-44`（账单列表 + totalAmount）
- `cloudfunctions/getTripDetail/index.js:64-66`（概览 + expenseSummary）
- `cloudfunctions/calculateSettlement/index.js:42-44`（结算）
- `cloudfunctions/getItinerary/index.js:41-45`（行程）
- `cloudfunctions/getTodos/index.js:24-27`（待办）
- `cloudfunctions/getMyTrips/index.js:25-30`（我的旅行）

问题：云函数端 `.get()` 默认每批最多 100 条，以上 6 处均无 `.limit()` 无分页；且账单侧的 `deleted` 过滤发生在截断**之后**（软删账单还会挤占活账单配额）。

触发条件：单旅行账单（含软删）>100 笔（多人 10 天旅行每日 4-5 笔即达）；行程/待办同理。

影响：**结算只对前 100 条计算**——超出账单静默遗漏，成员收支与转账金额错误（金钱分配错误）；列表、总消费、预算已花费同样少算；旧账单从列表"永久消失"且无任何提示。

原因：按"全量取出"假设编写，未处理平台 100 条上限；过滤顺序错误。

建议修复方案：账单三处（getExpenses/getTripDetail/calculateSettlement）改为分页循环拉全量（`.limit(1000)` + `_id` 游标），where 中先排除 `deleted: true`（兼容无字段旧数据用 `_.or([{deleted:false},{deleted:_.exists(false)}])`）；行程/待办/我的旅行至少 `.limit(1000)` 兜底。

修复风险：低，纯查询逻辑。

置信度：High

### [P1] 解散旅行后数据仍可写入/读取，邀请码仍可加入

位置：
- 缺 `status === 'dissolved'` 校验：`cloudfunctions/addTodo:20`、`updateTodoStatus:20`、`deleteTodo:19`、`getTodos:18`、`addExpense:52`、`getExpenses:34`、`calculateSettlement:35`、`addItinerary:43-54`、`deleteItinerary:28-51`、`getItinerary`
- `cloudfunctions/joinTrip:35-64`（未校验 status）；`cloudfunctions/dissolveTrip:45-52`（不清 inviteCode）
- 对照（已校验，规则不统一）：`updateExpense:27`、`deleteExpense:21`、`updateItinerary:30`、`getExpenseDetail:21`、`updateTripBudget:36`、`leaveTrip:45`、`removeMember:21`

问题：`dissolveTrip` 只软删除（`status='dissolved'`，不清 `memberOpenids`），多数 CRUD 云函数只查成员不查状态；`joinTrip` 对已解散旅行照常放行且解散不清邀请码。

触发条件：创建者解散旅行后，其他成员设备上仍打开的工作台可继续操作（后续读写直连云函数，不再经过 getTripDetail 的解散拦截）；任何人持邀请码调用 joinTrip。

影响：UI 承诺「行程、账单和待办将不可再使用」，实际解散后仍可增删账单/待办/行程、计算结算，数据持续变动；被加入解散旅行的用户 openid 写进 memberOpenids 形成脏数据（getMyTrips 又过滤掉它，用户「加入成功但什么都看不到」）。

原因：软删除方案下各云函数校验清单不统一，复制粘贴遗漏。

建议修复方案：补齐上述 10 个函数的状态校验；`joinTrip` 查到后校验 `trip.status !== 'dissolved'`；`dissolveTrip` 同时清空 `inviteCode`。双保险可选：解散时清空 `memberOpenids`（结算依赖的是账单内嵌 participantOpenids，不受影响）。

修复风险：低。

置信度：High

### [P1] schedule-map 日期切换竞态：旧日期数据覆盖新日期

位置：`miniprogram/pages/schedule-map/schedule-map.js:55-136`（renderMap）、`:145-201`（fetchRealDistances）、`:203-208`（loadMapForDate）

问题：`loadData`/`loadMapForDate` 无请求代际（generation）隔离。切日期时上一轮的 `getItinerary` 与 N 个 `getRouteDistance` 请求晚到后，直接 `setData` 用旧日期数据覆盖当前地图（markers/polyline/summary 距离时间）。

触发条件：快速连续切换日期 + 慢网/云函数冷启动，几乎必现。

影响：地图显示 A 日期路线、标题却是 B 日期；兜底 polyline 取的是新日期 points 与旧距离拼接，数据错配，用户可能据此规划行程。快速切换还产生大量并发云调用（费用/限流）。

原因：异步回调无批次标记、无过期响应丢弃。

建议修复方案：引入 `this._mapReqSeq++` 请求序号，`loadData`/`renderMap`/`fetchRealDistances` 回调入口比对序号，过期响应直接丢弃。

修复风险：低。

置信度：High

### [P1] addItinerary 编辑模式加载失败后，空白表单可直接提交覆盖原行程

位置：`miniprogram/pages/addItinerary/addItinerary.js:39-76` + `addItinerary.wxml:4-6`

问题：编辑行程时 `loadItineraryDetail` 失败仅 toast + `loading:false`，表单以全空状态渲染且无错误 UI、无重试；此时用户重新填写标题+日期提交，走 update 分支用**残缺数据覆盖原行程**（丢失地点坐标、时间、备注）。

触发条件：编辑行程时 getItinerary 请求失败（弱网/超时）。

影响：用户数据（地图坐标、时间安排）被静默清空覆盖，不可恢复。对比 addExpense 编辑失败会 `navigateBack`，本页处理不一致。

原因：失败路径只清了 loading 标志，未阻止提交。

建议修复方案：失败时显示 `ui-error` + 重试（保持不可提交）；或仿 addExpense 直接 `navigateBack`；提交前校验 `!isEdit || 详情已成功加载`。

修复风险：低。

置信度：High

---

## P2 — Major（可以上线，但建议解决）

### [P2] 服务端金额无上限校验，可写入 Infinity/NaN 污染结算

位置：`cloudfunctions/addExpense/index.js:28-35`、`updateExpense/index.js:17-19`、`updateTripBudget/index.js:23-29`；对照前端 `miniprogram/utils/amount.js:57-59`（上限 99,999,999.99）

问题：前端校验上限，服务端只有 `>0` + 两位小数正则。正则允许任意长度数字串，`Number('9'.repeat(400))` → `Infinity` 入库。

触发条件：恶意成员直连云函数传超长数字金额（UI 路径不可触发）。

影响：totalAmount 显示 Infinity；结算中 `amountInCents=Infinity` → `net = Infinity - Infinity = NaN` → balances 全 NaN，该旅行结算永久不可信。

原因：前后端校验规则不同步。

建议修复方案：三处补 `> 99999999` 拒绝；`calculateSettlement:97` 对 `Number(exp.amount)` 做 `isFinite` 兜底防御。

修复风险：低。

置信度：High

### [P2] 历史 `type='refund'` 账单未迁移，V3.2 后被当作支出计入

位置：`miniprogram/utils/budget.js:42-54`；`cloudfunctions/getExpenses:49-52`、`getTripDetail:70-73`、`calculateSettlement:101`（均只识别 `income`，非 income 一律加）

问题：V3.0/V3.1 可创建 `refund` 账单；V3.2 删除 refund 分支时**只改代码、无数据迁移**。存量 refund 现在在所有计算点被当支出累加。

触发条件：线上库存在 V3.2 之前的 refund 记录。

影响：退款从「扣减」翻转为「计入」，总消费/预算/结算系统性高估对应金额，且四处行为一致无法对照发现。

原因：类型收敛未同步迁移数据。

建议修复方案：先人工查询线上数据（见人工检查清单第 9 项）；若存在 refund 记录，一次性脚本改写为 `type='income'` 并核对 payer/participant 语义。

修复风险：中（改写前需核对语义）。

置信度：Medium（取决于数据是否存在）

### [P2] 腾讯地图 WebService Key 硬编码且已进入 git 历史

位置：`cloudfunctions/getRouteDistance/index.js:7`（`const MAP_KEY = '4X5BZ-...'`，自 V3.0 提交 8890c40 起存在于历史）

问题：真实可用 key 明文入库。任何拿到仓库的人可持 key 直接调用腾讯位置服务，消耗配额产生费用。

触发条件：仓库公开/泄露（历史不可擦除）。

影响：配额盗刷、费用损失；可挤占 getRouteDistance 正常用量导致路线功能失败。

原因：无密钥管理。

建议修复方案：改为 `process.env.MAP_KEY`（云开发控制台配置环境变量）并**作废换新 key**；腾讯控制台设置调用限额告警。需重部署云函数。

修复风险：低。

置信度：High（事实）；影响取决于仓库可见性

### [P2] updateUserProfile/login 写入 avatarUrl 未校验 cloud:// fileID

位置：`cloudfunctions/updateUserProfile/index.js:45-47`、`login/index.js:34-39`

问题：`avatarUrl !== ''` 即写库，无 `cloud://` 前缀/长度校验；前端校验仅为 UX 可绕过。

触发条件：恶意客户端直传任意字符串/外部 URL/过期 temp URL。

影响：违反 V3.2 铁律「DB 只存 cloud://」；其他成员渲染其头像失败或加载外部地址（可作追踪像素）；数据污染不可自动恢复。

原因：V3.2 只修了读取端，写入端遗漏。

建议修复方案：服务端校验 `cloud://` 前缀 + 长度上限，否则忽略/拒绝该字段。

修复风险：低。

置信度：High

### [P2] 行程权限自相矛盾：updateItinerary 限创建者、deleteItinerary 任意成员可删，且前端全员可见编辑入口

位置：`cloudfunctions/updateItinerary/index.js:41-43`（需 createdBy/creatorOpenid）、`deleteItinerary/index.js:37-54`（仅成员）；UI：`tripWorkspace.wxml:58,63`（无 gating）

问题：普通成员编辑他人行程 → 提交被拒「没有权限」（功能故障）；同一资源删除却放行。删/改权限不对称，与账单模块（前端 canManage 与云函数一致）明显不一致。

触发条件：普通成员点任意行程卡片进入编辑页提交；管理模式下删除他人行程。

影响：越权删除他人行程（若产品意图是仅创建者可删）；UI 与云函数权限不一致造成困惑。

原因：V3.1/V3.2 迭代中 updateItinerary 加了归属校验而 deleteItinerary 未同步，前端也未同步。

建议修复方案：产品明确规则后，deleteItinerary 与 updateItinerary 采用同一套校验（建议统一「创建者或旅行创建者」），wxml 按 createdBy/creatorOpenid 隐藏入口。

修复风险：中（改严会拒绝目前合法操作，需产品确认）。

置信度：High（代码事实）；产品意图为推断

### [P2] joinTrip 非原子读改写：并发加入丢失成员

位置：`cloudfunctions/joinTrip/index.js:56-64`

问题：读出 `memberOpenids` 数组 → push → 整体 update 覆盖。两人同时加入同一旅行时，后写者覆盖先写者，一人从 memberOpenids 丢失。

触发条件：两名用户几乎同时输码加入（朋友约好同时操作）。

影响：丢失方收到 success=true 和 tripId，但云端成员列表里没有他，进入工作台被「你没有权限」拦截，需重新加入。

原因：读-改-写非原子；未用 `db.command.push` 或事务。

建议修复方案：`db.command.push`（配合先查重）或事务；leaveTrip/removeMember 的数组改写同理加固。

修复风险：中（事务并发冲突需重试逻辑）。

置信度：High（代码明确）；触发概率中等

### [P2] 冷启动 login 竞态：user 未就绪导致创建者管理入口与资料弹窗缺失

位置：`tripWorkspace.js:142-144`（一次性读 `globalData.user/openid`）+ `app.js:26-44`（login 异步无回调）；WXML 门控：`:334/:341/:348/:109`（`trip.creatorOpenid === myOpenid`）、`:239`（资料弹窗）

问题：login 响应晚于 getTripDetail 时（首启冷启动/弱网），myOpenid 为空字符串，创建者看不到「解散旅行」「移除成员」「设置预算」入口，资料完善弹窗也不弹；无重试机制，只能退出重进。

触发条件：首次冷启动 + login 响应晚于详情响应；login 失败时同样。

影响：创建者被剥夺管理入口（云端仍拦截，非安全漏洞，属功能缺失）。

原因：login 无 Promise/回调透出，页面一次性快照。

建议修复方案：`app.js` 暴露 `initUser()` 的 Promise，tripWorkspace 在 user 为空时等待 login 完成后再初始化；或 login 完成后触发页面重新同步。

修复风险：低。

置信度：Medium（竞态窗口小但真实）

### [P2] 已退出成员在账单/待办显示「未知」，与结算结果姓名不一致

位置：`tripWorkspace.js:136-140`（memberMap 仅当前成员）、`:482`（付款人）、`:613`（负责人）；对照 `calculateSettlement:128-136`（按参与者全量查 users，姓名正常）

问题：memberMap 只由 getTripDetail 返回的当前成员构建，former 成员不在其中。

触发条件：成员退出/被移除后，其付款的账单、负责的待办仍被其他人查看。

影响：列表页显示「付款人：未知」「负责人：未知」，而同一数据的结算结果姓名正常；memberCount（预算人均）只含当前成员，与结算（含 former）口径分叉。

原因：getTripDetail 未返回 former 成员的用户信息。

建议修复方案：getTripDetail 增加 former 成员的 openid→昵称映射返回，前端合并进 memberMap。

修复风险：低。

置信度：High

### [P2] 邀请码 36^6 空间且无频率限制，可被暴力枚举泄露旅行数据

位置：`cloudfunctions/createTrip/index.js:12-19`（`Math.random()` 6 位大写字母+数字）；`joinTrip`（无限次尝试、无失败计数）

问题：邀请码 36^6 ≈ 21.8 亿组合，无速率限制；加入即可看到旅行全部账单（金额/付款人/参与人）、行程、待办。

触发条件：攻击者脚本持续枚举 joinTrip。

影响：旅行敏感数据泄露；风险随旅行数量线性上升。

原因：邀请制缺少防护；`Math.random()` 非密码学随机。

建议修复方案：改用 `crypto.randomInt`；joinTrip 对同一 openid 失败次数限流；可考虑 8 位码。

修复风险：低。

置信度：Medium

### [P2] 主包 1.15MB 未引用模板图片，占 2MB 限额 85%

位置：`miniprogram/images/` 根目录 21 个文件 + `icons/` 16 个文件（云开发 quickstart 模板截图，全量 grep 确认零引用）

问题：主包实测约 1.7MB，其中约 1.15MB 为死图片（ai_example1.png 218K、create_cbr.png 312K、create_cbrf.png 193K 等），无分包配置。

触发条件：每次上传/下载。

影响：占 2MB 限额 85%，任何功能增量都可能撞线；下载与启动变慢。当前版本可正常上传，不阻断本版发布。

原因：模板初始化遗留，历次重构未清理。

建议修复方案：删除未引用图片（保留 11 个 SVG + markers/pin-*.png 21 张），主包可降至约 500KB。

修复风险：低（已静态核对零引用；`utils/map.js:61` 动态拼接 `pin-N.png`，markers/ 必须保留）。

置信度：High

### [P2] expenseDetail 编辑账单返回后不刷新，展示过期金额

位置：`miniprogram/pages/expenseDetail/expenseDetail.js:26-52`（仅 onLoad，无 onShow）

问题：详情页 → 编辑账单 → 保存返回，详情页仍显示旧金额/旧标题/旧分摊人。

触发条件：编辑账单后返回（正常高频操作）。

影响：用户看到保存前的金额；后续删除/再编辑基于过期认知。金额展示类页面显示过期数据属上线前必查项。

原因：缺少与 tripWorkspace 一致的 onShow 刷新。

建议修复方案：`onShow` 中重新 `loadDetail()`（可静默刷新避免 loading 闪烁）。

修复风险：低。

置信度：High

### [P2] 表单与设置页加载失败四态缺失（多处）

位置：`addExpense.js:75-94`（成员加载失败静默吞掉、编辑回显继续、成员区空仍可提交）；`addTodo.js:19-32`（成员失败仅 toast）；`budget-setting.wxml`（loadData 失败渲染空白可提交表单）；`tripWorkspace.js:723-739`（loadMyTrips 失败完全静默）

问题：V4 统一了 `ui-error` 样式但未落实到这些页面的加载路径；无重试入口。

触发条件：各请求失败（弱网/超时）。

影响：addExpense 编辑模式看不到分摊人却可提交（用旧值）；addTodo 提交被「请至少选择一位负责人」拦截但找不到负责人列表；budget-setting 失败后可提交（云端会拒绝但体验差）；设置 tab 我的旅行列表无感知失败。

原因：四态覆盖不完整。

建议修复方案：统一补 `loadError` + 重试按钮，复用 `ui-error`；addExpense 编辑模式成员失败应中断回显。

修复风险：低。

置信度：High

### [P2] saveProfile 无 submitting 锁，连点重复上传头像

位置：`tripWorkspace.js:894-974`（其余所有提交入口均有锁，唯独资料保存遗漏）

问题：连点「保存」重复调用 `wx.cloud.uploadFile` 与 `updateUserProfile`；`Date.now()` 使每次上传产生不同 fileID，云端留下孤儿头像文件。

触发条件：选择新头像后快速连点保存。

影响：重复上传、重复保存、存储浪费。

原因：保存路径遗漏锁。

建议修复方案：加 `this._saving` 锁，成功/失败路径释放。

修复风险：低。

置信度：High

### [P2] index 首页无 Loading/Error 态：失败误显「还没有旅行记录」

位置：`miniprogram/pages/index/index.js:53-60` + `index.wxml:9-12`

问题：`loadTrips` 失败仅 console.error；无 loading/error 字段。加载中 `trips=[]` 直接渲染空态。

触发条件：网络慢（每次进首页先闪空态）或 getMyTrips 失败。

影响：慢网下首页闪烁「还没有旅行记录」；失败后呈现与真实数据相反的结论，且无重试入口。对新用户空态正确，对老用户失败场景误导。

原因：V2 重构时首页状态管理未跟上。

建议修复方案：增加 `loading`/`error` + 重试，按 ui-loading → ui-error → 空态三态渲染。

修复风险：低。

置信度：High

---

## P3 — Minor（可延后）

### [P3] 结算对脏数据防御不完整（缺付款人 TypeError、amount NaN 静默吞掉）
位置：`calculateSettlement/index.js:97,103-110`。空参与人已有带 ID 列表的明确报错，但 `payerOpenid` 缺失时 `balanceMap[''].paid += ...` 直接 TypeError（外层 catch 只返回笼统错误无法定位）；`amount` 缺失时 `Number(undefined)*100=NaN`，该笔被静默排除且无提示。建议与空参与人同样收集账单 ID 明确返回。置信度：Medium。

### [P3] getRouteDistance 无超时配置
位置：`cloudfunctions/getRouteDistance/`（无 config.json，默认 3 秒超时）；`index.js:47-100`（https.get 无 timeout）。冷启动+外部 API 往返易超 3s，驾车路线频繁降级为直线兜底。建议补 `config.json {"timeout": 10}` + `req.setTimeout(8000)`。置信度：Medium。

### [P3] 查询错误被吞成空列表，缺索引时静默「暂无」
位置：`getTodos:29-31`、`getItinerary:47-49`、`getExpenses:53-55`、`getTripDetail:78-80,92-94`、`calculateSettlement:47-49`。catch 捕获所有错误（含缺复合索引）返回 success+空数组，用户无法区分「真没有」与「查询失败」。建议仅对集合不存在类错误码走空分支，其余透出。置信度：Medium。

### [P3] 字段无长度上限，可写入超大文本与超大金额
位置：addExpense/addItinerary/addTodo/createTrip 各云函数。建议 title ≤ 50、note ≤ 200、location ≤ 100、name/destination ≤ 30（配合 P2 金额上限）。置信度：High。

### [P3] 行程坐标与时间无格式/范围校验
位置：`addItinerary:33-41,64-65`、`updateItinerary:20-24`。latitude 无 [-90,90] 范围校验（非法值被 `||0` 静默变 0,0 坐标）；startTime 用 split+parseInt，"abc" 可整体通过；updateItinerary 用字符串比较时间（"9:00">"10:00" 误拒合法时段）。建议两端统一正则 `^([01]\d|2[0-3]):[0-5]\d$` + 分钟换算比较。置信度：High。

### [P3] 经纬度 0 被判为无地点
位置：`utils/map.js:23-27`、`utils/schedule.js:153-155`、`addItinerary.js:61`。`!!(latitude && longitude)` 在赤道/本初子午线恒 false。建议改 `typeof === 'number' && !isNaN()`。国内行程不触发，概率低。置信度：High（逻辑）/低（触发）。

### [P3] 冲突检测索引错位：有无时间行程时冲突标记挂错对象
位置：`utils/schedule.js:103-120`（itemAIndex/itemBIndex 是过滤后数组索引）+ `tripWorkspace.js:355-368`（按原数组索引消费）。会出现「与自身冲突」文案。建议返回原数组下标或按对象引用映射。置信度：High。

### [P3] 无时间行程排每日最前成为路线起点
位置：`utils/schedule.js:30-37`。空 startTime 字典序最小。建议明确策略：无时间行程排末尾。置信度：High。

### [P3] 切换日期后 summary 残留上一日期距离/时长
位置：`schedule-map.js:55-136`（hasRoute=false 与空日期早退分支不重置 summary/schedules）。建议 renderMap 开头统一重置。置信度：High。

### [P3] 日期 picker 的 value 从未赋值，重开始终高亮第一项
位置：`schedule-map.wxml:13`（`value="{{selectedDateIndex}}"`，JS 全文件无此字段）。建议 onDateChange 时 setData。置信度：High。

### [P3] sortSchedulesByTime 比较器不一致律
位置：`utils/schedule.js:35`（createdAt 相等/缺失返回 1）。iOS/Android 排序可能不一致，序号两端不同。建议相等返回 0。置信度：High。

### [P3] 兜底直线 8 位 hex 兼容性
位置：`schedule-map.js:126`（`'#2E8B5788'`）。低版本基础库/部分 Android 可能不渲染。建议 6 位色或 rgba。置信度：Medium。

### [P3] 驾车距离 NaN 防御缺失
位置：`getRouteDistance:59-84`、`schedule-map.js:162-199`。上游字段异常时展示「NaN km」。建议云函数 `Number.isFinite` 校验 + 前端防御。置信度：Medium。

### [P3] 拒绝定位授权无引导
位置：`addItinerary.js:101-105`（fail 仅 toast「地图选址失败」）。建议识别 auth deny 弹窗引导 `wx.openSetting`；地图页 show-location 授权失败静默。置信度：High。

### [P3] login 与 updateUserProfile 职责重复，login 是校验更松的第二写入入口
位置：`login/index.js:34-39,48-57`。建议 login 只做查/建用户，删除更新分支。置信度：High。

### [P3] 头像文件永不清理，存储持续膨胀
位置：`tripWorkspace.js:941-947`（`avatars/{openid}_{Date.now()}.png`）。建议保存成功后异步删除旧 fileID。置信度：High（事实）/影响 Low。

### [P3] saveProfile 对过期 temp URL 分支实际仍写回原值（注释与行为不符）
位置：`tripWorkspace.js:966-969`。建议改为跳过 avatarUrl 字段。置信度：High。

### [P3] 邀请码 10 次重试耗尽后仍使用重复码
位置：`createTrip/index.js:54-61`。概率极低。建议耗尽时返回失败。置信度：Low（触发）/High（事实）。

### [P3] login 默认昵称用全集合 count()，并发注册重名
位置：`login/index.js:48-49`。建议改「旅友」+ openid 后 4 位，与 utils/user.js 降级逻辑一致。置信度：High。

### [P3] 「旅友????」为字面乱码
位置：`tripWorkspace.wxml:317`（原 emoji 编码失败变 4 个 ASCII 问号）。建议改用 `getDisplayName` 或「未命名旅友」。置信度：High。

### [P3] toggleTodo 无并发控制（last-write-wins）
位置：`updateTodoStatus/index.js:29-39`。协作待办常见模式，可接受；如需严格可事务。置信度：High（事实）/影响 Low。

### [P3] 提交按钮无禁用视觉态
位置：addExpense/addItinerary/addTodo/createTrip 提交按钮（joinTrip/budget-setting 已绑定）。建议统一 `{{submitting ? 'btn-disabled' : ''}}`。置信度：High。

### [P3] budget-setting 输入框 focus 绑定导致键盘反复弹出
位置：`budget-setting.wxml:58`（`focus="{{!hasBudget}}"`，每次渲染聚焦）。建议首次聚焦后置位。置信度：Medium。

### [P3] index 底部按钮无 safe-area 适配
位置：`index.wxss:65-69`。建议 `padding-bottom: calc(56rpx + env(safe-area-inset-bottom))`。置信度：Medium。

### [P3] 切 tab 不刷新协作数据（懒加载副作用）
位置：`tripWorkspace.js:253-266`（switchTab 仅首次加载）。成员已加载过账单 tab 后，创建者改预算/他人加账单，切回不刷新。建议切到已加载过的 tab 时静默刷新（复用 silent 路径）。置信度：High。

### [P3] 总消费负数钳制口径分裂
位置：`utils/budget.js:53`（前端钳 ≥0）vs `getExpenses:63`、`getTripDetail:76`（云函数不钳制）。当前云函数 totalAmount 无人消费，属潜伏分歧。建议统一语义（推荐不钳制）。置信度：High。

### [P3] 创建类云函数无幂等保护
位置：createTrip/addExpense/addItinerary/addTodo。前端锁挡连点，挡不住「请求成功但响应丢失后重试」的重复创建。建议可选 clientRequestId 去重，上线后观察。置信度：Medium。

### [P3] 重复请求无 in-flight 去重
位置：`index.js:10-26`（onLoad/onShow 双发）、`tripWorkspace.js:90-128,253-293`（loadTrip 回调/onShow/下拉/首次切 tab 可并发）。数据不污染但浪费。建议加 `if (this._loadingXxx) return`。置信度：Medium。

### [P3] console.log 残留（含 openid 打印）
位置：`app.js:19,37`（打印 openid）、`tripWorkspace.js:940,946`。建议删除或 debug 开关；console.error/warn 保留。置信度：High。

### [P3] 死代码包
- `utils/format.js` 整文件零引用
- `utils/budget.js` 5 个零引用函数（calculateNetExpense/calculateIncomeTotal/calculateGrossExpense/calculateCategoryCosts/calculateCategoryBudgetStats——分类预算预留，可保留）
- `utils/schedule.js` isUpcomingSoon/getConflictText、`utils/map.js` hasEnoughForRoute、`utils/user.js` getDisplayName、`utils/date.js` getToday 零引用
- `tripWorkspace.js:319` 死变量 hasEndTime
- `tripWorkspace.wxss` 死样式：`.loading-state` 重复定义两遍（880/891）、`.total-card` 系（450-466）、`.tab-placeholder` 系（853-877）
- `images/` 1.15MB 死图片（见 P2，勿删 markers/ 与 tab-*.svg）

### [P3] project.config.json 基础库版本不一致与模板残留
位置：`project.config.json:49`（libVersion 2.20.1）vs `project.private.config.json:24`（3.16.2）；`:48,51,66-70`（projectname "quickstart-wx-cloud"、condition 引用不存在的 databaseGuide 页、cloudfunctionTemplateRoot 指向不存在目录）。建议同步 libVersion ≥3.16.2、清理模板字段。置信度：High。

### [P3] uploadCloudFunction.sh 失效模板脚本
位置：项目根 `uploadCloudFunction.sh`（引用不存在的 quickstartFunctions）。建议删除或重写。置信度：High。

### [P3] 单云环境无隔离（开发/生产同库）
位置：`app.js:15`（env 硬编码唯一环境）。个人项目可接受；建议中期按 `__wxConfig.envVersion` 切环境 + 备份策略。置信度：High。

### [P3] CLAUDE.md 文档漂移（云函数 24 → 25 个）
位置：`CLAUDE.md:42`。建议同步。置信度：High。

---

## 索引建议（未建立，仅建议）

| 集合 | 建议索引 | 服务查询 |
|------|---------|---------|
| `expenses` | (tripId, createdAt) | getExpenses orderBy createdAt desc |
| `expenses` | (tripId) | calculateSettlement、getTripDetail 概览 |
| `todos` | (tripId, completed, createdAt) | getTodos 双 orderBy |
| `itinerary` | (tripId, date, startTime) | getItinerary 双 orderBy |
| `trips` | (memberOpenids, updatedAt) | getMyTrips orderBy updatedAt desc |
| `trips` | (inviteCode) | joinTrip、createTrip 查重 |
| `users` | (openid) | login、updateUserProfile、calculateSettlement 的 in() |

## 隐私相关 API 清单（供隐私指引配置）

| API / 组件 | 位置 | 用途 | 声明状态 |
|---|---|---|---|
| `wx.chooseLocation` | addItinerary.js:87 | 行程选址 | `requiredPrivateInfos` ✅；`permission.scope.userLocation` ✅；**隐私授权流程缺失（P0）** |
| `<map>` 组件 `show-location` | schedule-map.wxml:19-28 | 显示当前位置 | 由 scope.userLocation 覆盖；真机需验证 |
| `chooseAvatar` / `type="nickname"` | tripWorkspace.wxml:407,413 | 头像昵称 | 用户主动填写能力，无需隐私声明 |
| 未使用 | — | getLocation/getFuzzyLocation/choosePoi/openLocation/getUserProfile/getPhoneNumber 均无调用 ✅ | — |

---

## A. 上线阻塞问题（P0）

1. 隐私授权流程缺失：新用户首启 `wx.chooseLocation` 直接失败，无同意路径（`app.js`，配合后台隐私指引配置）

## B. 上线前建议解决（P1）

1. 列表查询无分页：单旅行数据 >100 条静默截断，账单/结算金额算错（6 个云函数）
2. 解散旅行后数据仍可写入/读取，邀请码仍可加入（约 10 个云函数缺 status 校验）
3. schedule-map 日期切换竞态，旧数据覆盖新日期
4. addItinerary 编辑模式加载失败后空白表单可覆盖原行程

## C. 可推迟问题（P2 / P3）

- **P2（14 条）**：服务端金额无上限、历史 refund 未迁移、地图 Key 硬编码（换 key + 环境变量）、avatarUrl 云端无校验、行程删改权限不对称、joinTrip 并发丢失成员、冷启动 login 竞态、former 成员显示「未知」、邀请码可暴力枚举、主包 1.15MB 死图片（限额 85%）、expenseDetail 返回不刷新、表单页加载失败四态缺失、saveProfile 无锁、index 误导空态
- **P3（34 条）**：见 P3 区，含结算脏数据防御、字段/坐标校验、展示层小错、死代码清理、配置残留、文档漂移等

## D. 人工检查清单（需登录控制台确认）

1. **用户隐私保护指引**：公众平台「设置-服务内容声明-用户隐私保护指引」声明「位置信息」并审核通过（P0 修复前置条件）
2. **数据库集合权限**：users/trips/expenses/itinerary/todos 五个集合须为「仅云函数可读写」，确认客户端不可直连
3. **数据库索引**：按上表 7 条建议在控制台建立（尤其 getTodos 的双字段复合索引，缺失会导致待办列表静默为空）
4. **云函数部署状态**：25 个函数逐一确认云端版本与当前代码一致；getRouteDistance 改动后必须重部署
5. **腾讯位置服务控制台**：MAP_KEY 配额/调用量告警；决定是否换新 key + 环境变量
6. **历史数据检查**：云开发控制台查询 expenses 集合是否存在 `type='refund'` 记录（决定 P2 迁移是否必要）
7. **小程序备案与类目**：appid 备案状态、类目选择
8. **体验版成员**：把测试人员加入体验成员
9. **云开发配额**：调用量/读写次数/存储/CDN 额度与费用预警
10. **真机测试**：iOS + Android 完整走一遍（隐私弹窗、下拉刷新、SVG 图标、地图图钉、scroll-view 高度、白屏问题确认）
