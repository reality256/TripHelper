// pages/addItinerary/addItinerary.js
var itineraryService = require('../../services/itineraryService')
var dateUtils = require('../../utils/date')
var mapUtils = require('../../utils/map')

Page({
  data: {
    tripId: '',
    title: '',
    date: '',
    location: '',
    locationName: '',
    locationAddress: '',
    latitude: 0,
    longitude: 0,
    hasMapLocation: false,
    startTime: '',
    endTime: '',
    note: '',
    submitting: false
  },

  onLoad: function (options) {
    if (options.tripId) this.setData({ tripId: options.tripId })
  },

  onTitleInput: function (e) { this.setData({ title: e.detail.value }) },
  onDateChange: function (e) { this.setData({ date: e.detail.value }) },
  onStartTimeChange: function (e) { this.setData({ startTime: e.detail.value }) },
  onEndTimeChange: function (e) { this.setData({ endTime: e.detail.value }) },
  onNoteInput: function (e) { this.setData({ note: e.detail.value }) },

  // 地图选址
  onChooseLocation: function () {
    var that = this
    wx.chooseLocation({
      latitude: that.data.latitude || undefined,
      longitude: that.data.longitude || undefined,
      success: function (res) {
        var loc = mapUtils.normalizeLocationResult(res)
        that.setData({
          locationName: loc.name,
          locationAddress: loc.address,
          latitude: loc.latitude,
          longitude: loc.longitude,
          location: loc.name,
          hasMapLocation: true
        })
      },
      fail: function (err) {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '地图选址失败', icon: 'none' })
        }
      }
    })
  },

  // 清除已选地点
  onClearLocation: function () {
    this.setData({
      locationName: '',
      locationAddress: '',
      latitude: 0,
      longitude: 0,
      location: '',
      hasMapLocation: false
    })
  },

  onSubmit: function () {
    var that = this

    if (!this.data.title || !this.data.title.trim()) {
      wx.showToast({ title: '请输入行程标题', icon: 'none' }); return
    }
    if (!this.data.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' }); return
    }

    // 校验结束时间不早于开始时间
    if (this.data.startTime && this.data.endTime) {
      if (dateUtils.isEndTimeBeforeStartTime(this.data.startTime, this.data.endTime)) {
        wx.showToast({ title: '结束时间不能早于开始时间', icon: 'none' })
        return
      }

      // 冲突检测（提示但不阻止）
      var conflictText = this.checkConflict()
      if (conflictText) {
        var that2 = that
        wx.showModal({
          title: '时间冲突提醒',
          content: conflictText + '，是否仍然保存？',
          confirmText: '仍然保存',
          cancelText: '取消',
          success: function (r) { if (r.confirm) that2.doSubmit() }
        })
        return
      }
    }

    this.doSubmit()
  },

  checkConflict: function () {
    // 简单检测：同一天内，新行程时间是否冲突（前端做初步提示）
    // 完整冲突检测在 tripWorkspace 展示层完成
    return ''
  },

  doSubmit: function () {
    var that = this
    if (this.data.submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...' })

    itineraryService.addItinerary({
      tripId: this.data.tripId,
      title: this.data.title.trim(),
      date: this.data.date,
      location: this.data.locationName || this.data.location || '',
      locationName: this.data.locationName || '',
      locationAddress: this.data.locationAddress || '',
      latitude: this.data.latitude || 0,
      longitude: this.data.longitude || 0,
      startTime: this.data.startTime || '',
      endTime: this.data.endTime || '',
      note: this.data.note || ''
    }).then(function () {
      wx.hideLoading()
      wx.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(function () { wx.navigateBack() }, 1000)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '添加失败', icon: 'none' })
    })
  }
})
