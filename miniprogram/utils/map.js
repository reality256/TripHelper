// utils/map.js
// V3.0 地图工具函数：地点归一化、marker/polyline 构建

/**
 * 归一化 wx.chooseLocation 返回结果
 * @param {Object} loc - wx.chooseLocation 的 success 回调参数
 * @returns {Object} { name, address, latitude, longitude }
 */
function normalizeLocationResult(loc) {
  return {
    name: loc.name || '',
    address: loc.address || '',
    latitude: loc.latitude || 0,
    longitude: loc.longitude || 0
  }
}

/**
 * 过滤出有有效经纬度的行程
 * @param {Array} schedules
 * @returns {Array}
 */
function getValidScheduleLocations(schedules) {
  return schedules.filter(function (s) {
    return !!(s.latitude && s.longitude)
  })
}

/**
 * 统计缺少经纬度的行程数
 */
function getMissingLocationCount(schedules) {
  var count = 0
  schedules.forEach(function (s) {
    if (!s.latitude || !s.longitude) count++
  })
  return count
}

/**
 * 构建地图 markers（带编号徽标 + 可点开气泡）
 * @param {Array} schedules - 已排序、含 dailyIndex、有经纬度的行程
 * @param {Object} statusMap - 可选的行程状态映射 { idx: 'ongoing'|'ended'|... }
 * @returns {Array}
 */
function buildMapMarkers(schedules, statusMap) {
  statusMap = statusMap || {}
  return schedules.map(function (s, idx) {
    var num = String(s.dailyIndex || idx + 1)
    var status = statusMap[idx] || ''
    var isOngoing = (status === 'ongoing')
    var isEnded = (status === 'ended')

    // 状态色
    var markerColor = isEnded ? '#BBBBBB' : (isOngoing ? '#E67E22' : '#2A9D8F')

    return {
      id: idx,
      latitude: s.latitude,
      longitude: s.longitude,
      width: 36,
      height: 36,
      // 编号标签：显示为圆形徽标
      label: {
        content: num,
        color: '#FFFFFF',
        fontSize: 14,
        bgColor: markerColor,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        padding: 6,
        textAlign: 'center',
        anchorX: -9,
        anchorY: -36
      },
      // 点击后显示详情气泡
      callout: {
        content: (s.title || ''),
        padding: 8,
        borderRadius: 8,
        bgColor: '#FFFFFF',
        display: 'BYCLICK',
        textAlign: 'center',
        fontSize: 12
      }
    }
  })
}

/**
 * 构建路线 polyline
 * @param {Array} schedules - 含经纬度且已按时间排序的行程
 * @returns {Array} points 数组
 */
function buildRoutePolyline(schedules) {
  var valid = getValidScheduleLocations(schedules)
  return valid.map(function (s) {
    return { latitude: s.latitude, longitude: s.longitude }
  })
}

/**
 * 检查是否有足够地点生成路线（>= 2 个有效点）
 */
function hasEnoughForRoute(schedules) {
  return getValidScheduleLocations(schedules).length >= 2
}

/**
 * 计算两点直线距离（Haversine 公式）
 * @returns {number} 距离，单位 km
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  var R = 6371
  var dLat = (lat2 - lat1) * Math.PI / 180
  var dLng = (lng2 - lng1) * Math.PI / 180
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

/**
 * 计算路线各段距离和总距离
 * @param {Array} schedules - 已按时间排序且有经纬度的行程
 * @returns {Object} { segments: [{from, to, distance}], total: 总距离km }
 */
function calculateRouteDistances(schedules) {
  var valid = getValidScheduleLocations(schedules)
  var segments = []
  var total = 0
  for (var i = 0; i < valid.length - 1; i++) {
    var dist = calculateDistance(
      valid[i].latitude, valid[i].longitude,
      valid[i + 1].latitude, valid[i + 1].longitude
    )
    segments.push({
      from: valid[i].title || '',
      to: valid[i + 1].title || '',
      distance: dist
    })
    total += dist
  }
  return { segments: segments, total: Math.round(total * 10) / 10 }
}

/**
 * 估算驾驶时间（按城市平均车速 30 km/h）
 */
function estimateDriveTime(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return ''
  var minutes = Math.round(distanceKm / 30 * 60)
  if (minutes < 60) return minutes + ' 分钟'
  var h = Math.floor(minutes / 60)
  var m = minutes % 60
  return h + ' 小时' + (m > 0 ? m + ' 分钟' : '')
}

module.exports = {
  normalizeLocationResult: normalizeLocationResult,
  getValidScheduleLocations: getValidScheduleLocations,
  getMissingLocationCount: getMissingLocationCount,
  buildMapMarkers: buildMapMarkers,
  buildRoutePolyline: buildRoutePolyline,
  hasEnoughForRoute: hasEnoughForRoute,
  calculateDistance: calculateDistance,
  calculateRouteDistances: calculateRouteDistances,
  estimateDriveTime: estimateDriveTime
}
