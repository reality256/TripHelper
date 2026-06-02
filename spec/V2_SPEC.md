1. # V2_SPEC.md

   # 同行旅 V2 版本需求文档

   ## 1. 文档目的

   本文档用于指导 Claude Code 在已有 V1 版本基础上开发第二版。

   V2 的核心目标不是重做整个小程序，而是在现有功能基础上优化使用路径和页面结构，使用户打开小程序后能更快进入当前旅行，并在旅行内部通过底部菜单切换不同功能模块。

   Claude Code 必须先阅读：

   ```text
   PROJECT_SPEC.md
   CLOUD_DEV_GUIDE.md
   V2_SPEC.md
   ```

   然后基于当前已有代码继续开发。

   禁止：

   1. 重建整个项目。
   2. 删除已有核心功能。
   3. 一次性大规模重构无关代码。
   4. 改变技术栈。
   5. 引入 uni-app、Taro、Vue、React、TypeScript。
   6. 使用自建服务器。

   ------

   ## 2. V2 总体目标

   V2 主要解决两个问题：

   ### 2.1 缩短启动链路

   当前问题：

   用户打开小程序后，需要从首页手动选择已有旅行，再进入旅行详情页，链路较长。

   V2 目标：

   用户启动小程序后，如果已经加入过旅行，应自动进入最近的旅行页面。

   规则：

   1. 如果用户没有任何旅行：
      - 进入首页。
      - 显示创建旅行、加入旅行入口。
   2. 如果用户只有一个旅行：
      - 启动后自动进入该旅行页面。
   3. 如果用户有多个旅行：
      - 启动后自动进入时间排序最近的那个旅行。
   4. 用户仍然需要能够在设置页或旅行管理入口中切换到其他旅行。

   ------

   ### 2.2 重构旅行内部页面结构

   当前问题：

   进入已有旅行后，页面是多个按钮入口，用户需要点击不同按钮进入不同页面，操作链路较长。

   V2 目标：

   进入某个旅行后，直接展示一个“旅行工作台”页面。该页面底部有几个菜单栏，用户可以在同一个旅行页面内切换不同内容模块。

   底部菜单包括：

   1. 行程
   2. 账单
   3. 待办
   4. 设置

   这四个模块应该在同一个旅行主页面内切换展示，而不是让用户频繁跳转到很多独立页面。

   ------

   ## 3. 重要架构说明

   ### 3.1 不是全局 app.json tabBar

   本版本需要的是“旅行页面内部的底部菜单”，不是小程序全局 `app.json` 的 tabBar。

   原因：

   1. 底部菜单只属于某个具体旅行。
   2. 每个菜单都依赖当前 `tripId`。
   3. 用户没有旅行时不应该显示旅行内菜单。
   4. 创建旅行、加入旅行等页面不应该显示该菜单。

   因此建议实现为：

   ```text
   pages/tripWorkspace/tripWorkspace
   ```

   在 `tripWorkspace` 页面内部实现自定义底部菜单。

   ------

   ### 3.2 推荐页面结构

   V2 推荐新增或重构为：

   ```text
   /miniprogram/pages
     /index
     /createTrip
     /joinTrip
     /tripWorkspace
     /addItinerary
     /addExpense
     /addTodo
     /editTodo
   ```

   其中：

   ```text
   tripWorkspace
   ```

   是 V2 的核心页面。

   它负责：

   1. 接收 `tripId`。
   2. 加载当前旅行信息。
   3. 管理底部菜单状态。
   4. 根据当前菜单展示对应模块：
      - itinerary
      - expenses
      - todos
      - settings

   ------

   ## 4. 启动逻辑优化

   ### 4.1 启动流程

   小程序启动后，应执行以下逻辑：

   ```text
   启动小程序
     ↓
   初始化云开发
     ↓
   调用 login 云函数，获取当前用户信息
     ↓
   调用 getMyTrips 云函数，获取当前用户加入的旅行列表
     ↓
   判断旅行数量
   ```

   判断规则：

   ```text
   如果 trips.length === 0:
     留在首页，显示创建旅行和加入旅行
   
   如果 trips.length === 1:
     自动跳转到 tripWorkspace，并传入该 tripId
   
   如果 trips.length > 1:
     按时间排序，选择最近的旅行
     自动跳转到 tripWorkspace，并传入该 tripId
   ```

   ### 4.2 最近旅行的排序规则

   “最近的旅行”按以下优先级判断：

   1. 优先使用 `updatedAt` 倒序。
   2. 如果 `updatedAt` 不存在，则使用 `startDate` 倒序。
   3. 如果 `startDate` 也不存在，则使用 `createdAt` 倒序。

   推荐由 `getMyTrips` 云函数返回排序后的旅行列表。

   前端只取第一个：

   ```js
   const defaultTrip = trips[0]
   ```

   ### 4.3 防止重复跳转

   启动逻辑必须避免重复跳转。

   例如：

   1. 用户已经在 `tripWorkspace` 页面时，不要反复 redirect。
   2. 用户通过分享链接进入某个具体旅行时，不要自动跳到另一个最近旅行。
   3. 用户正在创建旅行或加入旅行时，不要自动打断用户操作。

   建议增加状态控制：

   ```js
   hasHandledInitialRoute: false
   ```

   或者仅在 `pages/index/index` 的 `onLoad` 中执行自动跳转逻辑。

   ### 4.4 首页职责变化

   V2 后首页主要承担：

   1. 无旅行时的入口页。
   2. 加载状态页。
   3. 创建旅行入口。
   4. 加入旅行入口。
   5. 必要时的旅行列表入口。

   如果用户已有旅行，首页不再作为主要操作页面。

   ------

   ## 5. 旅行工作台页面 tripWorkspace

   ### 5.1 页面路径

   新增页面：

   ```text
   pages/tripWorkspace/tripWorkspace
   ```

   ### 5.2 页面参数

   页面通过 URL 参数接收：

   ```text
   tripId
   ```

   示例：

   ```text
   /pages/tripWorkspace/tripWorkspace?tripId=xxxx
   ```

   ### 5.3 页面职责

   `tripWorkspace` 是用户进入某个旅行后的主页面。

   它需要负责：

   1. 加载旅行基本信息。
   2. 加载当前旅行成员。
   3. 管理底部菜单状态。
   4. 展示当前菜单对应内容。
   5. 提供行程、账单、待办、设置四个模块。
   6. 处理无权限、旅行不存在、加载失败等错误状态。

   ### 5.4 顶部展示区域

   页面顶部应展示当前旅行基本信息。

   建议展示：

   ```text
   旅行名称
   目的地
   旅行日期
   成员数量
   ```

   示例：

   ```text
   同行旅：日本关西 7 日游
   大阪 / 京都 / 奈良
   2026-07-10 至 2026-07-17
   4 位成员
   ```

   顶部区域固定展示在各个菜单上方。

   即无论当前切换到：

   ```text
   行程 / 账单 / 待办 / 设置
   ```

   顶部都应展示当前旅行的基本信息。

   ------

   ## 6. 底部菜单结构

   ### 6.1 菜单项

   底部菜单包含四项：

   ```text
   行程
   账单
   待办
   设置
   ```

   内部 key 建议：

   ```js
   tabs: [
     { key: 'itinerary', label: '行程' },
     { key: 'expenses', label: '账单' },
     { key: 'todos', label: '待办' },
     { key: 'settings', label: '设置' }
   ]
   ```

   ### 6.2 默认菜单

   进入 `tripWorkspace` 后，默认展示：

   ```text
   行程
   ```

   即：

   ```js
   activeTab: 'itinerary'
   ```

   ### 6.3 菜单切换要求

   点击底部菜单时：

   1. 不跳出当前 tripWorkspace 页面。
   2. 更新 `activeTab`。
   3. 根据 `activeTab` 切换展示对应内容。
   4. 保持当前 `tripId` 不变。
   5. 不重新进入其他页面。

   ------

   ## 7. 行程模块

   ### 7.1 模块位置

   行程模块在：

   ```text
   pages/tripWorkspace/tripWorkspace
   ```

   内部展示。

   可以先直接写在 `tripWorkspace.wxml` 中。

   如果代码变复杂，后续可以拆成组件：

   ```text
   components/itinerary-panel/itinerary-panel
   ```

   但 V2 阶段不强制拆组件。

   ### 7.2 功能目标

   行程页面需要：

   1. 按时间顺序展示当前旅行的行程。
   2. 展示日期、开始时间、结束时间、标题、地点、备注。
   3. 提供“管理行程”按钮。
   4. 通过管理行程完成行程的添加和删除。

   ### 7.3 展示规则

   行程按以下顺序排序：

   ```text
   date 升序
   startTime 升序
   createdAt 升序
   ```

   展示示例：

   ```text
   7月10日
   
   09:00 - 10:00 前往机场
   地点：墨尔本机场
   
   14:00 - 16:00 酒店入住
   地点：大阪某酒店
   ```

   ### 7.4 空状态

   如果暂无行程，显示：

   ```text
   暂无行程安排
   点击“管理行程”添加第一条行程
   ```

   ### 7.5 管理行程按钮

   按钮文案：

   ```text
   管理行程
   ```

   点击后可以进入原有行程管理页，或者进入新增的行程管理页。

   推荐保留已有行程相关页面，不要强行删除原页面。

   可以跳转到：

   ```text
   pages/itinerary/itinerary?tripId=xxx
   ```

   或者：

   ```text
   pages/addItinerary/addItinerary?tripId=xxx
   ```

   但用户在 `tripWorkspace` 中需要能看到行程列表。

   ### 7.6 删除行程

   V2 需要支持删除行程。

   建议新增云函数：

   ```text
   deleteItinerary
   ```

   输入：

   ```js
   {
     tripId: string,
     itineraryId: string
   }
   ```

   权限要求：

   1. 当前用户必须属于该旅行。
   2. 旅行不存在时返回错误。
   3. 行程不存在时返回错误。
   4. 行程必须属于该 tripId。
   5. 后续可以限制只有创建者或旅行 owner 能删，V2 暂时允许旅行成员删除。

   返回格式：

   ```js
   {
     success: true,
     data: {},
     message: ''
   }
   ```

   ------

   ## 8. 账单模块

   ### 8.1 模块位置

   账单模块在：

   ```text
   pages/tripWorkspace/tripWorkspace
   ```

   内部展示。

   ### 8.2 功能目标

   账单模块暂时不做太大变动。

   需要：

   1. 按时间顺序展示当前旅行账单。
   2. 显示账单标题、金额、付款人、创建时间。
   3. 保留添加账单入口。
   4. 在账单页面集成结算结果。
   5. 不再要求用户单独进入一个结算按钮页面才能看结算。

   ### 8.3 账单排序

   账单按时间顺序展示。

   建议使用：

   ```text
   createdAt 倒序
   ```

   即最新账单在前。

   如果用户明确需要从早到晚展示，可后续调整。

   ### 8.4 账单展示字段

   每条账单建议展示：

   ```text
   标题
   金额
   付款人昵称
   参与分摊人数
   创建时间
   备注
   ```

   ### 8.5 添加账单入口

   按钮文案：

   ```text
   添加账单
   ```

   点击后进入：

   ```text
   pages/addExpense/addExpense?tripId=xxx
   ```

   添加完成后返回 `tripWorkspace`，并刷新账单模块。

   ### 8.6 结算集成

   账单模块需要直接展示结算结果。

   结算结果包括：

   1. 总消费金额。
   2. 每个成员实付金额。
   3. 每个成员应付金额。
   4. 每个成员净额。
   5. 最简转账方案。

   建议在账单列表下方展示：

   ```text
   结算结果
   ```

   示例：

   ```text
   总消费：860.00 元
   
   成员结算：
   张三 实付 500.00，应付 286.67，应收 213.33
   李四 实付 360.00，应付 286.67，应收 73.33
   王五 实付 0.00，应付 286.66，应付 286.66
   
   建议转账：
   王五 转给 张三 213.33 元
   王五 转给 李四 73.33 元
   ```

   ### 8.7 结算刷新

   当进入账单 tab 时，应加载或刷新：

   1. 账单列表。
   2. 结算结果。

   添加账单返回后，应重新加载账单和结算。

   ------

   ## 9. 待办事项模块

   ### 9.1 模块名称

   底部菜单显示为：

   ```text
   待办
   ```

   页面标题或模块标题可显示为：

   ```text
   行程准备
   ```

   ### 9.2 功能目标

   这是 V2 新增功能。

   该模块用于旅行前和旅行中准备事项管理。

   核心功能：

   1. 添加待办事项。
   2. 指定负责人员。
   3. 显示是否完成。
   4. 标记完成或未完成。
   5. 删除待办事项。
   6. 按完成状态展示提醒。

   ### 9.3 使用场景

   示例：

   ```text
   购买机票：张三负责，未完成
   预订酒店：李四负责，已完成
   准备护照：所有人负责，未完成
   确认集合时间：王五负责，未完成
   购买旅行保险：张三负责，已完成
   ```

   ### 9.4 数据库集合

   新增集合：

   ```text
   todos
   ```

   字段设计：

   ```js
   {
     _id: string,
     tripId: string,
     title: string,
     note: string,
     assigneeOpenids: string[],
     completed: boolean,
     completedAt: Date | null,
     completedBy: string | null,
     createdBy: string,
     createdAt: Date,
     updatedAt: Date
   }
   ```

   字段说明：

   | 字段            | 类型           | 说明                 |
   | --------------- | -------------- | -------------------- |
   | _id             | string         | 待办事项 ID          |
   | tripId          | string         | 所属旅行 ID          |
   | title           | string         | 待办标题             |
   | note            | string         | 备注                 |
   | assigneeOpenids | string[]       | 负责人员 openid 数组 |
   | completed       | boolean        | 是否完成             |
   | completedAt     | Date \| null   | 完成时间             |
   | completedBy     | string \| null | 标记完成人 openid    |
   | createdBy       | string         | 创建者 openid        |
   | createdAt       | Date           | 创建时间             |
   | updatedAt       | Date           | 更新时间             |

   ### 9.5 云函数

   V2 新增以下云函数：

   ```text
   addTodo
   getTodos
   updateTodoStatus
   deleteTodo
   ```

   ------

   ### 9.6 addTodo

   功能：

   添加待办事项。

   输入：

   ```js
   {
     tripId: string,
     title: string,
     note: string,
     assigneeOpenids: string[]
   }
   ```

   校验：

   1. 当前用户必须属于该旅行。
   2. `tripId` 不能为空。
   3. `title` 不能为空。
   4. `assigneeOpenids` 至少包含一个成员。
   5. 所有 `assigneeOpenids` 必须属于该旅行。

   写入：

   ```js
   {
     tripId,
     title,
     note,
     assigneeOpenids,
     completed: false,
     completedAt: null,
     completedBy: null,
     createdBy: openid,
     createdAt: new Date(),
     updatedAt: new Date()
   }
   ```

   ------

   ### 9.7 getTodos

   功能：

   获取当前旅行下的待办事项。

   输入：

   ```js
   {
     tripId: string
   }
   ```

   校验：

   1. 当前用户必须属于该旅行。
   2. `tripId` 不能为空。

   返回：

   ```js
   {
     todos: []
   }
   ```

   排序：

   ```text
   completed 升序
   createdAt 倒序
   ```

   即：

   1. 未完成在前。
   2. 已完成在后。
   3. 同状态下新创建的在前。

   ------

   ### 9.8 updateTodoStatus

   功能：

   切换待办完成状态。

   输入：

   ```js
   {
     tripId: string,
     todoId: string,
     completed: boolean
   }
   ```

   校验：

   1. 当前用户必须属于该旅行。
   2. 待办必须属于该旅行。
   3. `todoId` 不能为空。
   4. `completed` 必须是 boolean。

   更新逻辑：

   如果 `completed === true`：

   ```js
   {
     completed: true,
     completedAt: new Date(),
     completedBy: openid,
     updatedAt: new Date()
   }
   ```

   如果 `completed === false`：

   ```js
   {
     completed: false,
     completedAt: null,
     completedBy: null,
     updatedAt: new Date()
   }
   ```

   ------

   ### 9.9 deleteTodo

   功能：

   删除待办事项。

   输入：

   ```js
   {
     tripId: string,
     todoId: string
   }
   ```

   校验：

   1. 当前用户必须属于该旅行。
   2. 待办必须属于该旅行。
   3. `todoId` 不能为空。

   V2 权限：

   暂时允许旅行成员删除待办。

   后续版本可以改为：

   ```text
   创建者可以删除自己创建的待办
   旅行 owner 可以删除所有待办
   ```

   ------

   ## 10. 待办页面 UI 要求

   ### 10.1 待办模块展示

   待办模块需要展示：

   1. 待办标题。
   2. 负责人员。
   3. 完成状态。
   4. 备注。
   5. 创建时间。
   6. 完成/取消完成按钮。
   7. 删除按钮。

   示例：

   ```text
   未完成
   
   [ ] 购买机票
   负责人：张三
   备注：确认出发时间后购买
   
   [ ] 准备护照
   负责人：所有成员
   
   已完成
   
   [x] 预订酒店
   负责人：李四
   完成时间：2026-07-01 18:30
   ```

   ### 10.2 添加待办入口

   按钮文案：

   ```text
   添加待办
   ```

   点击后进入：

   ```text
   pages/addTodo/addTodo?tripId=xxx
   ```

   ### 10.3 添加待办页

   新增页面：

   ```text
   pages/addTodo/addTodo
   ```

   功能：

   1. 输入待办标题。
   2. 输入备注。
   3. 从旅行成员中选择负责人员。
   4. 提交。

   表单字段：

   ```text
   title
   note
   assigneeOpenids
   ```

   校验：

   1. 标题不能为空。
   2. 至少选择一个负责人员。

   提交后：

   1. 调用 `addTodo` 云函数。
   2. 成功后返回 `tripWorkspace`。
   3. 返回后刷新待办列表。

   ------

   ## 11. 设置模块

   ### 11.1 模块位置

   设置模块在：

   ```text
   pages/tripWorkspace/tripWorkspace
   ```

   内部展示。

   ### 11.2 功能目标

   设置模块用于管理当前旅行相关设置和用户相关状态。

   V2 设置模块需要包含：

   1. 当前登录用户信息。
   2. 当前旅行信息。
   3. 当前旅行成员列表。
   4. 邀请码展示。
   5. 复制邀请码。
   6. 切换旅行入口。
   7. 创建新旅行入口。
   8. 加入其他旅行入口。

   ### 11.3 登录情况展示

   显示：

   ```text
   当前用户
   昵称
   openid 可在调试状态下显示，正式 UI 中可以隐藏
   ```

   如果当前用户信息不完整，需要提供：

   ```text
   完善昵称
   ```

   或：

   ```text
   设置我的昵称
   ```

   V2 暂时可以简单展示已有用户信息，不强制做完整个人资料编辑。

   ### 11.4 旅行人员管理

   显示当前旅行成员列表：

   ```text
   成员头像
   成员昵称
   是否创建者
   ```

   V2 暂不强制实现：

   1. 踢出成员。
   2. 转让 owner。
   3. 管理员角色。
   4. 成员权限分级。

   但 UI 上可以预留“成员管理”区域。

   ### 11.5 邀请码

   设置页需要显示当前旅行邀请码。

   功能：

   1. 展示 inviteCode。
   2. 支持复制 inviteCode。
   3. 后续可支持分享小程序卡片。

   ### 11.6 切换旅行

   如果用户有多个旅行，设置页需要提供切换入口。

   可以实现为：

   ```text
   我的其他旅行
   ```

   点击后展示用户所有旅行列表，选择后跳转：

   ```text
   /pages/tripWorkspace/tripWorkspace?tripId=目标tripId
   ```

   V2 可以先做简单列表。

   ### 11.7 创建和加入入口

   设置页需要保留：

   ```text
   创建新旅行
   加入其他旅行
   ```

   点击分别跳转：

   ```text
   pages/createTrip/createTrip
   pages/joinTrip/joinTrip
   ```

   这样用户即使自动进入最近旅行，也仍然可以进入其他流程。

   ------

   ## 12. Service 层新增要求

   需要新增或扩展 service 文件。

   ### 12.1 todoService.js

   新增：

   ```text
   /miniprogram/services/todoService.js
   ```

   包含：

   ```js
   import { callCloudFunction } from './cloudService'
   
   export function getTodos(tripId) {
     return callCloudFunction('getTodos', { tripId })
   }
   
   export function addTodo(data) {
     return callCloudFunction('addTodo', data)
   }
   
   export function updateTodoStatus(data) {
     return callCloudFunction('updateTodoStatus', data)
   }
   
   export function deleteTodo(data) {
     return callCloudFunction('deleteTodo', data)
   }
   ```

   ### 12.2 itineraryService.js

   增加：

   ```js
   export function deleteItinerary(data) {
     return callCloudFunction('deleteItinerary', data)
   }
   ```

   ### 12.3 tripService.js

   确保已有：

   ```js
   export function getMyTrips() {
     return callCloudFunction('getMyTrips')
   }
   
   export function getTripDetail(tripId) {
     return callCloudFunction('getTripDetail', { tripId })
   }
   ```

   如果没有，则补齐。

   ### 12.4 settlementService.js

   确保账单模块能调用结算：

   ```js
   export function calculateSettlement(tripId) {
     return callCloudFunction('calculateSettlement', { tripId })
   }
   ```

   ------

   ## 13. 云函数新增清单

   V2 至少新增：

   ```text
   addTodo
   getTodos
   updateTodoStatus
   deleteTodo
   deleteItinerary
   ```

   可能需要修改：

   ```text
   getMyTrips
   getTripDetail
   getItinerary
   getExpenses
   calculateSettlement
   ```

   修改要求：

   1. 不破坏 V1 已有功能。
   2. 保持统一返回格式。
   3. 所有涉及 `tripId` 的函数必须校验用户是否属于该旅行。
   4. 所有云函数必须从 `cloud.getWXContext()` 获取 openid。
   5. 不信任前端传入的 openid。

   ------

   ## 14. 数据库新增集合

   V2 新增集合：

   ```text
   todos
   ```

   开发者需要在微信云开发控制台创建该集合。

   集合权限建议：

   1. 开发阶段可以通过云函数读写。
   2. 不建议让前端直接写入。
   3. 生产环境应收紧权限，关键操作走云函数。

   ------

   ## 15. app.json 页面注册要求

   V2 需要确认以下页面已注册：

   ```json
   {
     "pages": [
       "pages/index/index",
       "pages/tripWorkspace/tripWorkspace",
       "pages/createTrip/createTrip",
       "pages/joinTrip/joinTrip",
       "pages/itinerary/itinerary",
       "pages/addItinerary/addItinerary",
       "pages/expenses/expenses",
       "pages/addExpense/addExpense",
       "pages/addTodo/addTodo",
       "pages/members/members"
     ]
   }
   ```

   实际页面顺序可以根据当前项目调整。

   注意：

   1. `tripWorkspace` 应成为已有旅行用户的主要进入页面。
   2. 首页仍然保留。
   3. 不要删除创建旅行和加入旅行页面。

   ------

   ## 16. UI 风格要求

   V2 仍保持：

   ```text
   极简
   清晰
   旅行感
   低学习成本
   操作链路短
   ```

   ### 16.1 tripWorkspace 布局建议

   页面结构：

   ```text
   顶部旅行信息区
     ↓
   当前 tab 内容区
     ↓
   底部菜单栏
   ```

   示意：

   ```text
   ┌─────────────────────┐
   │ 日本关西 7 日游       │
   │ 大阪 / 京都 / 奈良    │
   │ 2026.07.10-07.17    │
   ├─────────────────────┤
   │                     │
   │ 当前模块内容          │
   │ 行程 / 账单 / 待办 / 设置 │
   │                     │
   ├─────────────────────┤
   │ 行程  账单  待办  设置 │
   └─────────────────────┘
   ```

   ### 16.2 底部菜单要求

   1. 固定在底部。
   2. 当前选中项需要有明显状态。
   3. 菜单高度不要太大。
   4. 内容区不要被底部菜单遮挡。
   5. 保证 iPhone 底部安全区适配。

   ### 16.3 按钮文案

   使用简短明确文案：

   ```text
   管理行程
   添加账单
   添加待办
   复制邀请码
   切换旅行
   创建新旅行
   加入其他旅行
   ```

   ------

   ## 17. 数据刷新规则

   ### 17.1 tripWorkspace onLoad

   进入页面时加载：

   1. trip detail
   2. 当前默认 tab 数据

   默认 tab 是：

   ```text
   itinerary
   ```

   所以进入时加载：

   ```text
   trip detail
   itinerary
   ```

   ### 17.2 tab 切换时加载

   切换到不同 tab 时加载对应数据：

   ```text
   行程 tab：加载 itinerary
   账单 tab：加载 expenses + settlement
   待办 tab：加载 todos
   设置 tab：加载 trip detail + members + my trips
   ```

   ### 17.3 从添加页面返回后刷新

   从以下页面返回时，需要刷新对应模块：

   ```text
   addItinerary 返回：刷新 itinerary
   addExpense 返回：刷新 expenses + settlement
   addTodo 返回：刷新 todos
   ```

   可以在 `onShow` 中根据 `activeTab` 刷新当前模块。

   注意避免频繁重复请求。

   ------

   ## 18. 兼容 V1 旧页面

   V2 不要求删除 V1 页面。

   旧页面可以继续存在：

   ```text
   pages/itinerary/itinerary
   pages/expenses/expenses
   pages/settlement/settlement
   pages/members/members
   ```

   但用户主要操作入口改为：

   ```text
   pages/tripWorkspace/tripWorkspace
   ```

   如果已有页面逻辑可以复用，优先复用，不要重写所有代码。

   ------

   ## 19. 权限要求

   V2 所有新增功能必须遵守 `CLOUD_DEV_GUIDE.md` 的安全要求。

   ### 19.1 通用规则

   1. 前端不传可信 openid。
   2. 云函数中通过 `cloud.getWXContext().OPENID` 获取当前用户。
   3. 操作任何 trip 数据前必须校验当前用户是否属于该 trip。
   4. 操作 todo、itinerary、expense 时必须校验该数据属于当前 trip。
   5. 不允许用户通过构造参数访问其他旅行数据。

   ### 19.2 待办权限

   V2 暂定：

   1. 当前旅行成员可以查看 todos。
   2. 当前旅行成员可以创建 todos。
   3. 当前旅行成员可以标记完成或取消完成。
   4. 当前旅行成员可以删除 todos。

   后续版本可细化权限。

   ### 19.3 行程删除权限

   V2 暂定：

   1. 当前旅行成员可以删除行程。

   后续版本可细化为：

   ```text
   创建者可以删除自己创建的行程
   旅行 owner 可以删除所有行程
   ```

   ------

   ## 20. V2 开发顺序

   Claude Code 必须按以下阶段逐步开发。

   ### 阶段 1：启动逻辑优化

   目标：

   1. 用户有旅行时自动进入最近旅行。
   2. 用户无旅行时留在首页。
   3. 防止重复跳转。

   涉及：

   ```text
   pages/index/index
   services/tripService.js
   getMyTrips 云函数
   ```

   完成标准：

   1. 无旅行用户看到首页。
   2. 单旅行用户自动进入 tripWorkspace。
   3. 多旅行用户自动进入最近旅行。

   ------

   ### 阶段 2：新增 tripWorkspace 页面

   目标：

   1. 创建 tripWorkspace 页面。
   2. 接收 tripId。
   3. 加载 trip detail。
   4. 展示顶部旅行信息。
   5. 实现底部菜单切换。
   6. 默认展示行程 tab。

   涉及：

   ```text
   pages/tripWorkspace/tripWorkspace
   app.json
   services/tripService.js
   ```

   完成标准：

   1. 可以通过 tripId 打开 tripWorkspace。
   2. 底部四个 tab 可切换。
   3. 顶部旅行信息正确显示。

   ------

   ### 阶段 3：行程 tab 集成

   目标：

   1. 在 tripWorkspace 内展示行程列表。
   2. 按时间排序。
   3. 添加“管理行程”按钮。
   4. 支持删除行程。

   涉及：

   ```text
   tripWorkspace
   itineraryService.js
   getItinerary 云函数
   deleteItinerary 云函数
   ```

   完成标准：

   1. 行程在 tripWorkspace 中正确展示。
   2. 暂无行程时显示空状态。
   3. 可以进入管理行程。
   4. 可以删除行程并刷新列表。

   ------

   ### 阶段 4：账单 tab 集成结算

   目标：

   1. 在 tripWorkspace 内展示账单列表。
   2. 添加账单入口。
   3. 在账单 tab 直接展示结算结果。
   4. 添加账单返回后刷新账单和结算。

   涉及：

   ```text
   tripWorkspace
   expenseService.js
   settlementService.js
   getExpenses 云函数
   calculateSettlement 云函数
   ```

   完成标准：

   1. 账单列表正确显示。
   2. 结算结果直接显示在账单 tab。
   3. 添加账单后返回能看到更新。

   ------

   ### 阶段 5：待办模块开发

   目标：

   1. 新增 todos 集合说明。
   2. 新增 todoService.js。
   3. 新增 addTodo、getTodos、updateTodoStatus、deleteTodo 云函数。
   4. 新增 addTodo 页面。
   5. 在 tripWorkspace 中展示待办列表。
   6. 支持标记完成/取消完成。
   7. 支持删除待办。

   涉及：

   ```text
   pages/tripWorkspace/tripWorkspace
   pages/addTodo/addTodo
   services/todoService.js
   cloudfunctions/addTodo
   cloudfunctions/getTodos
   cloudfunctions/updateTodoStatus
   cloudfunctions/deleteTodo
   ```

   完成标准：

   1. 可以添加待办。
   2. 可以指定负责人员。
   3. 可以查看待办。
   4. 可以标记完成。
   5. 可以取消完成。
   6. 可以删除待办。

   ------

   ### 阶段 6：设置 tab 开发

   目标：

   1. 展示当前用户信息。
   2. 展示当前旅行信息。
   3. 展示成员列表。
   4. 展示邀请码。
   5. 支持复制邀请码。
   6. 支持切换旅行。
   7. 支持进入创建旅行和加入旅行。

   涉及：

   ```text
   tripWorkspace
   tripService.js
   userService.js
   getTripDetail
   getMyTrips
   ```

   完成标准：

   1. 设置 tab 可展示成员和邀请码。
   2. 可以复制邀请码。
   3. 可以切换旅行。
   4. 可以进入创建旅行和加入旅行页面。

   ------

   ### 阶段 7：整体测试和修复

   目标：

   1. 测试完整启动流程。
   2. 测试四个 tab。
   3. 测试数据刷新。
   4. 测试权限校验。
   5. 修复明显 UI 和逻辑问题。

   完成标准：

   1. 无旅行用户流程正常。
   2. 已有旅行用户自动进入最近旅行。
   3. 四个 tab 可正常使用。
   4. 新增待办功能可用。
   5. 账单结算显示正常。
   6. 不破坏 V1 创建旅行、加入旅行、添加账单、添加行程功能。

   ------

   ## 21. 测试场景

   ### 21.1 无旅行用户启动

   步骤：

   1. 使用没有加入任何旅行的新用户打开小程序。

   预期：

   1. 停留首页。
   2. 显示创建旅行、加入旅行入口。
   3. 不自动跳转 tripWorkspace。

   ------

   ### 21.2 单旅行用户启动

   步骤：

   1. 使用只加入一个旅行的用户打开小程序。

   预期：

   1. 自动进入该旅行的 tripWorkspace。
   2. 默认显示行程 tab。
   3. 顶部显示旅行信息。

   ------

   ### 21.3 多旅行用户启动

   步骤：

   1. 使用加入多个旅行的用户打开小程序。

   预期：

   1. 自动进入最近更新的旅行。
   2. 可以在设置 tab 中切换到其他旅行。

   ------

   ### 21.4 行程 tab 测试

   步骤：

   1. 进入 tripWorkspace。
   2. 打开行程 tab。
   3. 查看行程列表。
   4. 点击管理行程。
   5. 添加或删除行程。
   6. 返回 tripWorkspace。

   预期：

   1. 行程按时间顺序显示。
   2. 删除后列表刷新。
   3. 空状态正常显示。

   ------

   ### 21.5 账单 tab 测试

   步骤：

   1. 进入账单 tab。
   2. 查看账单列表。
   3. 查看结算结果。
   4. 添加新账单后返回。

   预期：

   1. 账单列表更新。
   2. 总金额更新。
   3. 结算结果更新。

   ------

   ### 21.6 待办 tab 测试

   步骤：

   1. 进入待办 tab。
   2. 点击添加待办。
   3. 输入标题。
   4. 选择负责人员。
   5. 提交。
   6. 返回待办 tab。
   7. 标记完成。
   8. 取消完成。
   9. 删除待办。

   预期：

   1. 待办创建成功。
   2. 负责人员显示正确。
   3. 完成状态切换正确。
   4. 删除后列表更新。

   ------

   ### 21.7 设置 tab 测试

   步骤：

   1. 进入设置 tab。
   2. 查看用户信息。
   3. 查看成员列表。
   4. 复制邀请码。
   5. 切换旅行。
   6. 点击创建新旅行。
   7. 点击加入其他旅行。

   预期：

   1. 成员显示正确。
   2. 邀请码复制成功。
   3. 切换旅行成功。
   4. 创建和加入入口可用。

   ------

   ## 22. 给 Claude Code 的 V2 启动指令

   使用以下 prompt 启动 V2 开发：

   ```text
   请先阅读 PROJECT_SPEC.md、CLOUD_DEV_GUIDE.md 和 V2_SPEC.md。
   
   当前任务：开始开发 V2 版本。
   
   请注意：
   1. 不要重建项目。
   2. 不要删除 V1 已有核心功能。
   3. 不要一次性开发所有阶段。
   4. 严格按照 V2_SPEC.md 的开发顺序推进。
   5. 当前只执行 V2 阶段 1：启动逻辑优化。
   
   阶段 1 目标：
   1. 用户无旅行时留在首页。
   2. 用户只有一个旅行时自动进入 tripWorkspace。
   3. 用户有多个旅行时自动进入最近的旅行。
   4. 防止重复跳转。
   5. 如果 tripWorkspace 页面尚不存在，可以先创建最小占位页面，保证跳转不报错。
   
   修改代码前，请先说明：
   1. 你理解的阶段 1 目标。
   2. 当前项目中相关文件有哪些。
   3. 准备修改哪些文件。
   4. 是否需要新增文件。
   
   修改完成后，请说明：
   1. 实际修改了哪些文件。
   2. 如何在微信开发者工具中测试无旅行、单旅行、多旅行三种情况。
   3. 下一阶段应该做什么。
   ```

   ------

   ## 23. V2 成功标准

   V2 完成后，用户体验应变成：

   ```text
   打开小程序
     ↓
   如果已有旅行，直接进入最近旅行
     ↓
   在旅行页面底部切换：
   行程 / 账单 / 待办 / 设置
   ```

   核心验收标准：

   1. 用户不需要每次从首页手动进入旅行。
   2. 旅行内部不再主要依赖多个按钮跳转。
   3. 行程、账单、待办、设置都在旅行工作台中完成主要展示。
   4. 账单页面直接集成结算。
   5. 新增待办事项功能可用。
   6. 设置页能管理用户、成员、邀请码和旅行切换。
   7. 不破坏 V1 的核心数据和功能。
