// cloudfunctions/joinTrip/index.js
// 通过邀请码加入旅行
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      data: null,
      message: '无法获取用户身份'
    }
  }

  const { inviteCode } = event

  if (!inviteCode || !inviteCode.trim()) {
    return { success: false, data: null, message: '请输入邀请码' }
  }

  try {
    // 根据邀请码查找旅行
    const tripRes = await db.collection('trips')
      .where({ inviteCode: inviteCode.trim() })
      .get()

    if (tripRes.data.length === 0) {
      return { success: false, data: null, message: '未找到对应旅行' }
    }

    const trip = tripRes.data[0]

    // 检查用户是否已经是成员
    if (trip.memberOpenids && trip.memberOpenids.indexOf(openid) !== -1) {
      console.log('[joinTrip] 用户已是成员, tripId:', trip._id)
      return {
        success: true,
        data: { tripId: trip._id, trip },
        message: ''
      }
    }

    // 将用户加入 memberOpenids
    const memberOpenids = trip.memberOpenids || []
    memberOpenids.push(openid)

    await db.collection('trips').doc(trip._id).update({
      data: {
        memberOpenids,
        updatedAt: new Date()
      }
    })

    trip.memberOpenids = memberOpenids
    trip.updatedAt = new Date()

    console.log('[joinTrip] 加入成功, tripId:', trip._id, 'openid:', openid)

    return {
      success: true,
      data: { tripId: trip._id, trip },
      message: ''
    }
  } catch (err) {
    console.error('[joinTrip] 云函数执行失败', err)
    return {
      success: false,
      data: null,
      message: '加入失败，请稍后重试'
    }
  }
}
