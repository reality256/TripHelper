// pages/createTrip/createTrip.js
var tripService = require('../../services/tripService')

Page({
  data: {
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    submitting: false
  },

  onNameInput: function (e) { this.setData({ name: e.detail.value }) },
  onDestinationInput: function (e) { this.setData({ destination: e.detail.value }) },
  onStartDateChange: function (e) { this.setData({ startDate: e.detail.value }) },
  onEndDateChange: function (e) { this.setData({ endDate: e.detail.value }) },

  onSubmit: function () {
    var that = this
    var n = this.data.name
    var d = this.data.destination
    var s = this.data.startDate
    var e = this.data.endDate

    // 前端校验
    if (!n || !n.trim()) { wx.showToast({ title: '请输入旅行名称', icon: 'none' }); return }
    if (!d || !d.trim()) { wx.showToast({ title: '请输入目的地', icon: 'none' }); return }
    if (!s) { wx.showToast({ title: '请选择开始日期', icon: 'none' }); return }
    if (!e) { wx.showToast({ title: '请选择结束日期', icon: 'none' }); return }
    if (e < s) { wx.showToast({ title: '结束日期不能早于开始日期', icon: 'none' }); return }

    if (this.data.submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '创建中...' })

    tripService.createTrip({
      name: n.trim(),
      destination: d.trim(),
      startDate: s,
      endDate: e
    }).then(function (data) {
      wx.hideLoading()
      wx.showToast({ title: '创建成功', icon: 'success' })
      // 跳转到旅行详情页
      setTimeout(function () {
        wx.redirectTo({ url: '/pages/tripWorkspace/tripWorkspace?tripId=' + data.tripId })
      }, 1000)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '创建失败，请稍后重试', icon: 'none' })
    })
  }
})
