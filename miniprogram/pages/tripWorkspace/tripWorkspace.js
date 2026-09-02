// pages/tripWorkspace/tripWorkspace.js
// V2 核心页面：旅行工作台
var tripService = require('../../services/tripService')
var itineraryService = require('../../services/itineraryService')
var expenseService = require('../../services/expenseService')
var settlementService = require('../../services/settlementService')
var todoService = require('../../services/todoService')
var userService = require('../../services/userService')
var categoryUtils = require('../../utils/expenseCategory')
var scheduleUtils = require('../../utils/schedule')
var budgetUtils = require('../../utils/budget')
var userUtils = require('../../utils/user')

Page({
  data: {
    tripId: '',
    trip: null,
    memberCount: 0,
    members: [],
    memberMap: {},
    loading: true,

    // 用户资料
    user: null,
    showProfileModal: false,
    profileNickName: '',
    profileAvatarUrl: '',
    hasNewAvatar: false,  // 标记用户是否选择了新头像

    // 底部菜单
    tabs: [
      { key: 'itinerary', label: '行程', icon: '/images/icons/tab-itinerary.svg', iconActive: '/images/icons/tab-itinerary-active.svg' },
      { key: 'expenses', label: '账单', icon: '/images/icons/tab-expenses.svg', iconActive: '/images/icons/tab-expenses-active.svg' },
      { key: 'todos', label: '待办', icon: '/images/icons/tab-todos.svg', iconActive: '/images/icons/tab-todos-active.svg' },
      { key: 'settings', label: '设置', icon: '/images/icons/tab-settings.svg', iconActive: '/images/icons/tab-settings-active.svg' }
    ],
    activeTab: 'itinerary',

    // 行程模块
    itineraryGroups: [],
    itineraryEmpty: true,
    itineraryManaging: false,
    itineraryLoading: false,
    itineraryLoaded: false,
    itineraryError: '',

    // 账单模块
    expenses: [],
    expenseTotal: '0.00',
    expenseEmpty: true,
    expensesLoading: false,
    expensesLoaded: false,
    expensesError: '',
    balances: [],
    transfers: [],
    hasSettlement: false,
    settlementLoading: false,
    settlementLoaded: false,
    settlementStale: false,

    // 待办模块
    todos: [],
    todoEmpty: true,
    todoManaging: false,
    todosLoading: false,
    todosLoaded: false,
    todosError: '',
    todosFull: [],
    todoFilter: 'all',
    todoFilterOptions: [
      { key: 'all', label: '全部' },
      { key: 'unfinished', label: '未完成' },
      { key: 'finished', label: '已完成' }
    ],

    // 下拉刷新（scroll-view refresher 状态）
    refresherTriggered: false,

    // 设置模块
    myTrips: [],
    myTripsLoaded: false,
    myOpenid: '',

    // 预算模块
    budgetSummary: null,
    budgetLoaded: false,
    lastExpenseTime: ''
  },

  onLoad: function (options) {
    if (options.tripId) {
      this.setData({ tripId: options.tripId })
      this.loadTrip()
    }
  },

  onShow: function () {
    if (this.data.tripId && !this.data.loading) {
      // 同步最新 user（昵称/头像可能在资料弹窗中更新过）
      var app = getApp()
      var user = app.globalData.user
      if (user) {
        var that = this
        var rawAvatar = user.avatarUrl || ''
        if (userUtils.isCloudFileID(rawAvatar)) {
          wx.cloud.getTempFileURL({ fileList: [rawAvatar] }).then(function (res) {
            var tmp = (res.fileList && res.fileList[0]) ? res.fileList[0].tempFileURL : rawAvatar
            that.setData({ user: user, profileNickName: user.nickName || '', profileAvatarUrl: tmp })
          }).catch(function () {
            that.setData({ user: user, profileNickName: user.nickName || '', profileAvatarUrl: '' })
          })
        } else if (userUtils.isCloudTempUrl(rawAvatar)) {
          // 过期 temp URL → 使用默认头像
          console.warn('[tripWorkspace] onShow: 头像为过期临时 URL，使用默认头像')
          this.setData({ user: user, profileNickName: user.nickName || '', profileAvatarUrl: '' })
        } else {
          this.setData({ user: user, profileNickName: user.nickName || '', profileAvatarUrl: rawAvatar })
        }
      }
      // 从子页面返回时刷新当前 tab 数据（账单 tab 额外刷新 trip 获取最新 budget；
      // 结算过期标记已内聚到 loadExpenses 成功回调）
      if (this.data.activeTab === 'expenses' && this.data.expensesLoaded) {
        this.refreshTripThenReloadExpenses()
      } else {
        this.loadTabData()
      }
    }
  },

  // 加载旅行基本信息 + 成员
  loadTrip: function () {
    var that = this
    this.setData({ loading: true })
    tripService.getTripDetail(this.data.tripId).then(function (data) {
      // 建立 openid → 昵称 映射
      var memberMap = {}
      var members = data.members || []
      for (var i = 0; i < members.length; i++) {
        memberMap[members[i].openid] = members[i].nickName
      }

      var app = getApp()
      var user = app.globalData.user
      var myOpenid = app.globalData.openid || ''

      // 收集所有 cloud:// 文件 ID，准备批量转换（去重）
      var cloudFileIds = []
      var seenFileIds = {}
      if (userUtils.isCloudFileID(user && user.avatarUrl)) {
        cloudFileIds.push(user.avatarUrl)
        seenFileIds[user.avatarUrl] = true
      }
      for (var j = 0; j < members.length; j++) {
        var mav = members[j].avatarUrl
        if (userUtils.isCloudFileID(mav) && !seenFileIds[mav]) {
          cloudFileIds.push(mav)
          seenFileIds[mav] = true
        }
      }

      // 将 cloud:// 转为临时 HTTPS URL
      var convertAvatars = function (cb) {
        if (cloudFileIds.length === 0) return cb()
        wx.cloud.getTempFileURL({ fileList: cloudFileIds }).then(function (res) {
          var fileMap = {}
          var fileList = res.fileList || []
          for (var k = 0; k < fileList.length; k++) {
            if (fileList[k].tempFileURL) {
              fileMap[fileList[k].fileID] = fileList[k].tempFileURL
            }
          }
          cb(fileMap)
        }).catch(function () { cb() })
      }

      convertAvatars(function (fileMap) {
        fileMap = fileMap || {}

        var membersWithChar = members.map(function (m) {
          var displayAvatar = m.avatarUrl
          var fromFileMap = false
          if (fileMap[m.avatarUrl]) {
            displayAvatar = fileMap[m.avatarUrl]
            fromFileMap = true
          }
          // 并非来自 fileMap 的才需要检查（来自 fileMap 的是新鲜 temp URL，可直接使用）
          if (!fromFileMap) {
            // cloud:// 未能转换为 temp URL → 无法渲染 → 降级为空
            if (userUtils.isCloudFileID(displayAvatar)) {
              console.warn('[tripWorkspace] 成员头像 cloud:// 未能转换:', m.nickName)
              displayAvatar = ''
            }
            // 数据库中存了过期的 temp URL → 降级为空
            if (userUtils.isCloudTempUrl(displayAvatar)) {
              console.warn('[tripWorkspace] 成员头像为过期临时 URL:', m.nickName)
              displayAvatar = ''
            }
          }
          return {
            openid: m.openid,
            nickName: m.nickName,
            avatarUrl: displayAvatar,
            isCreator: m.isCreator,
            firstChar: (m.nickName || '?')[0]
          }
        })

        var displayUserAvatar = user ? (user.avatarUrl || '') : ''
        var userFromFileMap = false
        if (fileMap[displayUserAvatar]) {
          displayUserAvatar = fileMap[displayUserAvatar]
          userFromFileMap = true
        }
        // 并非来自 fileMap 的才需要检查（来自 fileMap 的是新鲜 temp URL，可直接使用）
        if (!userFromFileMap) {
          if (userUtils.isCloudFileID(displayUserAvatar)) {
            console.warn('[tripWorkspace] 当前用户头像 cloud:// 未能转换，使用占位符')
            displayUserAvatar = ''
          }
          if (userUtils.isCloudTempUrl(displayUserAvatar)) {
            console.warn('[tripWorkspace] 当前用户头像为过期临时 URL')
            displayUserAvatar = ''
          }
        }

        that.setData({
          trip: data.trip,
          memberCount: membersWithChar.length,
          members: membersWithChar,
          memberMap: memberMap,
          myOpenid: myOpenid,
          user: user,
          profileNickName: user ? (user.nickName || '') : '',
          profileAvatarUrl: displayUserAvatar,
          loading: false
        })
        that.loadTabData()

        if (user && !user.profileCompleted) {
          setTimeout(function () {
            that.setData({ showProfileModal: true })
          }, 600)
        }
      })
    }).catch(function (err) {
      console.error('[tripWorkspace] 加载失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  // 切换 tab（退出管理模式；数据懒加载：首次进入才拉取，之后切换不刷新，靠下拉刷新）
  switchTab: function (e) {
    var key = e.currentTarget.dataset.key
    if (key === this.data.activeTab) return
    this.setData({ activeTab: key, itineraryManaging: false, todoManaging: false })
    if (key === 'itinerary' && !this.data.itineraryLoaded) {
      this.loadItinerary()
    } else if (key === 'expenses' && !this.data.expensesLoaded) {
      this.refreshTripThenReloadExpenses()
    } else if (key === 'todos' && !this.data.todosLoaded) {
      this.loadTodos()
    } else if (key === 'settings' && !this.data.myTripsLoaded) {
      this.loadMyTrips()
    }
  },

  // 根据当前 tab 刷新对应数据（silent：下拉刷新模式，不显示 loading 转圈）
  loadTabData: function (silent) {
    if (this.data.activeTab === 'itinerary') {
      this.loadItinerary(silent)
    } else if (this.data.activeTab === 'expenses') {
      this.refreshTripThenReloadExpenses(silent)
    } else if (this.data.activeTab === 'todos') {
      this.loadTodos(silent)
    } else if (this.data.activeTab === 'settings') {
      this.loadMyTrips(silent)
    }
  },

  // 下拉刷新（scroll-view refresher）：静默刷新当前 tab 数据
  onPullDownRefresh: function () {
    if (this._pullingDown) return
    this._pullingDown = true
    this.setData({ refresherTriggered: true })
    this.loadTabData(true)
  },

  // 下拉刷新结束：收起 refresher 指示器
  finishPullDown: function () {
    this._pullingDown = false
    this.setData({ refresherTriggered: false })
  },

  // ===== 行程 =====
  toggleItineraryManage: function () {
    this.setData({ itineraryManaging: !this.data.itineraryManaging })
  },

  goScheduleMap: function () {
    var dates = []
    this.data.itineraryGroups.forEach(function (g) { dates.push(g.date) })
    var today = dates[0] || ''
    wx.navigateTo({ url: '/pages/schedule-map/schedule-map?tripId=' + this.data.tripId + '&date=' + today })
  },

  loadItinerary: function (silent) {
    var that = this
    if (!silent) {
      this.setData({ itineraryLoading: true, itineraryError: '' })
    }
    itineraryService.getItinerary(this.data.tripId).then(function (data) {
      var list = data.itinerary || []
      var now = new Date()
      var todayStr = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2)

      // 格式化行程项
      var formatted = list.map(function (item) {
        var hasEndTime = !!(item.endTime)
        var timeText = ''
        if (item.startTime && item.endTime) {
          timeText = item.startTime + ' - ' + item.endTime
        } else if (item.startTime) {
          timeText = item.startTime
        }
        var status = (item.date === todayStr) ? scheduleUtils.getScheduleStatus(item, now) : ''
        var isOngoing = (status === 'ongoing')
        var isEnded = (status === 'ended')
        var isUpcoming = (status === 'upcoming')
        var showActive = (item.date === todayStr) && (isOngoing || isUpcoming)

        return {
          _id: item._id,
          title: item.title,
          location: scheduleUtils.getDisplayLocation(item),
          locationAddress: scheduleUtils.getDisplayAddress(item),
          timeText: timeText,
          startTime: item.startTime || '',
          endTime: item.endTime || '',
          note: item.note,
          date: item.date,
          status: status,
          isOngoing: isOngoing,
          isEnded: isEnded,
          showActive: showActive,
          hasLocation: scheduleUtils.hasLocation(item)
        }
      })

      // 分组、排序、加序号、冲突检测
      var groups = scheduleUtils.groupSchedulesByDate(formatted)
      groups = scheduleUtils.addDailyScheduleIndex(groups)

      // 每日内冲突检测
      groups.forEach(function (group) {
        var conflicts = scheduleUtils.detectScheduleConflicts(group.items)
        var conflictMap = {}
        conflicts.forEach(function (c) {
          if (!conflictMap[c.itemAIndex]) conflictMap[c.itemAIndex] = []
          if (!conflictMap[c.itemBIndex]) conflictMap[c.itemBIndex] = []
          conflictMap[c.itemAIndex].push(c.itemB)
          conflictMap[c.itemBIndex].push(c.itemA)
        })
        group.items.forEach(function (item, idx) {
          item.conflictNames = (conflictMap[idx] || []).map(function (c) { return c.title }).join('、')
          item.hasConflict = !!(conflictMap[idx] && conflictMap[idx].length > 0)
        })
      })

      that.setData({
        itineraryGroups: groups,
        itineraryEmpty: groups.length === 0,
        itineraryLoading: false,
        itineraryLoaded: true,
        itineraryError: ''
      })
      if (silent) that.finishPullDown()
    }).catch(function (err) {
      if (silent) {
        console.error('[tripWorkspace] 行程刷新失败:', err)
        wx.showToast({ title: err.message || '行程刷新失败', icon: 'none' })
        that.finishPullDown()
        return
      }
      console.error('[tripWorkspace] 行程加载失败:', err)
      that.setData({
        itineraryLoading: false,
        itineraryLoaded: false,
        itineraryError: err.message || '行程加载失败'
      })
    })
  },

  retryLoadItinerary: function () {
    this.loadItinerary()
  },

  // 点击行程项跳转编辑
  goEditItinerary: function (e) {
    var id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/addItinerary/addItinerary?tripId=' + this.data.tripId + '&itineraryId=' + id })
  },

  deleteItinerary: function (e) {
    var that = this
    var id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这项行程吗？',
      success: function (res) {
        if (!res.confirm) return
        wx.showLoading({ title: '删除中...' })
        itineraryService.deleteItinerary(that.data.tripId, id).then(function () {
          wx.hideLoading()
          wx.showToast({ title: '已删除', icon: 'success' })
          that.loadItinerary()
        }).catch(function (err) {
          wx.hideLoading()
          wx.showToast({ title: err.message || '删除失败', icon: 'none' })
        })
      }
    })
  },

  goAddItinerary: function () {
    wx.navigateTo({ url: '/pages/addItinerary/addItinerary?tripId=' + this.data.tripId })
  },

  // ===== 账单 =====

  // 先刷新 trip 数据（获取最新 budget），再加载账单
  refreshTripThenReloadExpenses: function (silent) {
    var that = this
    tripService.getTripDetail(this.data.tripId).then(function (data) {
      // 只更新 trip 字段（含 budget），不动成员列表等
      that.setData({ trip: data.trip })
      that.loadExpenses(silent)
    }).catch(function () {
      // 即使刷新失败也照常加载账单
      that.loadExpenses(silent)
    })
  },

  loadExpenses: function (silent) {
    var that = this
    var memberMap = this.data.memberMap || {}

    if (!silent) {
      this.setData({ expensesLoading: true, expensesError: '' })
    }

    expenseService.getExpenses(this.data.tripId).then(function (data) {
      var rawExpenses = data.expenses || []

      // 账单签名：仅结算相关字段（金额/类型/付款人/参与人/存在性），用于判断数据是否真正变化
      var signature = rawExpenses.map(function (e) {
        var parts = (e.participantOpenids || []).slice().sort()
        return [e._id, e.type, e.amount, e.payerOpenid, parts.join(',')].join(':')
      }).sort().join('|')
      var billsChanged = (that._expenseSignature !== undefined && that._expenseSignature !== signature)
      that._expenseSignature = signature

      // 复用公共函数计算总消费（支出计入、入账扣减）
      var displayTotal = budgetUtils.calculateTotalExpense(rawExpenses)

      var expenses = rawExpenses.map(function (e) {
        var dateStr = ''
        if (e.createdAt) {
          var d = new Date(e.createdAt)
          dateStr = d.getFullYear() + '-' +
            ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
            ('0' + d.getDate()).slice(-2) + ' ' +
            ('0' + d.getHours()).slice(-2) + ':' +
            ('0' + d.getMinutes()).slice(-2)
        }
        return {
          _id: e._id,
          title: e.title,
          amount: e.amount || 0,
          amountText: (e.amount || 0).toFixed(2),
          payerName: memberMap[e.payerOpenid] || '未知',
          payerLabel: e.type === 'income' ? '收款人' : '付款人',
          participantCount: e.participantOpenids ? e.participantOpenids.length : 0,
          note: e.note,
          dateText: dateStr,
          createdBy: e.createdBy || '',
          categoryLabel: categoryUtils.getCategoryLabel(e),
          expenseType: e.type || 'expense'
        }
      })

      // 最近一笔账单时间（用于账单概览）
      var lastExpenseTime = ''
      if (rawExpenses.length > 0 && rawExpenses[0].createdAt) {
        var ld = new Date(rawExpenses[0].createdAt)
        lastExpenseTime = (ld.getMonth() + 1) + '月' + ld.getDate() + '日 ' +
          ('0' + ld.getHours()).slice(-2) + ':' + ('0' + ld.getMinutes()).slice(-2)
      }

      that.setData({
        expenses: expenses,
        expenseTotal: displayTotal.toFixed(2),
        expenseEmpty: expenses.length === 0,
        expensesLoading: false,
        expensesLoaded: true,
        expensesError: '',
        lastExpenseTime: lastExpenseTime
      })

      // 预算总览
      var tripBudget = (that.data.trip && that.data.trip.budget) || {}
      that.setData({
        budgetSummary: budgetUtils.calculateBudgetSummary(rawExpenses, tripBudget, that.data.memberCount),
        budgetLoaded: true
      })

      // 结算过期判定：仅当账单数据相对上次加载确实变化时才提示（单纯刷新不提示）
      if (billsChanged && that.data.settlementLoaded) {
        that.setData({ settlementStale: true })
      }
      if (silent) that.finishPullDown()
    }).catch(function (err) {
      if (silent) {
        console.error('[tripWorkspace] 账单刷新失败:', err)
        wx.showToast({ title: err.message || '账单刷新失败', icon: 'none' })
        that.finishPullDown()
        return
      }
      console.error('[tripWorkspace] 账单加载失败:', err)
      that.setData({
        expensesLoading: false,
        expensesLoaded: false,
        expensesError: err.message || '账单加载失败'
      })
    })
  },

  // 手动计算结算
  onCalculateSettlement: function () {
    var that = this
    if (this.data.expenseEmpty) {
      wx.showToast({ title: '暂无账单，暂不需要结算', icon: 'none' })
      return
    }
    this.setData({ settlementLoading: true, settlementError: '' })

    settlementService.calculateSettlement(this.data.tripId).then(function (data) {
      var balances = (data.balances || []).map(function (b) {
        var net = b.net || 0
        return {
          nickName: b.nickName || '',
          netText: (net >= 0 ? '+' : '') + net.toFixed(2),
          netClass: net >= 0 ? 'net-positive' : 'net-negative',
          paidText: (b.paid || 0).toFixed(2),
          shouldPayText: (b.shouldPay || 0).toFixed(2)
        }
      })

      var transfers = (data.transfers || []).map(function (t) {
        return {
          fromName: t.fromName || '',
          toName: t.toName || '',
          amountText: (t.amount || 0).toFixed(2)
        }
      })

      that.setData({
        balances: balances,
        transfers: transfers,
        hasSettlement: transfers.length > 0,
        settlementLoading: false,
        settlementLoaded: true,
        settlementStale: false
      })
    }).catch(function (err) {
      console.error('[tripWorkspace] 结算计算失败:', err)
      that.setData({
        settlementLoading: false,
        settlementError: err.message || '结算计算失败'
      })
    })
  },

  retryLoadExpenses: function () {
    this.loadExpenses()
  },

  goAddExpense: function () {
    wx.navigateTo({ url: '/pages/addExpense/addExpense?tripId=' + this.data.tripId })
  },

  goBudgetSetting: function () {
    wx.navigateTo({ url: '/pages/budget-setting/budget-setting?tripId=' + this.data.tripId })
  },

  onTapExpense: function (e) {
    var expenseId = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/expenseDetail/expenseDetail?tripId=' + this.data.tripId + '&expenseId=' + expenseId })
  },

  // ===== 待办 =====
  loadTodos: function (silent) {
    var that = this
    var memberMap = this.data.memberMap || {}
    if (!silent) {
      this.setData({ todosLoading: true, todosError: '' })
    }
    todoService.getTodos(this.data.tripId).then(function (data) {
      var todos = (data.todos || []).map(function (t) {
        // 格式化负责人员昵称
        var names = (t.assigneeOpenids || []).map(function (oid) {
          return memberMap[oid] || '未知'
        })
        var dateStr = ''
        if (t.createdAt) {
          var d = new Date(t.createdAt)
          dateStr = d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2)
        }
        var doneTime = ''
        if (t.completedAt) {
          var cd = new Date(t.completedAt)
          doneTime = cd.getFullYear() + '-' + ('0'+(cd.getMonth()+1)).slice(-2) + '-' + ('0'+cd.getDate()).slice(-2) + ' ' + ('0'+cd.getHours()).slice(-2) + ':' + ('0'+cd.getMinutes()).slice(-2)
        }
        return {
          _id: t._id, title: t.title, note: t.note,
          completed: t.completed,
          assigneeOpenids: t.assigneeOpenids || [],
          assigneeText: names.join('、'),
          dateText: dateStr,
          doneTime: doneTime
        }
      })
      that.setData({
        todosFull: todos,
        todosLoading: false,
        todosLoaded: true,
        todosError: ''
      })
      that.applyTodoFilter()
      if (silent) that.finishPullDown()
    }).catch(function (err) {
      if (silent) {
        console.error('[tripWorkspace] 待办刷新失败:', err)
        wx.showToast({ title: err.message || '待办刷新失败', icon: 'none' })
        that.finishPullDown()
        return
      }
      console.error('[tripWorkspace] 待办加载失败:', err)
      that.setData({
        todosLoading: false,
        todosLoaded: false,
        todosError: err.message || '待办加载失败'
      })
    })
  },

  retryLoadTodos: function () {
    this.loadTodos()
  },

  onTodoFilterChange: function (e) {
    var key = e.currentTarget.dataset.key
    if (key === this.data.todoFilter) return
    this.setData({ todoFilter: key })
    this.applyTodoFilter()
  },

  applyTodoFilter: function () {
    var full = this.data.todosFull || []
    var filter = this.data.todoFilter
    var filtered

    if (filter === 'unfinished') {
      filtered = full.filter(function (t) { return !t.completed })
    } else if (filter === 'finished') {
      filtered = full.filter(function (t) { return t.completed })
    } else {
      filtered = full.slice()
    }

    this.setData({ todos: filtered, todoEmpty: filtered.length === 0 })
  },

  toggleTodo: function (e) {
    var that = this
    var todoId = e.currentTarget.dataset.id
    var completed = e.currentTarget.dataset.completed
    todoService.updateTodoStatus(this.data.tripId, todoId, !completed).then(function () {
      that.loadTodos()
    }).catch(function (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    })
  },

  deleteTodo: function (e) {
    var that = this
    var todoId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这项待办吗？',
      success: function (res) {
        if (!res.confirm) return
        todoService.deleteTodo(that.data.tripId, todoId).then(function () {
          wx.showToast({ title: '已删除', icon: 'success' })
          that.loadTodos()
        }).catch(function (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' })
        })
      }
    })
  },

  toggleTodoManage: function () {
    this.setData({ todoManaging: !this.data.todoManaging })
  },

  goAddTodo: function () {
    wx.navigateTo({ url: '/pages/addTodo/addTodo?tripId=' + this.data.tripId })
  },

  // ===== 设置 =====
  loadMyTrips: function (silent) {
    var that = this
    tripService.getMyTrips().then(function (data) {
      // 只显示其他旅行（非当前）
      var others = (data.trips || []).filter(function (t) {
        return t._id !== that.data.tripId
      })
      that.setData({ myTrips: others, myTripsLoaded: true })
      if (silent) that.finishPullDown()
    }).catch(function (err) {
      console.error('[tripWorkspace] 我的旅行加载失败:', err)
      if (silent) {
        wx.showToast({ title: '我的旅行刷新失败', icon: 'none' })
        that.finishPullDown()
      }
    })
  },

  copyInviteCode: function () {
    var code = this.data.trip && this.data.trip.inviteCode
    if (!code) return
    wx.setClipboardData({
      data: code,
      success: function () { wx.showToast({ title: '邀请码已复制', icon: 'success' }) }
    })
  },

  switchToTrip: function (e) {
    var tripId = e.currentTarget.dataset.id
    wx.redirectTo({ url: '/pages/tripWorkspace/tripWorkspace?tripId=' + tripId })
  },

  // ===== 创建者移除成员 =====

  onRemoveMember: function (e) {
    var that = this
    var targetOpenid = e.currentTarget.dataset.openid
    wx.showModal({
      title: '确认移除该成员？',
      content: '移除后，该成员将无法继续访问本次旅行。其历史账单不会被删除，仍可能参与结算。',
      confirmText: '确认移除',
      confirmColor: '#E74C3C',
      success: function (res) {
        if (!res.confirm) return
        wx.showLoading({ title: '移除中...' })
        tripService.removeMember(that.data.tripId, targetOpenid).then(function () {
          wx.hideLoading()
          wx.showToast({ title: '已移除', icon: 'success' })
          that.loadTrip()
        }).catch(function (err) {
          wx.hideLoading()
          wx.showToast({ title: err.message || '移除失败', icon: 'none' })
        })
      }
    })
  },

  // ===== 旅行管理：解散 / 退出 =====

  // 创建者解散旅行（二次确认）
  onDissolveTrip: function () {
    var that = this
    wx.showModal({
      title: '确认解散旅行？',
      content: '解散后，所有成员都无法继续访问该旅行，相关行程、账单和待办也将不可再使用。',
      confirmText: '确认解散',
      confirmColor: '#E74C3C',
      success: function (res) {
        if (!res.confirm) return
        wx.showLoading({ title: '解散中...' })
        tripService.dissolveTrip(that.data.tripId).then(function () {
          wx.hideLoading()
          wx.showToast({ title: '旅行已解散', icon: 'success' })
          setTimeout(function () {
            wx.reLaunch({ url: '/pages/index/index' })
          }, 1000)
        }).catch(function (err) {
          wx.hideLoading()
          wx.showToast({ title: err.message || '解散失败', icon: 'none' })
        })
      }
    })
  },

  // 普通成员退出旅行（二次确认）
  onLeaveTrip: function () {
    var that = this
    wx.showModal({
      title: '确认退出旅行？',
      content: '退出后，你将无法继续查看本次旅行的行程、账单和待办。退出不会删除你已经创建或参与的历史账单。',
      confirmText: '确认退出',
      confirmColor: '#E74C3C',
      success: function (res) {
        if (!res.confirm) return
        wx.showLoading({ title: '退出中...' })
        tripService.leaveTrip(that.data.tripId).then(function () {
          wx.hideLoading()
          wx.showToast({ title: '已退出旅行', icon: 'success' })
          setTimeout(function () {
            wx.reLaunch({ url: '/pages/index/index' })
          }, 1000)
        }).catch(function (err) {
          wx.hideLoading()
          wx.showToast({ title: err.message || '退出失败', icon: 'none' })
        })
      }
    })
  },

  // ===== 用户资料编辑 =====
  openProfileModal: function () {
    var that = this
    var user = this.data.user || getApp().globalData.user || {}
    var avatarUrl = user.avatarUrl || ''

    if (userUtils.isCloudFileID(avatarUrl)) {
      wx.cloud.getTempFileURL({ fileList: [avatarUrl] }).then(function (res) {
        var tmp = (res.fileList && res.fileList[0]) ? res.fileList[0].tempFileURL : ''
        that.setData({ showProfileModal: true, profileNickName: user.nickName || '', profileAvatarUrl: tmp, hasNewAvatar: false })
      }).catch(function () {
        that.setData({ showProfileModal: true, profileNickName: user.nickName || '', profileAvatarUrl: '', hasNewAvatar: false })
      })
    } else if (userUtils.isCloudTempUrl(avatarUrl)) {
      // 旧数据中可能存了过期的 tempFileURL → 无法恢复，显示默认头像
      console.warn('[tripWorkspace] 头像地址为过期临时 URL，使用默认头像')
      this.setData({
        showProfileModal: true,
        profileNickName: user.nickName || '',
        profileAvatarUrl: '',
        hasNewAvatar: false
      })
    } else {
      this.setData({
        showProfileModal: true,
        profileNickName: user.nickName || '',
        profileAvatarUrl: avatarUrl,
        hasNewAvatar: false
      })
    }
  },

  closeProfileModal: function () {
    this.setData({ showProfileModal: false })
  },

  // 头像加载失败时隐藏该 image，显示占位符
  onProfileAvatarError: function () {
    console.warn('[tripWorkspace] 头像加载失败，使用默认占位')
    this.setData({ profileAvatarUrl: '' })
  },

  onMemberAvatarError: function (e) {
    var idx = e.currentTarget.dataset.index
    console.warn('[tripWorkspace] 成员头像加载失败, index:', idx)
    // 清空对应成员的 avatarUrl，触发 wx:else 显示占位符
    if (idx !== undefined) {
      var members = this.data.members
      members[idx].avatarUrl = ''
      this.setData({ members: members })
    }
  },

  onChooseAvatar: function (e) {
    var avatarUrl = e.detail.avatarUrl
    this.setData({ profileAvatarUrl: avatarUrl, hasNewAvatar: true })
  },

  onProfileNickInput: function (e) {
    this.setData({ profileNickName: e.detail.value })
  },

  saveProfile: function () {
    var that = this
    var nickName = (this.data.profileNickName || '').trim()
    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (nickName.length > 20) {
      wx.showToast({ title: '昵称不能超过 20 个字符', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    var doSave = function (finalAvatarUrl) {
      userService.updateUserProfile({
        nickName: nickName,
        avatarUrl: finalAvatarUrl || ''
      }).then(function (res) {
        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })

        var app = getApp()
        app.globalData.user = res.user
        that.setData({
          user: res.user,
          showProfileModal: false,
          profileNickName: res.user.nickName,
          profileAvatarUrl: res.user.avatarUrl || ''
        })
        that.loadTrip()
      }).catch(function (err) {
        wx.hideLoading()
        wx.showToast({ title: err.message || '保存失败', icon: 'none' })
      })
    }

    var avatarUrl = this.data.profileAvatarUrl || ''
    var hasNewAvatar = this.data.hasNewAvatar

    if (hasNewAvatar) {
      // 用户选择了新头像
      // 判定是否需要上传：不是 cloud:// 永久文件、不是过期 CloudBase temp URL → 即本地临时路径
      var isLocalPath = avatarUrl && !userUtils.isCloudFileID(avatarUrl) && !userUtils.isCloudTempUrl(avatarUrl)

      if (isLocalPath) {
        console.log('[tripWorkspace] 上传新头像, 本地路径:', avatarUrl)
        var cloudPath = 'avatars/' + (getApp().globalData.openid || 'user') + '_' + Date.now() + '.png'
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: avatarUrl
        }).then(function (uploadRes) {
          console.log('[tripWorkspace] 头像上传成功, fileID:', uploadRes.fileID)
          doSave(uploadRes.fileID)
        }).catch(function (err) {
          console.error('[tripWorkspace] 头像上传失败:', err)
          wx.hideLoading()
          wx.showToast({ title: '头像上传失败，请重试', icon: 'none' })
        })
      } else if (userUtils.isCloudFileID(avatarUrl)) {
        // 已是 cloud:// fileID → 直接保存
        doSave(avatarUrl)
      } else {
        // 空值或过期 URL → 清空头像
        doSave('')
      }
    } else {
      // 用户未选择新头像：使用数据库中已有的 cloud:// fileID，防止保存临时的 tempFileURL
      var storedAvatar = (this.data.user && this.data.user.avatarUrl) || ''
      // 只有当存储的是 cloud:// fileID 时才使用；过期 temp URL 保留原样不覆盖
      if (userUtils.isCloudFileID(storedAvatar)) {
        doSave(storedAvatar)
      } else if (userUtils.isCloudTempUrl(storedAvatar)) {
        // 旧数据中已存在过期 temp URL → 不更新头像字段，等用户下次主动更换
        console.warn('[tripWorkspace] 检测到数据库中为过期临时 URL，跳过头像更新')
        doSave(storedAvatar)
      } else {
        doSave(avatarUrl)
      }
    }
  }
})
