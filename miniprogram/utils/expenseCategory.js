// utils/expenseCategory.js
// 账单分类枚举与展示工具

var CATEGORIES = [
  { key: 'food', label: '餐饮' },
  { key: 'transport', label: '交通' },
  { key: 'hotel', label: '住宿' },
  { key: 'ticket', label: '门票' },
  { key: 'shopping', label: '购物' },
  { key: 'other', label: '其他' }
]

function getCategoryLabel(expense) {
  if (!expense || !expense.category) return ''
  if (expense.category === 'other' && expense.customCategory) {
    return expense.customCategory
  }
  var cat = CATEGORIES.find(function (c) { return c.key === expense.category })
  return cat ? cat.label : expense.category
}

module.exports = {
  CATEGORIES: CATEGORIES,
  getCategoryLabel: getCategoryLabel
}
