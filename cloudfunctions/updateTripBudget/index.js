// cloudfunctions/updateTripBudget/index.js
// 设置/更新/清除旅行预算：仅创建者可操作
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, data: null, message: '无法获取用户身份' }

  const { tripId, totalBudget, clear } = event

  if (!tripId) return { success: false, data: null, message: '缺少旅行 ID' }

  // 清除预算模式
  const isClear = clear === true || totalBudget === 0 || totalBudget === '0'

  var numBudget = 0
  if (!isClear) {
    numBudget = Number(totalBudget)
    if (isNaN(numBudget) || numBudget <= 0) {
      return { success: false, data: null, message: '预算金额必须大于 0' }
    }
    if (!/^\d+(\.\d{1,2})?$/.test(String(totalBudget))) {
      return { success: false, data: null, message: '预算金额最多保留两位小数' }
    }
  }

  try {
    const tripRes = await db.collection('trips').doc(tripId).get()
    const trip = tripRes.data
    if (!trip) return { success: false, data: null, message: '旅行不存在' }
    if (trip.status === 'dissolved') return { success: false, data: null, message: '该旅行已解散' }
    if (!trip.memberOpenids || trip.memberOpenids.indexOf(openid) === -1) {
      return { success: false, data: null, message: '你没有权限操作该旅行' }
    }

    // 预算权限：仅旅行创建者可修改
    if (trip.creatorOpenid !== openid) {
      return { success: false, data: null, message: '只有旅行创建者可以修改预算' }
    }

    if (isClear) {
      // 清除预算：用 _.remove() 删除字段，表示"未设置"
      await db.collection('trips').doc(tripId).update({
        data: {
          budget: _.remove(),
          updatedAt: new Date()
        }
      })
      console.log('[updateTripBudget] 预算已清除, tripId:', tripId)
      return { success: true, data: { totalBudget: 0, cleared: true }, message: '' }
    }

    var rounded = Math.round(numBudget * 100) / 100

    // 用 _.set() 强制替换整个 budget 字段（避免之前被清为 null 时 deep merge 失败）
    await db.collection('trips').doc(tripId).update({
      data: {
        budget: _.set({
          totalBudget: rounded,
          updatedAt: new Date(),
          updatedBy: openid
        }),
        updatedAt: new Date()
      }
    })

    console.log('[updateTripBudget] 预算更新成功, tripId:', tripId, 'totalBudget:', rounded)
    return { success: true, data: { totalBudget: rounded }, message: '' }
  } catch (err) {
    console.error('[updateTripBudget] 执行失败', err)
    return { success: false, data: null, message: err.message || '预算更新失败' }
  }
}
