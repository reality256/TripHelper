// pages/schedule-map/schedule-map.js
var itineraryService = require('../../services/itineraryService')
var scheduleUtils = require('../../utils/schedule')
var mapUtils = require('../../utils/map')

Page({
  data: {
    tripId: '',
    selectedDate: '',
    dates: [],
    loading: true,
    markers: [],
    polyline: [],
    points: [],
    summary: { totalDistance: '', totalTime: '', locationCount: 0 },
    missingCount: 0,
    hasRoute: false,
    errorMsg: ''
  },

  onLoad: function (options) {
    if (options.tripId) {
      this.setData({ tripId: options.tripId, selectedDate: options.date || '' })
      this.loadData()
    }
  },

  loadData: function () {
    var that = this
    this.setData({ loading: true, errorMsg: '' })

    itineraryService.getItinerary(this.data.tripId).then(function (data) {
      var list = data.itinerary || []

      // 收集日期
      var dates = []
      var dateMap = {}
      list.forEach(function (item) {
        if (item.date && !dateMap[item.date]) {
          dateMap[item.date] = true
          dates.push(item.date)
        }
      })
      dates.sort()

      // 默认选中第一个日期
      var activeDate = that.data.selectedDate || (dates.length > 0 ? dates[0] : '')
      that.setData({ dates: dates, selectedDate: activeDate })
      that.renderMap(list, activeDate)
    }).catch(function (err) {
      that.setData({ loading: false, errorMsg: err.message || '加载失败' })
    })
  },

  renderMap: function (allSchedules, activeDate) {
    var that = this
    // 过滤当天行程
    var daySchedules = allSchedules.filter(function (s) { return s.date === activeDate })
    if (daySchedules.length === 0) {
      this.setData({ loading: false, markers: [], polyline: [], points: [], hasRoute: false })
      return
    }

    // 排序、加序号、计算状态
    var now = new Date()
    var todayStr = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2)
    var sorted = scheduleUtils.sortSchedulesByTime(daySchedules)
    var statusMap = {}
    sorted.forEach(function (s, i) {
      s.dailyIndex = i + 1
      if (activeDate === todayStr) {
        statusMap[i] = scheduleUtils.getScheduleStatus(s, now)
      }
    })

    // 有效地点
    var valid = mapUtils.getValidScheduleLocations(sorted)
    var missing = mapUtils.getMissingLocationCount(sorted)

    var markers = []
    var points = []
    if (valid.length > 0) {
      // 为有效地点重建 statusMap（valid 的索引对应 markers 的 id）
      var validStatusMap = {}
      valid.forEach(function (v, vi) {
        var origIdx = sorted.indexOf(v)
        if (origIdx >= 0 && statusMap[origIdx]) {
          validStatusMap[vi] = statusMap[origIdx]
        }
      })
      markers = mapUtils.buildMapMarkers(valid, validStatusMap)
      points = mapUtils.buildRoutePolyline(valid)
    }

    var hasRoute = points.length >= 2

    // 先显示直线距离，异步请求真实驾车距离
    if (hasRoute) {
      var approxInfo = mapUtils.calculateRouteDistances(sorted)
      that.setData({
        'summary.totalDistance': approxInfo.total + ' km（直线距离，正在计算驾车路线...）',
        'summary.totalTime': mapUtils.estimateDriveTime(approxInfo.total)
      })
      that.fetchRealDistances(valid)
    }

    // 计算地图视野
    var mapCenter = { latitude: 39.9, longitude: 116.4, scale: 13 }
    var includePoints = []
    if (points.length > 0) {
      var lats = points.map(function (p) { return p.latitude })
      var lngs = points.map(function (p) { return p.longitude })
      mapCenter = {
        latitude: (Math.min.apply(null, lats) + Math.max.apply(null, lats)) / 2,
        longitude: (Math.min.apply(null, lngs) + Math.max.apply(null, lngs)) / 2
      }
      // include-points 始终传数组，避免传 null 导致 map SDK fitBounds 崩溃
      includePoints = valid.map(function (v) {
        return { latitude: v.latitude, longitude: v.longitude }
      })
    }

    this.setData({
      loading: false,
      markers: markers,
      polyline: hasRoute ? [{ points: points, color: '#2E8B5788', width: 6, arrowLine: true }] : [],
      points: points,
      mapLatitude: mapCenter.latitude,
      mapLongitude: mapCenter.longitude,
      markers_for_include: includePoints,
      hasRoute: hasRoute,
      missingCount: missing,
      'summary.locationCount': valid.length,
      schedules: sorted
    })
  },

  onDateChange: function (e) {
    var date = this.data.dates[e.detail.value]
    this.setData({ selectedDate: date })
    this.loadMapForDate(date)
  },

  // 逐对请求真实驾车距离 + 路线 polyline
  fetchRealDistances: function (validSchedules) {
    var that = this
    var pairs = []
    for (var i = 0; i < validSchedules.length - 1; i++) {
      pairs.push({
        from: { latitude: validSchedules[i].latitude, longitude: validSchedules[i].longitude },
        to: { latitude: validSchedules[i + 1].latitude, longitude: validSchedules[i + 1].longitude }
      })
    }
    if (pairs.length === 0) return

    var totalDist = 0
    var totalDur = 0
    var allPolylines = []
    var done = 0

    pairs.forEach(function (pair, idx) {
      itineraryService.getRouteDistance(that.data.tripId, pair.from, pair.to).then(function (res) {
        totalDist += res.distance
        totalDur += res.duration
        if (res.polyline && res.polyline.length > 0) {
          allPolylines.push(res.polyline)
        }
      }).catch(function () {
        var fallback = mapUtils.calculateDistance(
          pair.from.latitude, pair.from.longitude,
          pair.to.latitude, pair.to.longitude
        )
        totalDist += fallback
        totalDur += Math.round(fallback / 30 * 60)
      }).then(function () {
        done++
        if (done === pairs.length) {
          totalDist = Math.round(totalDist * 10) / 10
          totalDur = Math.round(totalDur)

          // 合并所有段 polyline 为地图路线
          var mapPolylines = []
          allPolylines.forEach(function (seg) {
            if (seg.length > 0) {
              mapPolylines.push({ points: seg, color: '#2E8B57', width: 4, arrowLine: true })
            }
          })
          // 如果没有 API polyline，用直线兜底（与真实路线颜色一致）
          if (mapPolylines.length === 0 && that.data.points.length >= 2) {
            mapPolylines.push({ points: that.data.points, color: '#2E8B57', width: 4, arrowLine: true })
          }

          that.setData({
            polyline: mapPolylines,
            'summary.totalDistance': totalDist + ' km（驾车距离）',
            'summary.totalTime': totalDur >= 60 ? Math.floor(totalDur / 60) + ' 小时' + (totalDur % 60 > 0 ? (totalDur % 60) + ' 分钟' : '') : totalDur + ' 分钟'
          })
        }
      })
    })
  },

  loadMapForDate: function (date) {
    var that = this
    itineraryService.getItinerary(this.data.tripId).then(function (data) {
      that.renderMap(data.itinerary || [], date)
    })
  }
})
