// utils/amount.js
// 金额输入格式化和校验：记账与预算共用

/**
 * 实时格式化金额输入：去除非数字字符、限制一个小数点、最多两位小数
 * @param {string} val - 原始输入
 * @returns {string} 格式化后的字符串
 */
function formatAmountInput(val) {
  if (!val) return ''
  // 只允许数字和一个小数点
  val = val.replace(/[^\d.]/g, '')
  var dotIndex = val.indexOf('.')
  if (dotIndex !== -1) {
    // 只保留第一个小数点
    val = val.substring(0, dotIndex + 1) + val.substring(dotIndex + 1).replace(/\./g, '')
    // 最多两位小数
    if (val.length - dotIndex > 3) {
      val = val.substring(0, dotIndex + 3)
    }
  }
  return val
}

/**
 * 提交时校验金额
 * @param {string|number} value - 金额字符串或数字
 * @returns {Object} { valid: boolean, message: string, value: number }
 */
function validateAmount(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return { valid: false, message: '请输入金额', value: 0 }
  }
  var str = String(value).trim()
  // 格式校验
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    if (/[^\d.]/.test(str)) {
      return { valid: false, message: '金额包含非法字符', value: 0 }
    }
    var dots = str.split('.').length - 1
    if (dots > 1) {
      return { valid: false, message: '金额格式不正确', value: 0 }
    }
    var dotIdx = str.indexOf('.')
    if (dotIdx !== -1 && str.length - dotIdx > 3) {
      return { valid: false, message: '金额最多支持两位小数', value: 0 }
    }
    return { valid: false, message: '金额格式不正确', value: 0 }
  }
  var num = Number(str)
  if (isNaN(num)) {
    return { valid: false, message: '金额格式不正确', value: 0 }
  }
  if (num <= 0) {
    return { valid: false, message: '金额必须大于 0', value: 0 }
  }
  if (num > 99999999) {
    return { valid: false, message: '金额超出限制', value: 0 }
  }
  return { valid: true, message: '', value: Math.round(num * 100) / 100 }
}

module.exports = {
  formatAmountInput: formatAmountInput,
  validateAmount: validateAmount
}
