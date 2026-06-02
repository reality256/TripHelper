// services/settlementService.js
var cloudService = require('./cloudService')

function calculateSettlement(tripId) {
  return cloudService.callCloudFunction('calculateSettlement', { tripId: tripId })
}

module.exports = { calculateSettlement: calculateSettlement }
