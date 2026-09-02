// cloudfunctions/joinTrip/index.js
// 通过邀请码加入旅行
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 未命中时延迟，抬高暴力枚举成本
function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms) })
}

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
    // 根据邀请码查找旅行（统一转大写）
    const code = inviteCode.trim().toUpperCase()
    if (code.length !== 6) {
      return { success: false, data: null, message: '邀请码格式不正确' }
    }
    const tripRes = await db.collection('trips')
      .where({ inviteCode: code })
      .get()

    if (tripRes.data.length === 0) {
      await sleep(400)
      return { success: false, data: null, message: '未找到对应旅行' }
    }

    const trip = tripRes.data[0]

    // 校验旅行状态：已解散的不可加入
    if (trip.status === 'dissolved') {
      return { success: false, data: null, message: '该旅行已解散，无法加入' }
    }

    // 检查用户是否已经是成员
    if (trip.memberOpenids && trip.memberOpenids.indexOf(openid) !== -1) {
      console.log('[joinTrip] 用户已是成员, tripId:', trip._id)
      return {
        success: true,
        data: { tripId: trip._id, trip },
        message: ''
      }
    }

    // 原子加入：addToSet 天然去重，避免并发加入互相覆盖；同时从历史成员列表移除（重新加入场景）
    await db.collection('trips').doc(trip._id).update({
      data: {
        memberOpenids: _.addToSet(openid),
        formerMemberOpenids: _.pull(openid),
        updatedAt: new Date()
      }
    })

    var memberOpenids = (trip.memberOpenids || []).concat([openid])
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
