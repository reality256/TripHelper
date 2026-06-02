// pages/itinerary/itinerary.js
var itineraryService = require('../../services/itineraryService')

Page({
  data: {
    tripId: '',
    groups: [],
    isEmpty: true,
    loading: true
  },

  onLoad: function (options) {
    if (options.tripId) this.setData({ tripId: options.tripId })
  },

  onShow: function () {
    if (this.data.tripId) {
      this.loadItinerary()
    }
  },

  loadItinerary: function () {
    var that = this
    this.setData({ loading: true })

    itineraryService.getItinerary(this.data.tripId).then(function (data) {
      var list = data.itinerary || []

      // 按日期分组
      var groupMap = {}
      list.forEach(function (item) {
        var d = item.date
        if (!groupMap[d]) {
          groupMap[d] = { date: d, items: [] }
        }
        groupMap[d].items.push({
          _id: item._id,
          title: item.title,
          location: item.location,
          timeText: item.startTime && item.endTime ? item.startTime + ' - ' + item.endTime :
                    item.startTime || item.endTime || '',
          note: item.note
        })
      })

      // 转为数组保持分组顺序
      var groups = []
      for (var key in groupMap) {
        if (groupMap.hasOwnProperty(key)) {
          groups.push(groupMap[key])
        }
      }

      that.setData({
        groups: groups,
        isEmpty: groups.length === 0,
        loading: false
      })
    }).catch(function (err) {
      console.error('[itinerary] 加载失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  goAddItinerary: function () {
    wx.navigateTo({ url: '/pages/addItinerary/addItinerary?tripId=' + this.data.tripId })
  }
})
