// pages/index/index.js
var tripService = require('../../services/tripService')

Page({
  data: {
    trips: [],
    hasCheckedAutoRedirect: false
  },

  onLoad: function (options) {
    // 如果带有 noAuto 标记，跳过自动跳转（用户主动返回首页）
    if (options && options.noAuto === '1') {
      this.setData({ hasCheckedAutoRedirect: true })
      this.loadTrips()
      return
    }
    // V2 启动逻辑：检查是否有旅行，自动跳转到最近旅行
    this.checkAutoRedirect()
  },

  onShow: function () {
    // 非首次加载时，正常显示旅行列表供用户手动选择
    if (this.data.hasCheckedAutoRedirect) {
      this.loadTrips()
    }
  },

  // V2：首次启动时检查是否需要自动跳转
  checkAutoRedirect: function () {
    var that = this
    tripService.getMyTrips().then(function (data) {
      var trips = data.trips || []

      if (trips.length > 0) {
        // 已有旅行：自动跳转到最近旅行（云函数已按 updatedAt 倒序）
        var recentTrip = trips[0]
        that.setData({ hasCheckedAutoRedirect: true })

        wx.navigateTo({
          url: '/pages/tripWorkspace/tripWorkspace?tripId=' + recentTrip._id
        })
      } else {
        // 无旅行：留在首页
        that.setData({ hasCheckedAutoRedirect: true, trips: [] })
      }
    }).catch(function (err) {
      console.error('[index] 自动跳转检查失败:', err)
      that.setData({ hasCheckedAutoRedirect: true })
      // 失败时也留在首页
    })
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
      url: '/pages/tripWorkspace/tripWorkspace?tripId=' + tripId
    })
  }
})
