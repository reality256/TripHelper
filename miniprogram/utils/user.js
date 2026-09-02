// utils/user.js
// 统一处理用户头像 URL 判定

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
  isCloudFileID: isCloudFileID,
  isCloudTempUrl: isCloudTempUrl
}
