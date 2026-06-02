// cloudfunctions/calculateSettlement/index.js
// 计算结算：每人实付/应付/净额 + 最简转账方案
// 内部使用"分"计算，避免浮点误差
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
    // 1. 查询旅行并校验权限
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data

    if (!trip) {
      return { success: false, data: null, message: '旅行不存在' }
    }

    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }

    // 2. 查询所有账单
    let expenses = []
    try {
      const expenseRes = await db.collection('expenses')
        .where({ tripId })
        .get()
      expenses = expenseRes.data
    } catch (e) {
      // 集合不存在则无账单
    }

    // 3. 查询成员信息
    const memberOpenids = trip.memberOpenids || []
    let userMap = {}
    if (memberOpenids.length > 0) {
      const userRes = await db.collection('users')
        .where({ openid: db.command.in(memberOpenids) })
        .get()
      userRes.data.forEach(function (u) {
        userMap[u.openid] = u
      })
    }

    // 4. 初始化每个成员的 paid / shouldPay（单位：分）
    let balanceMap = {}
    memberOpenids.forEach(function (oid) {
      balanceMap[oid] = { paid: 0, shouldPay: 0 }
    })

    // 5. 遍历账单计算
    expenses.forEach(function (exp) {
      var amountInCents = Math.round(Number(exp.amount) * 100)
      var participants = exp.participantOpenids || []
      var payer = exp.payerOpenid

      if (participants.length === 0) return

      // 付款人实付增加
      if (balanceMap[payer]) {
        balanceMap[payer].paid += amountInCents
      }

      // 每个参与人应付增加（平均分摊）
      var perPersonCents = Math.floor(amountInCents / participants.length)
      var remainder = amountInCents - perPersonCents * participants.length

      participants.forEach(function (oid, idx) {
        if (balanceMap[oid]) {
          // 前 remainder 个人多分担 1 分，处理除不尽的情况
          balanceMap[oid].shouldPay += perPersonCents + (idx < remainder ? 1 : 0)
        }
      })
    })

    // 6. 计算净额（分）
    // net > 0 = 应收，net < 0 = 应付
    let balances = []
    memberOpenids.forEach(function (oid) {
      var b = balanceMap[oid]
      var net = b.paid - b.shouldPay
      var user = userMap[oid] || {}
      balances.push({
        openid: oid,
        nickName: user.nickName || '未知用户',
        avatarUrl: user.avatarUrl || '',
        paid: b.paid / 100,
        shouldPay: b.shouldPay / 100,
        net: net / 100
      })
    })

    // 7. 贪心算法生成最简转账方案
    // 应收款人（net > 0，按 net 降序）
    var creditors = balances.filter(function (b) { return b.net > 0 })
                            .sort(function (a, b) { return b.net - a.net })
    // 应付款人（net < 0，按 |net| 降序，即 net 升序）
    var debtors = balances.filter(function (b) { return b.net < 0 })
                          .sort(function (a, b) { return a.net - b.net })

    var transfers = []
    var EPSILON = 0.001

    // 深拷贝 net 值用于贪心匹配
    var creditValues = creditors.map(function (c) { return c.net })
    var debitValues = debtors.map(function (d) { return -d.net })  // 取正数

    var ci = 0
    var di = 0
    while (ci < creditors.length && di < debtors.length) {
      var transferAmount = Math.min(creditValues[ci], debitValues[di])
      if (transferAmount < EPSILON) break

      creditValues[ci] = Math.round((creditValues[ci] - transferAmount) * 100) / 100
      debitValues[di] = Math.round((debitValues[di] - transferAmount) * 100) / 100

      transfers.push({
        from: debtors[di].openid,
        fromName: debtors[di].nickName,
        to: creditors[ci].openid,
        toName: creditors[ci].nickName,
        amount: Math.round(transferAmount * 100) / 100
      })

      if (creditValues[ci] < EPSILON) ci++
      if (debitValues[di] < EPSILON) di++
    }

    console.log('[calculateSettlement] 结算完成, 成员:', balances.length, '转账:', transfers.length)

    return {
      success: true,
      data: { balances, transfers },
      message: ''
    }
  } catch (err) {
    console.error('[calculateSettlement] 云函数执行失败', err.message || err)
    return {
      success: false,
      data: null,
      message: '结算计算失败: ' + (err.message || '未知错误')
    }
  }
}
