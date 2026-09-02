// cloudfunctions/deleteItinerary/index.js
// 删除行程项目
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

  const { tripId, itineraryId } = event

  if (!tripId) {
    return { success: false, data: null, message: '缺少旅行 ID' }
  }
  if (!itineraryId) {
    return { success: false, data: null, message: '缺少行程 ID' }
  }

  try {
    // 1. 校验用户属于该旅行
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

    // 2. 校验行程存在且属于该旅行
    const itineraryRes = await db.collection('itinerary').doc(itineraryId).get()
    const itinerary = itineraryRes.data

    if (!itinerary) {
      return { success: false, data: null, message: '行程不存在' }
    }

    if (itinerary.tripId !== tripId) {
      return { success: false, data: null, message: '行程不属于该旅行' }
    }

    // 权限：行程创建者 或 旅行创建者（与 updateItinerary 一致）
    if (itinerary.createdBy !== openid && trip.creatorOpenid !== openid) {
      return { success: false, data: null, message: '你没有权限删除该行程' }
    }

    // 3. 删除行程
    await db.collection('itinerary').doc(itineraryId).remove()

    console.log('[deleteItinerary] 删除成功, itineraryId:', itineraryId)

    return { success: true, data: {}, message: '' }
  } catch (err) {
    console.error('[deleteItinerary] 云函数执行失败', err.message || err)
    return {
      success: false,
      data: null,
      message: '删除失败: ' + (err.message || '未知错误')
    }
  }
}
