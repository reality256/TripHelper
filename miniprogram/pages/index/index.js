// pages/index/index.js
var tripService = require('../../services/tripService')

Page({
  data: {
    trips: []
  },

  onShow: function () {
    this.loadTrips()
  },

  loadTrips: function () {
    var that = this
    tripService.getMyTrips().then(function (data) {
      that.setData({ trips: data.trips })
    }).catch(function (err) {
      console.error('[index] 加载旅行列表失败:', err)
    })
  },

  goCreateTrip: function () {
    wx.navigateTo({
      url: '/pages/createTrip/createTrip'
    })
  },

  goJoinTrip: function () {
    wx.navigateTo({
      url: '/pages/joinTrip/joinTrip'
    })
  },

  goTripDetail: function (e) {
    var tripId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/tripDetail/tripDetail?tripId=' + tripId
    })
  }
})
