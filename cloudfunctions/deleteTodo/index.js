// cloudfunctions/deleteTodo/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, data: null, message: '无法获取用户身份' }

  const { tripId, todoId } = event
  if (!tripId) return { success: false, data: null, message: '缺少旅行 ID' }
  if (!todoId) return { success: false, data: null, message: '缺少待办 ID' }

  try {
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data
    if (!trip) return { success: false, data: null, message: '旅行不存在' }
    if (trip.status === 'dissolved') return { success: false, data: null, message: '该旅行已解散' }
    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }

    var todoRes = await db.collection('todos').doc(todoId).get()
    var todo = todoRes.data
    if (!todo) return { success: false, data: null, message: '待办不存在' }
    if (todo.tripId !== tripId) return { success: false, data: null, message: '待办不属于该旅行' }

    await db.collection('todos').doc(todoId).remove()

    return { success: true, data: {}, message: '' }
  } catch (err) {
    console.error('[deleteTodo] 失败:', err.message || err)
    return { success: false, data: null, message: '删除待办失败: ' + (err.message || '未知错误') }
  }
}
