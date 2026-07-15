// utils/user.js
// 统一处理用户昵称和头像的默认值显示

/**
 * 获取用户显示名称
 * 优先级：user.nickName → 旅友+openid后4位 → 未知用户
 */
function getDisplayName(user) {
  if (user && user.nickName && user.nickName !== '微信用户') {
    return user.nickName
  }
  if (user && user.openid) {
    return '旅友' + String(user.openid).slice(-4).toUpperCase()
  }
  return '未知用户'
}

/**
 * 判断头像 URL 是否为 cloud:// 格式的永久文件 ID
 */
function isCloudFileID(url) {
  return !!(url && typeof url === 'string' && url.indexOf('cloud://') === 0)
}

/**
 * 判断头像 URL 是否为 CloudBase 临时下载 URL（含 sign 签名，会过期）
 * 格式: https://xxx.tcb.qcloud.la/path?sign=...&t=...
 */
function isCloudTempUrl(url) {
  return !!(url && typeof url === 'string' &&
    url.indexOf('https://') === 0 &&
    url.indexOf('.tcb.qcloud.la/') !== -1 &&
    url.indexOf('sign=') !== -1)
}

module.exports = {
  getDisplayName: getDisplayName,
  isCloudFileID: isCloudFileID,
  isCloudTempUrl: isCloudTempUrl
}
