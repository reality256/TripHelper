// pages/tripDetail/tripDetail.js
var tripService = require('../../services/tripService')

Page({
  data: {
    tripId: '',
    trip: null,
    members: [],
    expenseSummary: {},
    itineraryPreview: [],
    loading: true
  },

  onLoad: function (options) {
    if (options.tripId) {
      this.setData({ tripId: options.tripId })
    }
  },

  onShow: function () {
    if (this.data.tripId) {
      this.loadDetail()
    }
  },

  loadDetail: function () {
    var that = this
    this.setData({ loading: true })

    tripService.getTripDetail(this.data.tripId).then(function (data) {
      that.setData({
        trip: data.trip,
        members: data.members,
        expenseSummary: data.expenseSummary,
        itineraryPreview: data.itineraryPreview,
        loading: false
      })
    }).catch(function (err) {
      console.error('[tripDetail] 加载失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  copyInviteCode: function () {
    var code = this.data.trip && this.data.trip.inviteCode
    if (!code) return
    wx.setClipboardData({
      data: code,
      success: function () {
        wx.showToast({ title: '邀请码已复制', icon: 'success' })
      }
    })
  },

  goItinerary: function () {
    wx.navigateTo({ url: '/pages/itinerary/itinerary?tripId=' + this.data.tripId })
  },
  goExpenses: function () {
    wx.navigateTo({ url: '/pages/expenses/expenses?tripId=' + this.data.tripId })
  },
  goSettlement: function () {
    wx.navigateTo({ url: '/pages/settlement/settlement?tripId=' + this.data.tripId })
  },
  goMembers: function () {
    wx.navigateTo({ url: '/pages/members/members?tripId=' + this.data.tripId })
  }
})
