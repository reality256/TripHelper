// pages/settlement/settlement.js
var settlementService = require('../../services/settlementService')

Page({
  data: {
    tripId: '',
    balances: [],
    transfers: [],
    loading: true
  },

  onLoad: function (options) {
    if (options.tripId) {
      this.setData({ tripId: options.tripId })
    }
  },

  onShow: function () {
    if (this.data.tripId) {
      this.loadSettlement()
    }
  },

  loadSettlement: function () {
    var that = this
    this.setData({ loading: true })

    settlementService.calculateSettlement(this.data.tripId).then(function (data) {
      // 预处理显示格式
      var balances = data.balances.map(function (b) {
        var netText = (b.net >= 0 ? '+' : '') + b.net.toFixed(2)
        var netClass = b.net >= 0 ? 'net-positive' : 'net-negative'
        return {
          openid: b.openid,
          nickName: b.nickName,
          avatarUrl: b.avatarUrl,
          netText: netText,
          netClass: netClass,
          paidText: b.paid.toFixed(2),
          shouldPayText: b.shouldPay.toFixed(2)
        }
      })

      var transfers = data.transfers.map(function (t) {
        return {
          fromName: t.fromName,
          toName: t.toName,
          amountText: t.amount.toFixed(2)
        }
      })

      that.setData({
        balances: balances,
        transfers: transfers,
        loading: false
      })
    }).catch(function (err) {
      console.error('[settlement] 加载失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  }
})
