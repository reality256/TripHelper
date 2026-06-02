// cloudfunctions/getExpenses/index.js
// 查询旅行账单列表，包含总金额
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, data: null, message: '无法获取用户身份' }
  }

  const { tripId } = event

  if (!tripId) {
    return { success: false, data: null, message: '缺少旅行 ID' }
  }

  try {
    // 1. 权限校验
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data

    if (!trip) {
      return { success: false, data: null, message: '旅行不存在' }
    }

    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }

    // 2. 查询账单列表（集合可能尚不存在，兼容处理）
    let expenses = []
    let totalAmount = 0
    try {
      const expenseRes = await db.collection('expenses')
        .where({ tripId })
        .orderBy('createdAt', 'desc')
        .get()
      expenses = expenseRes.data
      totalAmount = expenses.reduce(function (sum, e) {
        return sum + (e.amount || 0)
      }, 0)
    } catch (e) {
      console.log('[getExpenses] expenses 集合查询失败（可能尚不存在）:', e.message)
    }

    console.log('[getExpenses] 查询成功, 数量:', expenses.length)

    return {
      success: true,
      data: {
        expenses: expenses,
        totalAmount: Math.round(totalAmount * 100) / 100
      },
      message: ''
    }
  } catch (err) {
    console.error('[getExpenses] 云函数执行失败', err.message || err)
    return {
      success: false,
      data: null,
      message: '查询账单失败: ' + (err.message || '未知错误')
    }
  }
}
