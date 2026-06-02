// pages/addItinerary/addItinerary.js
var itineraryService = require('../../services/itineraryService')

Page({
  data: {
    tripId: '',
    title: '',
    date: '',
    location: '',
    startTime: '',
    endTime: '',
    note: '',
    submitting: false
  },

  onLoad: function (options) {
    if (options.tripId) this.setData({ tripId: options.tripId })
  },

  onTitleInput: function (e) { this.setData({ title: e.detail.value }) },
  onLocationInput: function (e) { this.setData({ location: e.detail.value }) },
  onDateChange: function (e) { this.setData({ date: e.detail.value }) },
  onStartTimeChange: function (e) { this.setData({ startTime: e.detail.value }) },
  onEndTimeChange: function (e) { this.setData({ endTime: e.detail.value }) },
  onNoteInput: function (e) { this.setData({ note: e.detail.value }) },

  onSubmit: function () {
    var that = this

    if (!this.data.title || !this.data.title.trim()) {
      wx.showToast({ title: '请输入行程标题', icon: 'none' }); return
    }
    if (!this.data.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' }); return
    }

    if (this.data.submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...' })

    itineraryService.addItinerary({
      tripId: this.data.tripId,
      title: this.data.title.trim(),
      date: this.data.date,
      location: this.data.location || '',
      startTime: this.data.startTime || '',
      endTime: this.data.endTime || '',
      note: this.data.note || ''
    }).then(function () {
      wx.hideLoading()
      wx.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(function () {
        wx.navigateBack()
      }, 1000)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '添加失败', icon: 'none' })
    })
  }
})
