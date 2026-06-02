// pages/joinTrip/joinTrip.js
var tripService = require('../../services/tripService')

Page({
  data: {
    inviteCode: '',
    submitting: false
  },

  onInviteCodeInput: function (e) { this.setData({ inviteCode: e.detail.value }) },

  onSubmit: function () {
    var that = this
    var code = this.data.inviteCode

    if (!code || !code.trim()) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }

    if (this.data.submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '加入中...' })

    tripService.joinTrip(code.trim()).then(function (data) {
      wx.hideLoading()
      wx.showToast({ title: '加入成功', icon: 'success' })
      setTimeout(function () {
        wx.redirectTo({ url: '/pages/tripDetail/tripDetail?tripId=' + data.tripId })
      }, 1000)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '加入失败，请稍后重试', icon: 'none' })
    })
  }
})
