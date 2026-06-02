// cloudfunctions/login/index.js
// 登录云函数：获取 openid，查询或创建用户记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      data: null,
      message: '无法获取用户 openid'
    }
  }

  try {
    // 查询用户是否已存在
    const userRes = await db.collection('users').where({ openid }).get()

    let user = null

    if (userRes.data.length > 0) {
      // 用户已存在，更新昵称和头像
      user = userRes.data[0]

      const updateData = {}
      if (event.nickName !== undefined && event.nickName !== '') {
        updateData.nickName = event.nickName
      }
      if (event.avatarUrl !== undefined && event.avatarUrl !== '') {
        updateData.avatarUrl = event.avatarUrl
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date()
        await db.collection('users').doc(user._id).update({ data: updateData })
        user = Object.assign({}, user, updateData)
      }
    } else {
      // 新用户，创建记录
      const newUser = {
        openid,
        nickName: event.nickName || '微信用户',
        avatarUrl: event.avatarUrl || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const addRes = await db.collection('users').add({ data: newUser })
      user = Object.assign({ _id: addRes._id }, newUser)
    }

    console.log('[login] 用户登录成功, openid:', openid)

    return {
      success: true,
      data: {
        openid,
        user
      },
      message: ''
    }
  } catch (err) {
    console.error('[login] 云函数执行失败', err)
    return {
      success: false,
      data: null,
      message: '登录失败，请稍后重试'
    }
  }
}
