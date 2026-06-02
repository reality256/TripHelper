// cloudfunctions/leaveTrip/index.js
// 普通成员退出旅行：从 memberOpenids 中移除当前用户
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
    // 查询旅行
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data

    if (!trip) {
      return { success: false, data: null, message: '旅行不存在' }
    }

    // 校验：当前用户必须是旅行成员
    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你不属于该旅行' }
    }

    // 校验：创建者不能退出（只能解散）
    if (trip.creatorOpenid === openid) {
      return { success: false, data: null, message: '创建者不能退出，请解散旅行' }
    }

    // 校验：旅行未被解散
    if (trip.status === 'dissolved') {
      return { success: false, data: null, message: '该旅行已经解散' }
    }

    // 从 memberOpenids 中移除当前用户
    var newMembers = trip.memberOpenids.filter(function (id) {
      return id !== openid
    })

    await db.collection('trips').doc(tripId).update({
      data: {
        memberOpenids: newMembers,
        updatedAt: new Date()
      }
    })

    console.log('[leaveTrip] 成员已退出, tripId:', tripId, 'openid:', openid)

    return {
      success: true,
      data: {},
      message: ''
    }
  } catch (err) {
    console.error('[leaveTrip] 执行失败', err)
    return {
      success: false,
      data: null,
      message: err.message || '退出失败，请稍后重试'
    }
  }
}
