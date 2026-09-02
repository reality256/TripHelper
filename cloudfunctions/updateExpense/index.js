// cloudfunctions/updateExpense/index.js
// 编辑账单：只有账单创建者或旅行创建者可操作
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, data: null, message: '无法获取用户身份' }

  const { tripId, expenseId, title, amount, payerOpenid, participantOpenids, note, category, customCategory, type } = event
  if (!tripId) return { success: false, data: null, message: '缺少旅行 ID' }
  if (!expenseId) return { success: false, data: null, message: '缺少账单 ID' }
  if (!title || !title.trim()) return { success: false, data: null, message: '请输入账单标题' }
  var numAmount = Number(amount)
  if (!amount || isNaN(numAmount) || numAmount <= 0) return { success: false, data: null, message: '金额必须为正数' }
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) return { success: false, data: null, message: '金额最多保留两位小数' }
  if (numAmount > 99999999) return { success: false, data: null, message: '金额超出上限' }
  if (!payerOpenid) return { success: false, data: null, message: '请选择付款人' }
  if (!participantOpenids || participantOpenids.length === 0) return { success: false, data: null, message: '请至少选择一位分摊成员' }

  try {
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data
    if (!trip) return { success: false, data: null, message: '旅行不存在' }
    if (trip.status === 'dissolved') return { success: false, data: null, message: '该旅行已解散' }
    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }

    const expRes = await db.collection('expenses').doc(expenseId).get()
    const expense = expRes.data
    if (!expense) return { success: false, data: null, message: '账单不存在' }
    if (expense.tripId !== tripId) return { success: false, data: null, message: '账单不属于该旅行' }
    if (expense.deleted) return { success: false, data: null, message: '该账单已删除' }

    // 权限：账单创建者 或 旅行创建者
    if (expense.createdBy !== openid && trip.creatorOpenid !== openid) {
      return { success: false, data: null, message: '你没有权限编辑该账单' }
    }

    // 校验付款人和分摊成员属于当前旅行（兼容已退出成员的历史账单）
    var allMemberIds = (trip.memberOpenids || []).concat(trip.formerMemberOpenids || [])
    if (allMemberIds.indexOf(payerOpenid) === -1) {
      return { success: false, data: null, message: '付款人不是该旅行成员' }
    }
    for (var i = 0; i < participantOpenids.length; i++) {
      if (allMemberIds.indexOf(participantOpenids[i]) === -1) {
        return { success: false, data: null, message: '分摊成员中存在非旅行成员' }
      }
    }

    await db.collection('expenses').doc(expenseId).update({
      data: {
        title: title.trim(),
        amount: Math.round(numAmount * 100) / 100,
        payerOpenid,
        participantOpenids,
        type: type === 'income' ? 'income' : (expense.type || 'expense'),
        note: note || '',
        category: category || expense.category || 'food',
        customCategory: (category === 'other' ? (customCategory || '') : ''),
        updatedAt: new Date()
      }
    })

    console.log('[updateExpense] 账单更新成功, expenseId:', expenseId)
    return { success: true, data: {}, message: '' }
  } catch (err) {
    console.error('[updateExpense] 执行失败', err)
    return { success: false, data: null, message: err.message || '编辑失败' }
  }
}
