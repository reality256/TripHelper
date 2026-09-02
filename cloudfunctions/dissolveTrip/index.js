// cloudfunctions/dissolveTrip/index.js
// 创建者解散旅行：软删除，设置 status 为 dissolved
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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

    // 校验：当前用户必须是该旅行创建者
    if (trip.creatorOpenid !== openid) {
      return { success: false, data: null, message: '只有创建者才能解散旅行' }
    }

    // 校验：旅行未被解散
    if (trip.status === 'dissolved') {
      return { success: false, data: null, message: '该旅行已经解散' }
    }

    // 软删除：设置状态为 dissolved，同时清除邀请码（防止解散后仍可被加入）
    await db.collection('trips').doc(tripId).update({
      data: {
        status: 'dissolved',
        inviteCode: _.remove(),
        dissolvedAt: new Date(),
        dissolvedBy: openid,
        updatedAt: new Date()
      }
    })

    console.log('[dissolveTrip] 旅行已解散, tripId:', tripId, 'by:', openid)

    return {
      success: true,
      data: {},
      message: ''
    }
  } catch (err) {
    console.error('[dissolveTrip] 执行失败', err)
    return {
      success: false,
      data: null,
      message: err.message || '解散失败，请稍后重试'
    }
  }
}
