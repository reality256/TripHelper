// cloudfunctions/getTripDetail/index.js
// 获取旅行详情：基本信息、成员、账单概览、行程概览
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
    // 1. 查询旅行信息
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data

    if (!trip) {
      return { success: false, data: null, message: '旅行不存在' }
    }

    // 2. 校验旅行状态：已解散的拒绝访问
    if (trip.status === 'dissolved') {
      return { success: false, data: null, message: '该旅行已解散' }
    }

    // 3. 权限校验：当前用户必须属于该旅行
    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限查看该旅行' }
    }

    // 4. 查询成员信息
    const memberOpenids = trip.memberOpenids || []
    let members = []
    if (memberOpenids.length > 0) {
      const userRes = await db.collection('users')
        .where({ openid: db.command.in(memberOpenids) })
        .get()
      members = userRes.data.map(function (u) {
        return {
          openid: u.openid,
          nickName: u.nickName,
          avatarUrl: u.avatarUrl,
          isCreator: u.openid === trip.creatorOpenid
        }
      })
    }

    // 5. 查询账单概览（集合可能尚不存在，兼容处理）
    let expenseSummary = { count: 0, totalAmount: 0 }
    try {
      const expenseRes = await db.collection('expenses')
        .where({ tripId })
        .get()
      // 排除已删除账单
      const activeExpenses = expenseRes.data.filter(function (e) { return !e.deleted })
      // 总消费 = 支出总额 - 入账总额（与前端 calculateTotalExpense 一致）
      const totalAmount = activeExpenses.reduce(function (sum, e) {
        var amt = Number(e.amount) || 0
        return e.type === 'income' ? sum - amt : sum + amt
      }, 0)
      expenseSummary = {
        count: activeExpenses.length,
        totalAmount: Math.round(totalAmount * 100) / 100
      }
    } catch (e) {
      console.log('[getTripDetail] expenses 集合尚不可用，跳过')
    }

    // 6. 查询行程概览（集合可能尚不存在，兼容处理）
    let itineraryPreview = []
    try {
      const itineraryRes = await db.collection('itinerary')
        .where({ tripId })
        .orderBy('date', 'asc')
        .orderBy('startTime', 'asc')
        .limit(5)
        .get()
      itineraryPreview = itineraryRes.data
    } catch (e) {
      console.log('[getTripDetail] itinerary 集合尚不可用，跳过')
    }

    console.log('[getTripDetail] 查询成功, tripId:', tripId)

    return {
      success: true,
      data: {
        trip,
        members,
        expenseSummary,
        itineraryPreview
      },
      message: ''
    }
  } catch (err) {
    console.error('[getTripDetail] 云函数执行失败', err)
    return {
      success: false,
      data: null,
      message: '查询失败，请稍后重试'
    }
  }
}
