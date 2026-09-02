// cloudfunctions/updateUserProfile/index.js
// 更新用户昵称和头像
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, data: null, message: '无法获取用户身份' }
  }

  const { nickName, avatarUrl } = event

  // 校验 nickName
  var trimmedNick = String(nickName || '').trim()
  if (!trimmedNick) {
    return { success: false, data: null, message: '请输入昵称' }
  }
  if (trimmedNick.length > 20) {
    return { success: false, data: null, message: '昵称不能超过 20 个字符' }
  }

  try {
    // 查询用户
    const userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length === 0) {
      return { success: false, data: null, message: '用户不存在' }
    }

    const user = userRes.data[0]

    // 构建更新数据
    const updateData = {
      nickName: trimmedNick,
      profileCompleted: true,
      updatedAt: new Date()
    }
    if (avatarUrl !== undefined && avatarUrl !== '') {
      // 服务端校验：只接受 cloud:// fileID（V3.2 铁律：DB 不存 temp URL）
      if (typeof avatarUrl !== 'string' || avatarUrl.indexOf('cloud://') !== 0 || avatarUrl.length > 300) {
        return { success: false, data: null, message: '头像格式非法' }
      }
      updateData.avatarUrl = avatarUrl
    }

    await db.collection('users').doc(user._id).update({ data: updateData })

    // 返回更新后的用户信息
    const updatedUser = Object.assign({}, user, updateData)
    delete updatedUser._openid

    console.log('[updateUserProfile] 用户资料更新成功, openid:', openid)

    return {
      success: true,
      data: { user: updatedUser },
      message: ''
    }
  } catch (err) {
    console.error('[updateUserProfile] 云函数执行失败', err)
    return { success: false, data: null, message: '保存失败，请稍后重试' }
  }
}
