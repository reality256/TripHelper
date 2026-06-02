// cloudfunctions/getExpenseDetail/index.js
// 获取单条账单详情，用于编辑回显
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, data: null, message: '无法获取用户身份' }

  const { tripId, expenseId } = event
  if (!tripId) return { success: false, data: null, message: '缺少旅行 ID' }
  if (!expenseId) return { success: false, data: null, message: '缺少账单 ID' }

  try {
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data
    if (!trip) return { success: false, data: null, message: '旅行不存在' }
    if (trip.status === 'dissolved') return { success: false, data: null, message: '该旅行已解散' }
    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限查看该旅行' }
    }

    const expRes = await db.collection('expenses').doc(expenseId).get()
    const expense = expRes.data
    if (!expense) return { success: false, data: null, message: '账单不存在' }
    if (expense.tripId !== tripId) return { success: false, data: null, message: '账单不属于该旅行' }
    if (expense.deleted) return { success: false, data: null, message: '该账单已删除' }

    return { success: true, data: { expense }, message: '' }
  } catch (err) {
    console.error('[getExpenseDetail] 执行失败', err)
    return { success: false, data: null, message: err.message || '查询失败' }
  }
}
