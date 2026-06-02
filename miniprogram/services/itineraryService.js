// services/itineraryService.js
var cloudService = require('./cloudService')

function addItinerary(data) { return cloudService.callCloudFunction('addItinerary', data) }
function getItinerary(tripId) { return cloudService.callCloudFunction('getItinerary', { tripId: tripId }) }

module.exports = { addItinerary: addItinerary, getItinerary: getItinerary }
