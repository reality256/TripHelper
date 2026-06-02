// pages/expenseDetail/expenseDetail.js
var expenseService = require('../../services/expenseService')
var tripService = require('../../services/tripService')
var categoryUtils = require('../../utils/expenseCategory')
var app = getApp()

Page({
  data: {
    tripId: '',
    expenseId: '',
    loading: true,
    expense: null,
    payerName: '',
    participantNames: '',
    perPerson: '',
    categoryLabel: '',
    typeText: '',
    isIncome: false,
    payerLabel: '付款人',
    participantLabel: '参与分摊',
    amountText: '0.00',
    dateText: '',
    canManage: false
  },

  onLoad: function (options) {
    if (options.tripId && options.expenseId) {
      this.setData({ tripId: options.tripId, expenseId: options.expenseId })
      this.loadDetail()
    }
  },

  loadDetail: function () {
    var that = this
    this.setData({ loading: true })

    expenseService.getExpenseDetail(this.data.tripId, this.data.expenseId).then(function (data) {
      var exp = data.expense
      var trip = null

      // 获取 trip 信息以判断权限
      tripService.getTripDetail(that.data.tripId).then(function (tripData) {
        trip = tripData.trip
        that.finishLoad(exp, tripData.members, trip)
      }).catch(function () {
        that.finishLoad(exp, [], null)
      })
    }).catch(function (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      that.setData({ loading: false })
    })
  },

  finishLoad: function (exp, members, trip) {
    var myOpenid = app.globalData.openid || ''

    // 成员昵称映射
    var nameMap = {}
    members.forEach(function (m) { nameMap[m.openid] = m.nickName })

    // 付款人
    var payerName = nameMap[exp.payerOpenid] || '未知'

    // 参与分摊人
    var pNames = (exp.participantOpenids || []).map(function (oid) {
      return nameMap[oid] || '未知'
    })

    // 人均
    var count = (exp.participantOpenids || []).length || 1
    var perPerson = (exp.amount / count).toFixed(2)

    // 日期格式化
    var dateStr = ''
    if (exp.createdAt) {
      var d = new Date(exp.createdAt)
      dateStr = d.getFullYear() + '-' +
        ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
        ('0' + d.getDate()).slice(-2) + ' ' +
        ('0' + d.getHours()).slice(-2) + ':' +
        ('0' + d.getMinutes()).slice(-2)
    }

    // 权限判断
    var canManage = false
    if (trip) {
      canManage = exp.createdBy === myOpenid || trip.creatorOpenid === myOpenid
    }

    this.setData({
      loading: false,
      expense: exp,
      amountText: Number(exp.amount || 0).toFixed(2),
      payerName: payerName,
      participantNames: pNames.join('、'),
      perPerson: perPerson,
      categoryLabel: categoryUtils.getCategoryLabel(exp),
      typeText: exp.type === 'income' ? '入账' : '支出',
      isIncome: exp.type === 'income',
      payerLabel: exp.type === 'income' ? '收款人' : '付款人',
      participantLabel: exp.type === 'income' ? '入账归属' : '参与分摊',
      dateText: dateStr,
      canManage: canManage
    })
  },

  // 右上角更多操作
  onMoreAction: function () {
    var that = this
    wx.showActionSheet({
      itemList: ['编辑账单', '删除账单'],
      itemColor: '#E74C3C',
      success: function (res) {
        if (res.tapIndex === 0) {
          // 编辑
          wx.navigateTo({
            url: '/pages/addExpense/addExpense?tripId=' + that.data.tripId + '&expenseId=' + that.data.expenseId
          })
        } else if (res.tapIndex === 1) {
          // 删除
          wx.showModal({
            title: '确认删除账单？',
            content: '删除后，该账单将从列表中消失，不再参与结算。此操作不可撤销。',
            confirmText: '确认删除',
            confirmColor: '#E74C3C',
            success: function (modalRes) {
              if (!modalRes.confirm) return
              wx.showLoading({ title: '删除中...' })
              expenseService.deleteExpense(that.data.tripId, that.data.expenseId).then(function () {
                wx.hideLoading()
                wx.showToast({ title: '已删除', icon: 'success' })
                setTimeout(function () { wx.navigateBack() }, 1000)
              }).catch(function (err) {
                wx.hideLoading()
                wx.showToast({ title: err.message || '删除失败', icon: 'none' })
              })
            }
          })
        }
      }
    })
  }
})
