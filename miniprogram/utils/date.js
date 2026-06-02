// utils/date.js
function getToday() {
  var d = new Date()
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
function pad(n) { return String(n).padStart(2, '0') }

module.exports = { getToday: getToday }
