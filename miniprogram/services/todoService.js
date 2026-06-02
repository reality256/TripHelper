// services/todoService.js
var cloudService = require('./cloudService')

function getTodos(tripId)       { return cloudService.callCloudFunction('getTodos', { tripId: tripId }) }
function addTodo(data)          { return cloudService.callCloudFunction('addTodo', data) }
function updateTodoStatus(tripId, todoId, completed) { return cloudService.callCloudFunction('updateTodoStatus', { tripId: tripId, todoId: todoId, completed: completed }) }
function deleteTodo(tripId, todoId) { return cloudService.callCloudFunction('deleteTodo', { tripId: tripId, todoId: todoId }) }

module.exports = { getTodos: getTodos, addTodo: addTodo, updateTodoStatus: updateTodoStatus, deleteTodo: deleteTodo }
