// cloudfunctions/addTodo/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, data: null, message: '无法获取用户身份' }

  const { tripId, title, note, assigneeOpenids } = event
  if (!tripId) return { success: false, data: null, message: '缺少旅行 ID' }
  if (!title || !title.trim()) return { success: false, data: null, message: '请输入待办标题' }
  if (!assigneeOpenids || assigneeOpenids.length === 0) return { success: false, data: null, message: '请至少选择一位负责人' }

  try {
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data
    if (!trip) return { success: false, data: null, message: '旅行不存在' }
    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }
    for (var i = 0; i < assigneeOpenids.length; i++) {
      if (trip.memberOpenids.indexOf(assigneeOpenids[i]) === -1) {
        return { success: false, data: null, message: '负责人中存在非旅行成员' }
      }
    }

    var todo = {
      tripId, title: title.trim(), note: note || '', assigneeOpenids,
      completed: false, completedAt: null, completedBy: null,
      createdBy: openid, createdAt: new Date(), updatedAt: new Date()
    }
    var addRes = await db.collection('todos').add({ data: todo })
    todo._id = addRes._id
    return { success: true, data: { todoId: addRes._id, todo }, message: '' }
  } catch (err) {
    console.error('[addTodo] 失败:', err.message || err)
    return { success: false, data: null, message: '添加待办失败: ' + (err.message || '未知错误') }
  }
}
