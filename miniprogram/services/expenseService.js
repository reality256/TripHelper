// services/expenseService.js
var cloudService = require('./cloudService')

function addExpense(data) { return cloudService.callCloudFunction('addExpense', data) }
function getExpenses(tripId) { return cloudService.callCloudFunction('getExpenses', { tripId: tripId }) }
function getExpenseDetail(tripId, expenseId) { return cloudService.callCloudFunction('getExpenseDetail', { tripId: tripId, expenseId: expenseId }) }
function updateExpense(data) { return cloudService.callCloudFunction('updateExpense', data) }
function deleteExpense(tripId, expenseId) { return cloudService.callCloudFunction('deleteExpense', { tripId: tripId, expenseId: expenseId }) }

module.exports = {
  addExpense: addExpense,
  getExpenses: getExpenses,
  getExpenseDetail: getExpenseDetail,
  updateExpense: updateExpense,
  deleteExpense: deleteExpense
}
