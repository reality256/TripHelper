// services/tripService.js
var cloudService = require('./cloudService')

function createTrip(data) { return cloudService.callCloudFunction('createTrip', data) }
function joinTrip(inviteCode) { return cloudService.callCloudFunction('joinTrip', { inviteCode: inviteCode }) }
function getMyTrips() { return cloudService.callCloudFunction('getMyTrips') }
function getTripDetail(tripId) { return cloudService.callCloudFunction('getTripDetail', { tripId: tripId }) }
function dissolveTrip(tripId) { return cloudService.callCloudFunction('dissolveTrip', { tripId: tripId }) }
function leaveTrip(tripId) { return cloudService.callCloudFunction('leaveTrip', { tripId: tripId }) }

module.exports = {
  createTrip: createTrip,
  joinTrip: joinTrip,
  getMyTrips: getMyTrips,
  getTripDetail: getTripDetail,
  dissolveTrip: dissolveTrip,
  leaveTrip: leaveTrip
}
