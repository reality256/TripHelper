// cloudfunctions/getExpenses/index.js
// 查询旅行账单列表，包含总金额
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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

    if (trip.status === 'dissolved') {
      return { success: false, data: null, message: '该旅行已解散' }
    }

    // 2. 分页查询账单列表（云函数单次 get 上限 100，循环拉全量）
    let expenses = []
    let totalAmount = 0
    try {
      const pageSize = 100
      var offset = 0
      while (true) {
        const expenseRes = await db.collection('expenses')
          .where({ tripId, deleted: _.neq(true) })
          .orderBy('createdAt', 'desc')
          .skip(offset)
          .limit(pageSize)
          .get()
        var page = expenseRes.data || []
        expenses = expenses.concat(page)
        if (page.length < pageSize) break
        offset += pageSize
      }
      // 双保险：排除已软删除的账单（兼容 deleted 为其他真值的脏数据）
      expenses = expenses.filter(function (e) { return !e.deleted })
      // 总消费 = 支出总额 - 入账总额（与前端 calculateTotalExpense 一致）
      totalAmount = expenses.reduce(function (sum, e) {
        var amt = Number(e.amount) || 0
        return e.type === 'income' ? sum - amt : sum + amt
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
