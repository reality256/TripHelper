// pages/addExpense/addExpense.js
var tripService = require('../../services/tripService')
var expenseService = require('../../services/expenseService')
var app = getApp()

Page({
  data: {
    tripId: '',
    title: '',
    amount: '',
    note: '',
    members: [],
    memberList: [],
    payerOpenid: '',
    participantOpenids: [],
    splitHint: '',
    submitting: false
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
      var members = data.members
      var myOpenid = app.globalData.openid
      that.setData({
        members: members,
        payerOpenid: myOpenid,
        participantOpenids: members.map(function (m) { return m.openid })
      })
      that.refreshMemberList()
    }).catch(function (err) {
      console.error('[addExpense] 加载成员失败:', err)
      wx.showToast({ title: '加载成员失败', icon: 'none' })
    })
  },

  // 刷新成员列表的展示标记
  refreshMemberList: function () {
    var that = this
    var payerOpenid = this.data.payerOpenid
    var participantOpenids = this.data.participantOpenids
    var amount = Number(this.data.amount) || 0
    var count = participantOpenids.length

    var list = this.data.members.map(function (m) {
      var isPayer = m.openid === payerOpenid
      var isParticipant = participantOpenids.indexOf(m.openid) !== -1
      var perAmount = ''
      if (isParticipant && amount > 0 && count > 0) {
        perAmount = (amount / count).toFixed(2)
      }
      return {
        openid: m.openid,
        nickName: m.nickName,
        avatarUrl: m.avatarUrl,
        isCreator: m.isCreator,
        isPayer: isPayer,
        isParticipant: isParticipant,
        perAmount: perAmount
      }
    })

    var splitHint = ''
    if (amount > 0 && count > 0) {
      splitHint = '共 ' + count + ' 人，每人 ¥' + (amount / count).toFixed(2)
    }

    this.setData({
      memberList: list,
      splitHint: splitHint
    })
  },

  onTitleInput: function (e) { this.setData({ title: e.detail.value }) },
  onAmountInput: function (e) {
    this.setData({ amount: e.detail.value })
    this.refreshMemberList()
  },
  onNoteInput: function (e) { this.setData({ note: e.detail.value }) },

  // 选择付款人（单选）
  onSelectPayer: function (e) {
    this.setData({ payerOpenid: e.currentTarget.dataset.openid })
    this.refreshMemberList()
  },

  // 切换分摊成员（多选）
  onToggleParticipant: function (e) {
    var openid = e.currentTarget.dataset.openid
    var list = this.data.participantOpenids.slice()
    var idx = list.indexOf(openid)
    if (idx === -1) {
      list.push(openid)
    } else {
      list.splice(idx, 1)
    }
    this.setData({ participantOpenids: list })
    this.refreshMemberList()
  },

  onSubmit: function () {
    var that = this

    if (!this.data.title || !this.data.title.trim()) {
      wx.showToast({ title: '请输入账单标题', icon: 'none' }); return
    }
    if (!this.data.amount || Number(this.data.amount) <= 0) {
      wx.showToast({ title: '金额必须大于 0', icon: 'none' }); return
    }
    if (!this.data.payerOpenid) {
      wx.showToast({ title: '请选择付款人', icon: 'none' }); return
    }
    if (!this.data.participantOpenids || this.data.participantOpenids.length === 0) {
      wx.showToast({ title: '请至少选择一位分摊成员', icon: 'none' }); return
    }

    if (this.data.submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...' })

    expenseService.addExpense({
      tripId: this.data.tripId,
      title: this.data.title.trim(),
      amount: Number(this.data.amount),
      payerOpenid: this.data.payerOpenid,
      participantOpenids: this.data.participantOpenids,
      note: this.data.note || ''
    }).then(function () {
      wx.hideLoading()
      wx.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(function () {
        wx.navigateBack()
      }, 1000)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '添加失败', icon: 'none' })
    })
  }
})
