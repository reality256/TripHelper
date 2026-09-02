// cloudfunctions/getTodos/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, data: null, message: '无法获取用户身份' }

  const { tripId } = event
  if (!tripId) return { success: false, data: null, message: '缺少旅行 ID' }

  try {
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data
    if (!trip) return { success: false, data: null, message: '旅行不存在' }
    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }

    if (trip.status === 'dissolved') {
      return { success: false, data: null, message: '该旅行已解散' }
    }

    var todos = []
    try {
      var res = await db.collection('todos').where({ tripId })
        .orderBy('completed', 'asc')
        .orderBy('createdAt', 'desc')
        .limit(1000)
        .get()
      todos = res.data
    } catch (e) {
      console.log('[getTodos] 集合尚不可用:', e.message)
    }

    return { success: true, data: { todos }, message: '' }
  } catch (err) {
    console.error('[getTodos] 失败:', err.message || err)
    return { success: false, data: null, message: '查询待办失败: ' + (err.message || '未知错误') }
  }
}
