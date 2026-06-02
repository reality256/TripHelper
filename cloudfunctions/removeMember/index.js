// cloudfunctions/removeMember/index.js
// 创建者移除普通成员
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, data: null, message: '无法获取用户身份' }

  const { tripId, targetOpenid } = event
  if (!tripId) return { success: false, data: null, message: '缺少旅行 ID' }
  if (!targetOpenid) return { success: false, data: null, message: '缺少目标成员 ID' }

  try {
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data
    if (!trip) return { success: false, data: null, message: '旅行不存在' }
    if (trip.status === 'dissolved') return { success: false, data: null, message: '该旅行已解散' }

    // 只有创建者可以移除
    if (trip.creatorOpenid !== openid) {
      return { success: false, data: null, message: '只有创建者才能移除成员' }
    }

    // 不能移除自己
    if (targetOpenid === openid) {
      return { success: false, data: null, message: '不能移除自己' }
    }

    // 目标必须在 memberOpenids 中
    var members = trip.memberOpenids || []
    if (members.indexOf(targetOpenid) === -1) {
      return { success: false, data: null, message: '该用户不是旅行成员' }
    }

    // 移除并加入 formerMemberOpenids
    var newMembers = members.filter(function (id) { return id !== targetOpenid })
    var formerList = trip.formerMemberOpenids || []
    if (formerList.indexOf(targetOpenid) === -1) {
      formerList.push(targetOpenid)
    }

    await db.collection('trips').doc(tripId).update({
      data: {
        memberOpenids: newMembers,
        formerMemberOpenids: formerList,
        updatedAt: new Date()
      }
    })

    console.log('[removeMember] 成员已移除, tripId:', tripId, 'target:', targetOpenid)
    return { success: true, data: {}, message: '' }
  } catch (err) {
    console.error('[removeMember] 执行失败', err)
    return { success: false, data: null, message: err.message || '移除失败' }
  }
}
