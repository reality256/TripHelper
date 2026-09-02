// pages/addTodo/addTodo.js
var tripService = require('../../services/tripService')
var todoService = require('../../services/todoService')

Page({
  data: {
    tripId: '', title: '', note: '',
    members: [], memberList: [], assigneeOpenids: [],
    submitting: false,
    memberError: ''
  },

  onLoad: function (options) {
    if (options.tripId) {
      this.setData({ tripId: options.tripId })
      this.loadMembers()
    }
  },

  loadMembers: function () {
    var that = this
    tripService.getTripDetail(this.data.tripId).then(function (data) {
      var members = data.members || []
      that.setData({
        members: members,
        assigneeOpenids: members.map(function (m) { return m.openid })
      })
      that.refreshMemberList()
    }).catch(function (err) {
      console.error('[addTodo] 加载成员失败:', err)
      that.setData({ memberError: '成员加载失败' })
    })
  },

  retryLoadMembers: function () {
    this.setData({ memberError: '' })
    this.loadMembers()
  },

  refreshMemberList: function () {
    var that = this
    var selected = this.data.assigneeOpenids
    var list = this.data.members.map(function (m) {
      return {
        openid: m.openid, nickName: m.nickName,
        isSelected: selected.indexOf(m.openid) !== -1
      }
    })
    this.setData({ memberList: list })
  },

  onTitleInput: function (e) { this.setData({ title: e.detail.value }) },
  onNoteInput: function (e) { this.setData({ note: e.detail.value }) },

  onToggleAssignee: function (e) {
    var openid = e.currentTarget.dataset.openid
    var list = this.data.assigneeOpenids.slice()
    var idx = list.indexOf(openid)
    if (idx === -1) list.push(openid)
    else list.splice(idx, 1)
    this.setData({ assigneeOpenids: list })
    this.refreshMemberList()
  },

  onSubmit: function () {
    var that = this
    if (!this.data.title || !this.data.title.trim()) {
      wx.showToast({ title: '请输入待办标题', icon: 'none' }); return
    }
    if (!this.data.assigneeOpenids || this.data.assigneeOpenids.length === 0) {
      wx.showToast({ title: '请至少选择一位负责人', icon: 'none' }); return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...' })

    todoService.addTodo({
      tripId: this.data.tripId,
      title: this.data.title.trim(),
      note: this.data.note || '',
      assigneeOpenids: this.data.assigneeOpenids
    }).then(function () {
      wx.hideLoading()
      wx.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(function () { wx.navigateBack() }, 1000)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '添加失败', icon: 'none' })
    })
  }
})
