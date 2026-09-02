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
      .limit(1000)
      .get()

    // 过滤已解散的旅行（兼容旧数据无 status 字段，视为 active）
    var activeTrips = res.data.filter(function (t) {
      return t.status !== 'dissolved'
    })

    console.log('[getMyTrips] 查询成功, 总数:', res.data.length, '活跃:', activeTrips.length)

    return {
      success: true,
      data: {
        trips: activeTrips
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
