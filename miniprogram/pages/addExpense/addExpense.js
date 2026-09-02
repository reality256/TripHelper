// pages/addExpense/addExpense.js
// 支持新增和编辑两种模式
//  新增：/pages/addExpense/addExpense?tripId=xxx
//  编辑：/pages/addExpense/addExpense?tripId=xxx&expenseId=yyy
var tripService = require('../../services/tripService')
var expenseService = require('../../services/expenseService')
var categoryUtils = require('../../utils/expenseCategory')
var amountUtils = require('../../utils/amount')
var app = getApp()

Page({
  data: {
    tripId: '',
    expenseId: '',
    isEdit: false,
    title: '',
    amount: '',
    note: '',
    type: 'expense',
    category: 'food',
    customCategory: '',
    categories: categoryUtils.CATEGORIES,
    members: [],
    memberList: [],
    payerOpenid: '',
    participantOpenids: [],
    splitHint: '',
    submitting: false,
    memberError: ''
  },

  onLoad: function (options) {
    if (options.tripId) {
      var isEdit = !!(options.expenseId)
      this.setData({
        tripId: options.tripId,
        expenseId: options.expenseId || '',
        isEdit: isEdit
      })
      if (isEdit) {
        this.loadExpenseDetail()
      } else {
        this.loadMembers()
      }
    }
  },

  // 编辑模式：加载账单详情并回显
  loadExpenseDetail: function () {
    var that = this
    wx.showLoading({ title: '加载中...' })
    expenseService.getExpenseDetail(this.data.tripId, this.data.expenseId).then(function (data) {
      wx.hideLoading()
      var exp = data.expense
      // 先加载成员列表，再回显
      that.loadMembers(function () {
        that.setData({
          title: exp.title || '',
          amount: String(exp.amount || ''),
          note: exp.note || '',
          type: exp.type || 'expense',
          category: exp.category || 'food',
          customCategory: exp.customCategory || '',
          payerOpenid: exp.payerOpenid || '',
          participantOpenids: exp.participantOpenids || []
        })
        that.refreshMemberList()
      })
    }).catch(function (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      setTimeout(function () { wx.navigateBack() }, 1500)
    })
  },

  loadMembers: function (cb) {
    var that = this
    tripService.getTripDetail(this.data.tripId).then(function (data) {
      var members = data.members
      var myOpenid = app.globalData.openid
      // 编辑模式下不覆盖已选中的付款人
      var payer = that.data.isEdit ? (that.data.payerOpenid || myOpenid) : myOpenid
      var participants = that.data.isEdit ? that.data.participantOpenids : members.map(function (m) { return m.openid })
      that.setData({
        members: members,
        payerOpenid: payer,
        participantOpenids: participants
      })
      that.refreshMemberList()
      if (cb) cb()
    }).catch(function (err) {
      console.error('[addExpense] 加载成员失败:', err)
      if (that.data.isEdit) {
        // 编辑模式：成员加载失败中断回显，避免看不到分摊人却可提交
        wx.hideLoading()
        wx.showToast({ title: '成员加载失败，请稍后重试', icon: 'none' })
        setTimeout(function () { wx.navigateBack() }, 1500)
        return
      }
      that.setData({ memberError: '成员加载失败' })
      if (cb) cb()
    })
  },

  retryLoadMembers: function () {
    this.setData({ memberError: '' })
    this.loadMembers()
  },

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
        avatarUrl: m.avatarUrl || '',
        isCreator: m.isCreator,
        isPayer: isPayer,
        isParticipant: isParticipant,
        perAmount: perAmount
      }
    })

    var splitHint = ''
    if (amount > 0 && count > 0) {
      var prefix = this.data.type === 'income' ? '共 ' + count + ' 人归属，每人抵扣 ¥' : '共 ' + count + ' 人，每人 ¥'
      splitHint = prefix + (amount / count).toFixed(2)
    }

    this.setData({ memberList: list, splitHint: splitHint })
  },

  onTitleInput: function (e) { this.setData({ title: e.detail.value }) },
  onAmountInput: function (e) {
    var val = amountUtils.formatAmountInput(e.detail.value)
    this.setData({ amount: val })
    this.refreshMemberList()
  },
  onNoteInput: function (e) { this.setData({ note: e.detail.value }) },

  onToggleType: function () {
    this.setData({ type: this.data.type === 'income' ? 'expense' : 'income' })
  },
  onSelectCategory: function (e) {
    this.setData({ category: e.currentTarget.dataset.key })
  },
  onCustomCategoryInput: function (e) {
    this.setData({ customCategory: e.detail.value })
  },

  onSelectPayer: function (e) {
    this.setData({ payerOpenid: e.currentTarget.dataset.openid })
    this.refreshMemberList()
  },

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
    var amtResult = amountUtils.validateAmount(this.data.amount)
    if (!amtResult.valid) {
      wx.showToast({ title: amtResult.message, icon: 'none' }); return
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

    var payload = {
      tripId: this.data.tripId,
      title: this.data.title.trim(),
      amount: amtResult.value,
      payerOpenid: this.data.payerOpenid,
      participantOpenids: this.data.participantOpenids,
      note: this.data.note || '',
      type: this.data.type,
      category: this.data.category,
      customCategory: this.data.category === 'other' ? (this.data.customCategory || '').slice(0, 10) : ''
    }

    var promise
    if (this.data.isEdit) {
      payload.expenseId = this.data.expenseId
      promise = expenseService.updateExpense(payload)
    } else {
      promise = expenseService.addExpense(payload)
    }

    promise.then(function () {
      wx.hideLoading()
      wx.showToast({ title: that.data.isEdit ? '修改成功' : '添加成功', icon: 'success' })
      setTimeout(function () { wx.navigateBack() }, 1000)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '提交失败', icon: 'none' })
    })
  }
})
