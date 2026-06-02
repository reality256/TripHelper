// utils/format.js
function formatMoney(amount) { return Number(amount || 0).toFixed(2) }
function formatDate(date) {
  if (!date) return ''
  if (typeof date === 'string') return date.slice(0, 10)
  var d = new Date(date)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
function formatTime(time) { return time ? time.slice(0, 5) : '' }
function pad(n) { return String(n).padStart(2, '0') }

module.exports = { formatMoney: formatMoney, formatDate: formatDate, formatTime: formatTime }
