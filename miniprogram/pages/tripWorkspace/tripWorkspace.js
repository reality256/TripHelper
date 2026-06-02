// pages/tripWorkspace/tripWorkspace.js
// V2 核心页面：旅行工作台
var tripService = require('../../services/tripService')
var itineraryService = require('../../services/itineraryService')
var expenseService = require('../../services/expenseService')
var settlementService = require('../../services/settlementService')
var todoService = require('../../services/todoService')
var userService = require('../../services/userService')

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

    // 底部菜单
    tabs: [
      { key: 'itinerary', label: '行程', icon: '📋' },
      { key: 'expenses', label: '账单', icon: '💰' },
      { key: 'todos', label: '待办', icon: '✅' },
      { key: 'settings', label: '设置', icon: '⚙' }
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

    // 待办模块
    todos: [],
    todoEmpty: true,
    todoManaging: false,
    todosLoading: false,
    todosLoaded: false,
    todosError: '',

    // 设置模块
    myTrips: [],
    myOpenid: ''
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
        this.setData({
          user: user,
          profileNickName: user.nickName || '',
          profileAvatarUrl: user.avatarUrl || ''
        })
      }
      this.loadTabData()
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

      var membersWithChar = members.map(function (m) {
        return {
          openid: m.openid,
          nickName: m.nickName,
          avatarUrl: m.avatarUrl,
          isCreator: m.isCreator,
          firstChar: (m.nickName || '?')[0]
        }
      })

      that.setData({
        trip: data.trip,
        memberCount: membersWithChar.length,
        members: membersWithChar,
        memberMap: memberMap,
        myOpenid: myOpenid,
        user: user,
        profileNickName: user ? (user.nickName || '') : '',
        profileAvatarUrl: user ? (user.avatarUrl || '') : '',
        loading: false
      })
      that.loadTabData()

      // 如果用户资料未完善，弹出资料设置弹窗
      if (user && !user.profileCompleted) {
        setTimeout(function () {
          that.setData({ showProfileModal: true })
        }, 600)
      }
    }).catch(function (err) {
      console.error('[tripWorkspace] 加载失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  // 切换 tab（退出管理模式）
  switchTab: function (e) {
    var key = e.currentTarget.dataset.key
    if (key === this.data.activeTab) return
    this.setData({ activeTab: key, itineraryManaging: false, todoManaging: false })
    this.loadTabData()
  },

  // 根据当前 tab 加载对应数据
  loadTabData: function () {
    if (this.data.activeTab === 'itinerary') {
      this.loadItinerary()
    } else if (this.data.activeTab === 'expenses') {
      this.loadExpenses()
    } else if (this.data.activeTab === 'todos') {
      this.loadTodos()
    } else if (this.data.activeTab === 'settings') {
      // 设置 tab 数据在 loadTrip 中已加载（members, trip, inviteCode）
      this.loadMyTrips()
    }
  },

  // ===== 行程 =====
  toggleItineraryManage: function () {
    this.setData({ itineraryManaging: !this.data.itineraryManaging })
  },

  loadItinerary: function () {
    var that = this
    this.setData({ itineraryLoading: true, itineraryError: '' })
    itineraryService.getItinerary(this.data.tripId).then(function (data) {
      var list = data.itinerary || []
      var groupMap = {}
      list.forEach(function (item) {
        var d = item.date
        if (!groupMap[d]) groupMap[d] = { date: d, items: [] }
        groupMap[d].items.push({
          _id: item._id,
          title: item.title,
          location: item.location,
          timeText: item.startTime && item.endTime ? item.startTime + ' - ' + item.endTime :
                    item.startTime || item.endTime || '',
          note: item.note
        })
      })
      var groups = []
      for (var k in groupMap) {
        if (groupMap.hasOwnProperty(k)) groups.push(groupMap[k])
      }
      groups.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0 })
      that.setData({
        itineraryGroups: groups,
        itineraryEmpty: groups.length === 0,
        itineraryLoading: false,
        itineraryLoaded: true,
        itineraryError: ''
      })
    }).catch(function (err) {
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
  loadExpenses: function () {
    var that = this
    var memberMap = this.data.memberMap || {}

    this.setData({
      expensesLoading: true, expensesError: '',
      settlementLoading: true
    })

    // 同时加载账单和结算
    var p1 = expenseService.getExpenses(this.data.tripId)
    var p2 = settlementService.calculateSettlement(this.data.tripId)

    Promise.all([p1, p2]).then(function (results) {
      var expenseData = results[0]
      var settlementData = results[1]

      // 格式化账单列表
      var expenses = (expenseData.expenses || []).map(function (e) {
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
          amountText: (e.amount || 0).toFixed(2),
          payerName: memberMap[e.payerOpenid] || '未知',
          participantCount: e.participantOpenids ? e.participantOpenids.length : 0,
          note: e.note,
          dateText: dateStr
        }
      })

      // 格式化结算数据（防御 undefined）
      var balances = (settlementData.balances || []).map(function (b) {
        var net = b.net || 0
        var paid = b.paid || 0
        var shouldPay = b.shouldPay || 0
        return {
          nickName: b.nickName || '',
          netText: (net >= 0 ? '+' : '') + net.toFixed(2),
          netClass: net >= 0 ? 'net-positive' : 'net-negative',
          paidText: paid.toFixed(2),
          shouldPayText: shouldPay.toFixed(2)
        }
      })

      var transfers = (settlementData.transfers || []).map(function (t) {
        return {
          fromName: t.fromName || '',
          toName: t.toName || '',
          amountText: (t.amount || 0).toFixed(2)
        }
      })

      that.setData({
        expenses: expenses,
        expenseTotal: (expenseData.totalAmount || 0).toFixed(2),
        expenseEmpty: expenses.length === 0,
        expensesLoading: false,
        expensesLoaded: true,
        expensesError: '',
        balances: balances,
        transfers: transfers,
        hasSettlement: balances.length > 0,
        settlementLoading: false,
        settlementLoaded: true
      })
    }).catch(function (err) {
      console.error('[tripWorkspace] 账单加载失败:', err)
      that.setData({
        expensesLoading: false,
        expensesLoaded: false,
        expensesError: err.message || '账单加载失败',
        settlementLoading: false,
        settlementLoaded: false
      })
    })
  },

  retryLoadExpenses: function () {
    this.loadExpenses()
  },

  goAddExpense: function () {
    wx.navigateTo({ url: '/pages/addExpense/addExpense?tripId=' + this.data.tripId })
  },

  // ===== 待办 =====
  loadTodos: function () {
    var that = this
    var memberMap = this.data.memberMap || {}
    this.setData({ todosLoading: true, todosError: '' })
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
          assigneeText: names.join('、'),
          dateText: dateStr,
          doneTime: doneTime
        }
      })
      that.setData({
        todos: todos,
        todoEmpty: todos.length === 0,
        todosLoading: false,
        todosLoaded: true,
        todosError: ''
      })
    }).catch(function (err) {
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
  loadMyTrips: function () {
    var that = this
    tripService.getMyTrips().then(function (data) {
      // 只显示其他旅行（非当前）
      var others = (data.trips || []).filter(function (t) {
        return t._id !== that.data.tripId
      })
      that.setData({ myTrips: others })
    }).catch(function (err) {
      console.error('[tripWorkspace] 我的旅行加载失败:', err)
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

  // ===== 用户资料编辑 =====
  openProfileModal: function () {
    var user = this.data.user || getApp().globalData.user || {}
    this.setData({
      showProfileModal: true,
      profileNickName: user.nickName || '',
      profileAvatarUrl: user.avatarUrl || ''
    })
  },

  closeProfileModal: function () {
    this.setData({ showProfileModal: false })
  },

  onChooseAvatar: function (e) {
    var avatarUrl = e.detail.avatarUrl
    this.setData({ profileAvatarUrl: avatarUrl })
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
    // 只有微信临时路径才需要上传云存储
    var isTempPath = avatarUrl && (
      avatarUrl.indexOf('wxfile://') === 0 ||
      avatarUrl.indexOf('http://tmp/') === 0
    )

    if (isTempPath) {
      var cloudPath = 'avatars/' + (getApp().globalData.openid || 'user') + '_' + Date.now() + '.png'
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: avatarUrl
      }).then(function (uploadRes) {
        doSave(uploadRes.fileID)
      }).catch(function (err) {
        console.error('[tripWorkspace] 头像上传失败:', err)
        wx.hideLoading()
        wx.showToast({ title: '头像上传失败，请重试', icon: 'none' })
        that.setData({ submitting: false })
      })
    } else {
      // 无头像或已是云端 fileID → 直接保存
      doSave(avatarUrl)
    }
  }
})
