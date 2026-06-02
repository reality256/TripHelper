// utils/money.js
// 内部使用"分"为单位避免浮点误差

function yuanToFen(yuan) { return Math.round(Number(yuan) * 100) }
function fenToYuan(fen) { return Number((fen / 100).toFixed(2)) }
function formatMoney(amount) { return Number(amount || 0).toFixed(2) }
function splitEqually(totalAmount, count) {
  if (count <= 0) return 0
  return fenToYuan(Math.floor(yuanToFen(totalAmount) / count))
}

module.exports = {
  yuanToFen: yuanToFen,
  fenToYuan: fenToYuan,
  formatMoney: formatMoney,
  splitEqually: splitEqually
}
