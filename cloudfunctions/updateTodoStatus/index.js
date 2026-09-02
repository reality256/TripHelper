// cloudfunctions/updateTodoStatus/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, data: null, message: '无法获取用户身份' }

  const { tripId, todoId, completed } = event
  if (!tripId) return { success: false, data: null, message: '缺少旅行 ID' }
  if (!todoId) return { success: false, data: null, message: '缺少待办 ID' }
  if (typeof completed !== 'boolean') return { success: false, data: null, message: 'completed 必须是布尔值' }

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

    var updateData = { updatedAt: new Date() }
    if (completed) {
      updateData.completed = true
      updateData.completedAt = new Date()
      updateData.completedBy = openid
    } else {
      updateData.completed = false
      updateData.completedAt = null
      updateData.completedBy = null
    }
    await db.collection('todos').doc(todoId).update({ data: updateData })

    return { success: true, data: {}, message: '' }
  } catch (err) {
    console.error('[updateTodoStatus] 失败:', err.message || err)
    return { success: false, data: null, message: '更新待办失败: ' + (err.message || '未知错误') }
  }
}
