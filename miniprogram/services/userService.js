// services/userService.js
var cloudService = require('./cloudService')

function login(data) {
  return cloudService.callCloudFunction('login', data)
}

function updateUserProfile(data) {
  return cloudService.callCloudFunction('updateUserProfile', data)
}

module.exports = {
  login: login,
  updateUserProfile: updateUserProfile
}
