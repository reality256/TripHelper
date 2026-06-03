// pages/addItinerary/addItinerary.js
// V3.0 支持新增 + 编辑模式
var itineraryService = require('../../services/itineraryService')
var dateUtils = require('../../utils/date')
var mapUtils = require('../../utils/map')

Page({
  data: {
    tripId: '',
    itineraryId: '',
    isEdit: false,
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
    submitting: false,
    loading: true
  },

  onLoad: function (options) {
    if (options.tripId) this.setData({ tripId: options.tripId })
    if (options.itineraryId) {
      this.setData({ itineraryId: options.itineraryId, isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑行程' })
      this.loadItineraryDetail()
    } else {
      this.setData({ loading: false })
    }
  },

  // 编辑模式：加载已有行程数据
  loadItineraryDetail: function () {
    var that = this
    this.setData({ loading: true })

    itineraryService.getItinerary(this.data.tripId).then(function (data) {
      var list = data.itinerary || []
      var item = null
      for (var i = 0; i < list.length; i++) {
        if (list[i]._id === that.data.itineraryId) {
          item = list[i]
          break
        }
      }
      if (item) {
        that.setData({
          title: item.title || '',
          date: item.date || '',
          locationName: item.locationName || '',
          locationAddress: item.locationAddress || '',
          latitude: item.latitude || 0,
          longitude: item.longitude || 0,
          location: item.locationName || item.location || '',
          hasMapLocation: !!(item.latitude && item.longitude),
          startTime: item.startTime || '',
          endTime: item.endTime || '',
          note: item.note || '',
          loading: false
        })
      } else {
        that.setData({ loading: false })
        wx.showToast({ title: '行程不存在', icon: 'none' })
      }
    }).catch(function (err) {
      console.error('[addItinerary] 加载行程详情失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
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
    }

    this.doSubmit()
  },

  doSubmit: function () {
    var that = this
    if (this.data.submitting) return
    this.setData({ submitting: true })

    var payload = {
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
    }

    var action
    if (this.data.isEdit) {
      payload.itineraryId = this.data.itineraryId
      action = itineraryService.updateItinerary(payload)
    } else {
      action = itineraryService.addItinerary(payload)
    }

    wx.showLoading({ title: this.data.isEdit ? '保存中...' : '提交中...' })

    action.then(function () {
      wx.hideLoading()
      wx.showToast({ title: that.data.isEdit ? '已保存' : '添加成功', icon: 'success' })
      setTimeout(function () { wx.navigateBack() }, 1000)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    })
  }
})
