// services/itineraryService.js
var cloudService = require('./cloudService')

function addItinerary(data) { return cloudService.callCloudFunction('addItinerary', data) }
function getItinerary(tripId) { return cloudService.callCloudFunction('getItinerary', { tripId: tripId }) }
function deleteItinerary(tripId, itineraryId) { return cloudService.callCloudFunction('deleteItinerary', { tripId: tripId, itineraryId: itineraryId }) }

module.exports = { addItinerary: addItinerary, getItinerary: getItinerary, deleteItinerary: deleteItinerary }
