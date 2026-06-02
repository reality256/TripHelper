// cloudfunctions/getMyTrips/index.js
// 获取当前用户加入的所有旅行，按更新时间倒序排列（最近优先）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      data: null,
      message: '无法获取用户身份'
    }
  }

  try {
    // 查询 memberOpenids 包含当前用户的旅行，按 updatedAt 倒序
    const res = await db.collection('trips')
      .where({
        memberOpenids: openid
      })
      .orderBy('updatedAt', 'desc')
      .get()

    console.log('[getMyTrips] 查询成功, 数量:', res.data.length)

    return {
      success: true,
      data: {
        trips: res.data
      },
      message: ''
    }
  } catch (err) {
    console.error('[getMyTrips] 云函数执行失败', err)
    return {
      success: false,
      data: null,
      message: '查询失败，请稍后重试'
    }
  }
}
