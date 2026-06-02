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
 * 获取用户显示头像
 * 优先使用 user.avatarUrl，否则返回空字符串（使用默认头像占位）
 */
function getDisplayAvatar(user) {
  if (user && user.avatarUrl) {
    return user.avatarUrl
  }
  return ''
}

module.exports = {
  getDisplayName: getDisplayName,
  getDisplayAvatar: getDisplayAvatar
}
