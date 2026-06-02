// services/userService.js
var cloudService = require('./cloudService')

function login(data) {
  return cloudService.callCloudFunction('login', data)
}

module.exports = { login: login }
