// cloudfunctions/addExpense/index.js
// 添加旅行账单：权限校验、写入 expenses 集合
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

  const { tripId, title, amount, payerOpenid, participantOpenids, note, category, customCategory, type } = event

  // 服务端校验
  if (!tripId) {
    return { success: false, data: null, message: '缺少旅行 ID' }
  }
  if (!title || !title.trim()) {
    return { success: false, data: null, message: '请输入账单标题' }
  }
  var numAmount = Number(amount)
  if (!amount || isNaN(numAmount) || numAmount <= 0) {
    return { success: false, data: null, message: '金额必须为正数' }
  }
  // 校验最多两位小数
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) {
    return { success: false, data: null, message: '金额最多保留两位小数' }
  }
  if (!payerOpenid) {
    return { success: false, data: null, message: '请选择付款人' }
  }
  if (!participantOpenids || participantOpenids.length === 0) {
    return { success: false, data: null, message: '请至少选择一位分摊成员' }
  }

  try {
    // 1. 查询旅行信息并校验权限
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data

    if (!trip) {
      return { success: false, data: null, message: '旅行不存在' }
    }

    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }

    // 2. 校验付款人属于该旅行
    if (trip.memberOpenids.indexOf(payerOpenid) === -1) {
      return { success: false, data: null, message: '付款人不是该旅行成员' }
    }

    // 3. 校验所有分摊成员属于该旅行
    for (var i = 0; i < participantOpenids.length; i++) {
      if (trip.memberOpenids.indexOf(participantOpenids[i]) === -1) {
        return { success: false, data: null, message: '分摊成员中存在非旅行成员' }
      }
    }

    // 4. 写入账单
    const expense = {
      tripId,
      title: title.trim(),
      amount: Math.round(numAmount * 100) / 100,
      payerOpenid,
      participantOpenids,
      splitType: 'equal',
      type: type === 'income' ? 'income' : 'expense',
      note: note || '',
      category: category || 'food',
      customCategory: (category === 'other' ? (customCategory || '') : ''),
      createdBy: openid,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const addRes = await db.collection('expenses').add({ data: expense })
    expense._id = addRes._id

    console.log('[addExpense] 账单创建成功, expenseId:', addRes._id)

    return {
      success: true,
      data: {
        expenseId: addRes._id,
        expense
      },
      message: ''
    }
  } catch (err) {
    console.error('[addExpense] 云函数执行失败', err.message || err)
    return {
      success: false,
      data: null,
      message: '添加账单失败: ' + (err.message || '未知错误')
    }
  }
}
