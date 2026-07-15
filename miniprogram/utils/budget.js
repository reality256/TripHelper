// utils/budget.js
// V3.0 预算工具函数：预算总览、分类统计、人均消耗

/**
 * 计算支出净额（不计入账）
 * @param {Array} bills - 账单数组，每项含 amount, type
 * @returns {number}
 */
function calculateNetExpense(bills) {
  var total = 0
  bills.forEach(function (b) {
    var amt = Number(b.amount) || 0
    if (b.deleted) return
    if (b.type === 'income') return
    total += amt
  })
  return Math.max(0, Math.round(total * 100) / 100)
}

/**
 * 计算入账总额
 * @param {Array} bills
 * @returns {number}
 */
function calculateIncomeTotal(bills) {
  var total = 0
  bills.forEach(function (b) {
    if (b.deleted) return
    if (b.type === 'income') {
      total += Number(b.amount) || 0
    }
  })
  return Math.round(total * 100) / 100
}

/**
 * 计算账单页「总消费」：支出计入、入账扣减、跳过已删除
 * 这是账单 tab 和预算页统一使用的总消费计算函数
 * @param {Array} bills
 * @returns {number}
 */
function calculateTotalExpense(bills) {
  var total = 0
  bills.forEach(function (b) {
    if (b.deleted) return
    var amt = Number(b.amount) || 0
    if (b.type === 'income') {
      total -= amt
    } else {
      total += amt
    }
  })
  return Math.max(0, Math.round(total * 100) / 100)
}

/**
 * 计算总金额（不作类型区分，纯累加）
 * @param {Array} bills
 * @returns {number}
 */
function calculateGrossExpense(bills) {
  var total = 0
  bills.forEach(function (b) {
    if (b.deleted) return
    var amt = Number(b.amount) || 0
    total += amt
  })
  return Math.round(total * 100) / 100
}

/**
 * 计算分类支出（不计入账）
 * @param {Array} bills
 * @param {Array} categories - 分类 key 数组
 * @returns {Object} { food: 860, transport: 450, ... }
 */
function calculateCategoryCosts(bills, categories) {
  var costs = {}
  categories.forEach(function (c) { costs[c.key] = 0 })
  bills.forEach(function (b) {
    if (b.deleted) return
    if (b.type === 'income') return
    var cat = b.category || 'food'
    var amt = Number(b.amount) || 0
    if (!costs.hasOwnProperty(cat)) costs[cat] = 0
    costs[cat] += amt
  })
  for (var k in costs) {
    if (costs.hasOwnProperty(k)) costs[k] = Math.max(0, Math.round(costs[k] * 100) / 100)
  }
  return costs
}

/**
 * 计算预算总览
 * @param {Array} bills - 账单数组
 * @param {Object} budget - trip.budget 对象
 * @param {number} memberCount - 当前成员数
 * @returns {Object}
 */
function calculateBudgetSummary(bills, budget, memberCount) {
  var totalExpense = calculateTotalExpense(bills)

  // 统一判断是否已设置预算：budget 存在且 totalBudget 为有效正数
  var totalBudget = (budget && budget.totalBudget && Number(budget.totalBudget) > 0)
    ? Number(budget.totalBudget)
    : 0
  var hasBudget = totalBudget > 0

  // 全部基于 totalExpense 计算（与卡片展示的"当前已花费"一致）
  var usageRate = hasBudget ? Math.round(totalExpense / totalBudget * 10000) / 100 : 0
  var overBudget = hasBudget ? Math.max(0, Math.round((totalExpense - totalBudget) * 100) / 100) : 0
  var remainingBudget = hasBudget ? Math.max(0, Math.round((totalBudget - totalExpense) * 100) / 100) : 0
  var isOverBudget = hasBudget && totalExpense > totalBudget

  return {
    totalExpense: totalExpense,
    totalBudget: totalBudget,
    usageRate: usageRate,
    remainingBudget: remainingBudget,
    overBudget: overBudget,
    isOverBudget: isOverBudget,
    hasBudget: hasBudget
  }
}

/**
 * 计算分类预算统计
 * @param {Object} categoryCosts - calculateCategoryCosts 输出
 * @param {Object} categoryBudgets - { food: 1200, transport: 800, ... }
 * @param {Array} categories - 分类列表 [{ key, label }]
 * @returns {Array}
 */
function calculateCategoryBudgetStats(categoryCosts, categoryBudgets, categories) {
  return categories.map(function (cat) {
    var cost = categoryCosts[cat.key] || 0
    var budget = (categoryBudgets && categoryBudgets[cat.key]) ? Number(categoryBudgets[cat.key]) : 0
    var usageRate = budget > 0 ? Math.round(cost / budget * 10000) / 100 : 0
    var overBudget = budget > 0 ? Math.max(0, Math.round((cost - budget) * 100) / 100) : 0
    var hasBudget = budget > 0
    return {
      key: cat.key,
      label: cat.label,
      cost: cost,
      budget: budget,
      usageRate: usageRate,
      overBudget: overBudget,
      hasBudget: hasBudget,
      isOver: budget > 0 && cost > budget
    }
  })
}

module.exports = {
  calculateNetExpense: calculateNetExpense,
  calculateTotalExpense: calculateTotalExpense,
  calculateIncomeTotal: calculateIncomeTotal,
  calculateGrossExpense: calculateGrossExpense,
  calculateCategoryCosts: calculateCategoryCosts,
  calculateBudgetSummary: calculateBudgetSummary,
  calculateCategoryBudgetStats: calculateCategoryBudgetStats
}
