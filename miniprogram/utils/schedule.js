// utils/schedule.js
// V3.0 行程工具函数：分组、排序、编号、状态判断、冲突检测

/**
 * 按日期分组
 * @param {Array} schedules - 行程数组
 * @returns {Array} [{ date: '2026-06-05', items: [...] }, ...]
 */
function groupSchedulesByDate(schedules) {
  var groupMap = {}
  schedules.forEach(function (item) {
    var d = item.date
    if (!d) return
    if (!groupMap[d]) groupMap[d] = { date: d, items: [] }
    groupMap[d].items.push(item)
  })
  var groups = []
  for (var k in groupMap) {
    if (groupMap.hasOwnProperty(k)) groups.push(groupMap[k])
  }
  groups.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0 })
  return groups
}

/**
 * 按开始时间升序排序
 * @param {Array} schedules - 行程数组
 * @returns {Array}
 */
function sortSchedulesByTime(schedules) {
  return schedules.slice().sort(function (a, b) {
    var aStart = a.startTime || ''
    var bStart = b.startTime || ''
    // 无开始时间的行程排到每日末尾（避免成为路线起点）
    if (aStart === '' && bStart !== '') return 1
    if (aStart !== '' && bStart === '') return -1
    if (aStart !== bStart) return aStart < bStart ? -1 : 1
    var aCreated = a.createdAt || 0
    var bCreated = b.createdAt || 0
    if (aCreated !== bCreated) return aCreated < bCreated ? -1 : 1
    return 0  // 比较器一致律：相等必须返回 0，保证 iOS/Android 排序一致
  })
}

/**
 * 为每日行程添加序号（1 开始）
 * @param {Array} groupedSchedules - groupSchedulesByDate 的输出
 * @returns {Array} 每个 item 增加 dailyIndex 字段
 */
function addDailyScheduleIndex(groupedSchedules) {
  return groupedSchedules.map(function (group) {
    var sorted = sortSchedulesByTime(group.items)
    var items = sorted.map(function (item, idx) {
      var copy = {}
      for (var k in item) { if (item.hasOwnProperty(k)) copy[k] = item[k] }
      copy.dailyIndex = idx + 1
      return copy
    })
    return { date: group.date, items: items }
  })
}

/**
 * 判断行程状态
 * @param {Object} schedule - 行程对象，需有 startTime, endTime
 * @param {Date} now - 当前时间
 * @returns {string} 'upcoming' | 'ongoing' | 'ended' | 'started'
 */
function getScheduleStatus(schedule, now) {
  now = now || new Date()
  var currentMinutes = now.getHours() * 60 + now.getMinutes()

  if (!schedule.startTime) return 'unknown'

  var startParts = String(schedule.startTime).split(':')
  var startMinutes = (parseInt(startParts[0]) || 0) * 60 + (parseInt(startParts[1]) || 0)

  if (schedule.endTime) {
    var endParts = String(schedule.endTime).split(':')
    var endMinutes = (parseInt(endParts[0]) || 0) * 60 + (parseInt(endParts[1]) || 0)
    if (currentMinutes < startMinutes) return 'upcoming'
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) return 'ongoing'
    return 'ended'
  }

  // 无结束时间
  if (currentMinutes < startMinutes) return 'upcoming'
  return 'started'
}

/**
 * 检测同一天内行程冲突
 * @param {Array} schedules - 同一天的行程数组（需有 startTime, endTime）
 * @returns {Array} 冲突的行程对 [{ itemA, itemB, itemAIndex, itemBIndex }, ...]
 * 注意：itemAIndex/itemBIndex 是原 schedules 数组的下标（含无时间行程），
 * 调用方按原数组索引消费，避免索引错位挂错冲突对象
 */
function detectScheduleConflicts(schedules) {
  var conflicts = []
  var validIdx = []
  for (var i = 0; i < schedules.length; i++) {
    if (schedules[i].startTime && schedules[i].endTime) validIdx.push(i)
  }

  for (var a = 0; a < validIdx.length; a++) {
    for (var b = a + 1; b < validIdx.length; b++) {
      var itemA = schedules[validIdx[a]]
      var itemB = schedules[validIdx[b]]
      if (isTimeOverlap(itemA, itemB)) {
        conflicts.push({
          itemA: itemA,
          itemB: itemB,
          itemAIndex: validIdx[a],
          itemBIndex: validIdx[b]
        })
      }
    }
  }
  return conflicts
}

function isTimeOverlap(a, b) {
  return a.startTime < b.endTime && b.startTime < a.endTime
}

/**
 * 兼容旧数据：旧行程可能只有 location 字段，没有 locationName
 */
function getDisplayLocation(schedule) {
  return schedule.locationName || schedule.location || ''
}

function getDisplayAddress(schedule) {
  return schedule.locationAddress || ''
}

function hasLocation(schedule) {
  // 显式数值校验：纬度/经度为合法 0 时也是有效地点（赤道/本初子午线）
  return typeof schedule.latitude === 'number' && !isNaN(schedule.latitude) &&
         typeof schedule.longitude === 'number' && !isNaN(schedule.longitude)
}

module.exports = {
  groupSchedulesByDate: groupSchedulesByDate,
  sortSchedulesByTime: sortSchedulesByTime,
  addDailyScheduleIndex: addDailyScheduleIndex,
  getScheduleStatus: getScheduleStatus,
  detectScheduleConflicts: detectScheduleConflicts,
  getDisplayLocation: getDisplayLocation,
  getDisplayAddress: getDisplayAddress,
  hasLocation: hasLocation
}
