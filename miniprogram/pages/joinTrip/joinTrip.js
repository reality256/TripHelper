// pages/joinTrip/joinTrip.js
var tripService = require('../../services/tripService')

Page({
  data: {
    codeChars: ['', '', '', '', '', ''],
    codeComplete: false,
    submitting: false
  },

  onCodeInput: function (e) {
    var raw = String(e.detail.value || '')
    var cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    var chars = []
    for (var i = 0; i < 6; i++) {
      chars.push(cleaned[i] || '')
    }
    this.setData({
      codeChars: chars,
      codeComplete: cleaned.length === 6
    })
  },

  onSubmit: function () {
    var that = this
    var code = this.data.codeChars.join('')

    if (code.length < 6) {
      wx.showToast({ title: '请输入 6 位邀请码', icon: 'none' })
      return
    }

    if (this.data.submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '加入中...' })

    tripService.joinTrip(code).then(function (data) {
      wx.hideLoading()
      wx.showToast({ title: '加入成功', icon: 'success' })
      setTimeout(function () {
        wx.redirectTo({ url: '/pages/tripWorkspace/tripWorkspace?tripId=' + data.tripId })
      }, 1000)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '加入失败，请稍后重试', icon: 'none' })
    })
  }
})
