// cloudfunctions/createTrip/index.js
// 创建旅行云函数：校验输入、生成邀请码、创建 trips 记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 生成 6 位随机邀请码（大写字母 + 数字）
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
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

  const { name, destination, startDate, endDate } = event

  // 前端校验（用户体验），云函数也做一遍（安全边界）
  if (!name || !name.trim()) {
    return { success: false, data: null, message: '请输入旅行名称' }
  }
  if (!destination || !destination.trim()) {
    return { success: false, data: null, message: '请输入目的地' }
  }
  if (!startDate) {
    return { success: false, data: null, message: '请选择开始日期' }
  }
  if (!endDate) {
    return { success: false, data: null, message: '请选择结束日期' }
  }
  if (endDate < startDate) {
    return { success: false, data: null, message: '结束日期不能早于开始日期' }
  }

  try {
    // 生成唯一邀请码
    let inviteCode = generateInviteCode()
    let retryCount = 0
    while (retryCount < 10) {
      const existing = await db.collection('trips').where({ inviteCode }).get()
      if (existing.data.length === 0) break
      inviteCode = generateInviteCode()
      retryCount++
    }

    const trip = {
      name: name.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      creatorOpenid: openid,
      memberOpenids: [openid],
      inviteCode,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const addRes = await db.collection('trips').add({ data: trip })
    trip._id = addRes._id

    console.log('[createTrip] 旅行创建成功, tripId:', addRes._id, 'inviteCode:', inviteCode)

    return {
      success: true,
      data: {
        tripId: addRes._id,
        trip
      },
      message: ''
    }
  } catch (err) {
    console.error('[createTrip] 云函数执行失败', err)
    return {
      success: false,
      data: null,
      message: '创建失败，请稍后重试'
    }
  }
}
