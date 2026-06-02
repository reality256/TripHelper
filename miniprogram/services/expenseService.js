// services/expenseService.js
var cloudService = require('./cloudService')

function addExpense(data) { return cloudService.callCloudFunction('addExpense', data) }
function getExpenses(tripId) { return cloudService.callCloudFunction('getExpenses', { tripId: tripId }) }

module.exports = { addExpense: addExpense, getExpenses: getExpenses }
