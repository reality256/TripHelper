// services/cloudService.js
// 云函数调用基础封装，页面不应直接调用 wx.cloud.callFunction

function callCloudFunction(name, data) {
  data = data || {}
  return wx.cloud.callFunction({ name: name, data: data }).then(function (res) {
    var result = res.result
    if (!result) throw new Error('云函数无返回结果')
    if (!result.success) throw new Error(result.message || '请求失败')
    return result.data
  }).catch(function (err) {
    console.error('[cloudService] ' + name + ' 调用失败', err)
    throw err
  })
}

module.exports = { callCloudFunction: callCloudFunction }
