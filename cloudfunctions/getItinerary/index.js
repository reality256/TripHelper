// cloudfunctions/getItinerary/index.js
// 查询旅行行程列表，按日期和时间升序排列
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

  const { tripId } = event

  if (!tripId) {
    return { success: false, data: null, message: '缺少旅行 ID' }
  }

  try {
    // 1. 权限校验
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data

    if (!trip) {
      return { success: false, data: null, message: '旅行不存在' }
    }

    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }

    // 2. 查询行程列表
    let itinerary = []
    try {
      const itineraryRes = await db.collection('itinerary')
        .where({ tripId })
        .orderBy('date', 'asc')
        .orderBy('startTime', 'asc')
        .get()
      itinerary = itineraryRes.data
    } catch (e) {
      console.log('[getItinerary] itinerary 集合查询失败（可能尚不存在）:', e.message)
    }

    console.log('[getItinerary] 查询成功, 数量:', itinerary.length)

    return {
      success: true,
      data: { itinerary },
      message: ''
    }
  } catch (err) {
    console.error('[getItinerary] 云函数执行失败', err.message || err)
    return {
      success: false,
      data: null,
      message: '查询行程失败: ' + (err.message || '未知错误')
    }
  }
}
