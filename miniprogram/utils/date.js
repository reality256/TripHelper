// utils/date.js
/**
 * 比较两个 HH:mm 格式的时间
 * @param {string} timeA - 格式 HH:mm
 * @param {string} timeB - 格式 HH:mm
 * @returns {number} timeA 的总分钟数 - timeB 的总分钟数（正数表示 timeA 更晚）
 */
function compareTime(timeA, timeB) {
  var partsA = String(timeA || '').split(':')
  var partsB = String(timeB || '').split(':')
  var hourA = parseInt(partsA[0]) || 0
  var minuteA = parseInt(partsA[1]) || 0
  var hourB = parseInt(partsB[0]) || 0
  var minuteB = parseInt(partsB[1]) || 0
  var totalA = hourA * 60 + minuteA
  var totalB = hourB * 60 + minuteB
  return totalA - totalB
}

/**
 * 判断结束时间是否早于开始时间
 * @param {string} startTime - 开始时间 HH:mm
 * @param {string} endTime - 结束时间 HH:mm
 * @returns {boolean} 如果结束时间早于开始时间返回 true
 */
function isEndTimeBeforeStartTime(startTime, endTime) {
  if (!startTime || !endTime) return false
  return compareTime(endTime, startTime) < 0
}

module.exports = {
  compareTime: compareTime,
  isEndTimeBeforeStartTime: isEndTimeBeforeStartTime
}
