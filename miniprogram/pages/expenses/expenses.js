// pages/expenses/expenses.js
var expenseService = require('../../services/expenseService')

Page({
  data: {
    tripId: '',
    expenses: [],
    totalAmount: '0.00',
    loading: true
  },

  onLoad: function (options) {
    if (options.tripId) this.setData({ tripId: options.tripId })
  },

  onShow: function () {
    if (this.data.tripId) {
      this.loadExpenses()
    }
  },

  loadExpenses: function () {
    var that = this
    this.setData({ loading: true })

    expenseService.getExpenses(this.data.tripId).then(function (data) {
      // 格式化时间戳和金额
      var expenses = data.expenses.map(function (e) {
        var dateStr = ''
        if (e.createdAt) {
          var d = new Date(e.createdAt)
          var y = d.getFullYear()
          var M = ('0' + (d.getMonth() + 1)).slice(-2)
          var D = ('0' + d.getDate()).slice(-2)
          var h = ('0' + d.getHours()).slice(-2)
          var m = ('0' + d.getMinutes()).slice(-2)
          var s = ('0' + d.getSeconds()).slice(-2)
          dateStr = y + '-' + M + '-' + D + ' ' + h + ':' + m + ':' + s
        }
        return {
          _id: e._id,
          title: e.title,
          amount: e.amount,
          amountText: e.amount.toFixed(2),
          participantCount: e.participantOpenids ? e.participantOpenids.length : 0,
          note: e.note,
          createdAt: dateStr
        }
      })

      that.setData({
        expenses: expenses,
        totalAmount: (data.totalAmount || 0).toFixed(2),
        loading: false
      })
    }).catch(function (err) {
      console.error('[expenses] 加载失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  goAddExpense: function () {
    wx.navigateTo({ url: '/pages/addExpense/addExpense?tripId=' + this.data.tripId })
  }
})
