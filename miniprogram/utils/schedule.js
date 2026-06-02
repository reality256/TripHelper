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
    if (aStart !== bStart) return aStart < bStart ? -1 : aStart > bStart ? 1 : 0
    return (a.createdAt || 0) < (b.createdAt || 0) ? -1 : 1
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
 * 判断是否"即将开始"（距开始 <= 60 分钟）
 */
function isUpcomingSoon(schedule, now) {
  now = now || new Date()
  if (!schedule.startTime) return false
  var currentMinutes = now.getHours() * 60 + now.getMinutes()
  var parts = String(schedule.startTime).split(':')
  var startMinutes = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0)
  var diff = startMinutes - currentMinutes
  return diff > 0 && diff <= 60
}

/**
 * 检测同一天内行程冲突
 * @param {Array} schedules - 同一天的行程数组（需有 startTime, endTime）
 * @returns {Array} 冲突的行程对 [{ itemA, itemB, itemAIndex, itemBIndex }, ...]
 */
function detectScheduleConflicts(schedules) {
  var conflicts = []
  var valid = schedules.filter(function (s) { return s.startTime && s.endTime })

  for (var i = 0; i < valid.length; i++) {
    for (var j = i + 1; j < valid.length; j++) {
      if (isTimeOverlap(valid[i], valid[j])) {
        conflicts.push({
          itemA: valid[i],
          itemB: valid[j],
          itemAIndex: i,
          itemBIndex: j
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
 * 获取冲突描述文案
 */
function getConflictText(schedule, allSchedules) {
  var that = this
  var conflicts = allSchedules.filter(function (s) {
    return s !== schedule && s.startTime && s.endTime && schedule.startTime && schedule.endTime && isTimeOverlap(schedule, s)
  })
  if (conflicts.length === 0) return ''
  var names = conflicts.slice(0, 2).map(function (c) { return c.title || '未命名' })
  var text = '时间冲突：与「' + names.join('」「') + '」'
  if (conflicts.length > 2) text += '等行程'
  text += '时间重叠'
  return text
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
  return !!(schedule.latitude && schedule.longitude)
}

module.exports = {
  groupSchedulesByDate: groupSchedulesByDate,
  sortSchedulesByTime: sortSchedulesByTime,
  addDailyScheduleIndex: addDailyScheduleIndex,
  getScheduleStatus: getScheduleStatus,
  isUpcomingSoon: isUpcomingSoon,
  detectScheduleConflicts: detectScheduleConflicts,
  getConflictText: getConflictText,
  getDisplayLocation: getDisplayLocation,
  getDisplayAddress: getDisplayAddress,
  hasLocation: hasLocation
}
