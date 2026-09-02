// cloudfunctions/updateItinerary/index.js
// 更新行程：行程创建者或旅行创建者可操作
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, data: null, message: '无法获取用户身份' }

  const { tripId, itineraryId, title, date, location, locationName, locationAddress, latitude, longitude, startTime, endTime, note } = event
  if (!tripId) return { success: false, data: null, message: '缺少旅行 ID' }
  if (!itineraryId) return { success: false, data: null, message: '缺少行程 ID' }
  if (!title || !title.trim()) return { success: false, data: null, message: '请输入行程标题' }
  if (!date) return { success: false, data: null, message: '请选择日期' }

  // 校验时间格式（HH:mm）
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
  if (startTime && !TIME_RE.test(String(startTime))) {
    return { success: false, data: null, message: '开始时间格式不正确' }
  }
  if (endTime && !TIME_RE.test(String(endTime))) {
    return { success: false, data: null, message: '结束时间格式不正确' }
  }

  // 校验结束时间不早于开始时间（分钟换算比较，避免字符串比较误判如 "9:00" > "10:00"）
  if (startTime && endTime) {
    var sa = String(startTime).split(':')
    var ea = String(endTime).split(':')
    var st = (parseInt(sa[0]) || 0) * 60 + (parseInt(sa[1]) || 0)
    var et = (parseInt(ea[0]) || 0) * 60 + (parseInt(ea[1]) || 0)
    if (et < st) {
      return { success: false, data: null, message: '结束时间不能早于开始时间' }
    }
  }

  // 校验坐标范围
  var numLat = latitude === undefined || latitude === '' ? null : Number(latitude)
  var numLng = longitude === undefined || longitude === '' ? null : Number(longitude)
  if (numLat !== null && (isNaN(numLat) || numLat < -90 || numLat > 90)) {
    return { success: false, data: null, message: '纬度坐标无效' }
  }
  if (numLng !== null && (isNaN(numLng) || numLng < -180 || numLng > 180)) {
    return { success: false, data: null, message: '经度坐标无效' }
  }

  try {
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data
    if (!trip) return { success: false, data: null, message: '旅行不存在' }
    if (trip.status === 'dissolved') return { success: false, data: null, message: '该旅行已解散' }
    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }

    const itRes = await db.collection('itinerary').doc(itineraryId).get()
    const itinerary = itRes.data
    if (!itinerary) return { success: false, data: null, message: '行程不存在' }
    if (itinerary.tripId !== tripId) return { success: false, data: null, message: '行程不属于该旅行' }

    // 权限：行程创建者 或 旅行创建者
    if (itinerary.createdBy !== openid && trip.creatorOpenid !== openid) {
      return { success: false, data: null, message: '你没有权限编辑该行程' }
    }

    await db.collection('itinerary').doc(itineraryId).update({
      data: {
        title: title.trim(),
        date: date,
        location: locationName || location || '',
        locationName: locationName || '',
        locationAddress: locationAddress || '',
        latitude: numLat === null ? 0 : numLat,
        longitude: numLng === null ? 0 : numLng,
        startTime: startTime || '',
        endTime: endTime || '',
        note: note || '',
        updatedAt: new Date()
      }
    })

    console.log('[updateItinerary] 行程更新成功, itineraryId:', itineraryId)
    return { success: true, data: {}, message: '' }
  } catch (err) {
    console.error('[updateItinerary] 执行失败', err)
    return { success: false, data: null, message: err.message || '编辑失败' }
  }
}
