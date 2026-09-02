// cloudfunctions/addItinerary/index.js
// 添加行程项目：权限校验、写入 itinerary 集合
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, data: null, message: '无法获取用户身份' }
  }

  const { tripId, date, title, location, startTime, endTime, note, locationName, locationAddress, latitude, longitude } = event

  // 服务端校验
  if (!tripId) {
    return { success: false, data: null, message: '缺少旅行 ID' }
  }
  if (!title || !title.trim()) {
    return { success: false, data: null, message: '请输入行程标题' }
  }
  if (!date) {
    return { success: false, data: null, message: '请选择日期' }
  }

  // 校验时间格式（HH:mm）
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
  if (startTime && !TIME_RE.test(String(startTime))) {
    return { success: false, data: null, message: '开始时间格式不正确' }
  }
  if (endTime && !TIME_RE.test(String(endTime))) {
    return { success: false, data: null, message: '结束时间格式不正确' }
  }

  // 校验结束时间不早于开始时间
  if (startTime && endTime) {
    const partsA = String(startTime).split(':')
    const partsB = String(endTime).split(':')
    const totalA = (parseInt(partsA[0]) || 0) * 60 + (parseInt(partsA[1]) || 0)
    const totalB = (parseInt(partsB[0]) || 0) * 60 + (parseInt(partsB[1]) || 0)
    if (totalB < totalA) {
      return { success: false, data: null, message: '结束时间不能早于开始时间' }
    }
  }

  // 校验坐标范围（含 0 合法值；非法输入直接拒绝，不静默写 0,0）
  var numLat = latitude === undefined || latitude === '' ? null : Number(latitude)
  var numLng = longitude === undefined || longitude === '' ? null : Number(longitude)
  if (numLat !== null && (isNaN(numLat) || numLat < -90 || numLat > 90)) {
    return { success: false, data: null, message: '纬度坐标无效' }
  }
  if (numLng !== null && (isNaN(numLng) || numLng < -180 || numLng > 180)) {
    return { success: false, data: null, message: '经度坐标无效' }
  }

  try {
    // 1. 查询旅行并校验权限
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data

    if (!trip) {
      return { success: false, data: null, message: '旅行不存在' }
    }

    if (trip.status === 'dissolved') {
      return { success: false, data: null, message: '该旅行已解散' }
    }

    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }

    // 2. 写入行程
    const itinerary = {
      tripId,
      title: title.trim(),
      date,
      location: (locationName || location || '').trim(),
      locationName: locationName || location || '',
      locationAddress: locationAddress || '',
      latitude: numLat === null ? 0 : numLat,
      longitude: numLng === null ? 0 : numLng,
      startTime: startTime || '',
      endTime: endTime || '',
      note: note || '',
      createdBy: openid,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const addRes = await db.collection('itinerary').add({ data: itinerary })
    itinerary._id = addRes._id

    console.log('[addItinerary] 行程创建成功, itineraryId:', addRes._id)

    return {
      success: true,
      data: {
        itineraryId: addRes._id,
        itinerary
      },
      message: ''
    }
  } catch (err) {
    console.error('[addItinerary] 云函数执行失败', err.message || err)
    return {
      success: false,
      data: null,
      message: '添加行程失败: ' + (err.message || '未知错误')
    }
  }
}
