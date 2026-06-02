// pages/members/members.js
var tripService = require('../../services/tripService')

Page({
  data: {
    tripId: '',
    members: [],
    inviteCode: '',
    loading: true
  },

  onLoad: function (options) {
    if (options.tripId) this.setData({ tripId: options.tripId })
  },

  onShow: function () {
    if (this.data.tripId) {
      this.loadMembers()
    }
  },

  loadMembers: function () {
    var that = this
    this.setData({ loading: true })

    tripService.getTripDetail(this.data.tripId).then(function (data) {
      that.setData({
        members: data.members,
        inviteCode: data.trip.inviteCode,
        loading: false
      })
    }).catch(function (err) {
      console.error('[members] 加载失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  copyInviteCode: function () {
    var code = this.data.inviteCode
    if (!code) return
    wx.setClipboardData({
      data: code,
      success: function () {
        wx.showToast({ title: '邀请码已复制', icon: 'success' })
      }
    })
  }
})
