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
      // 用户已存在：只读取，资料更新统一走 updateUserProfile（避免双写入入口）
      user = userRes.data[0]
    } else {
      // 新用户：默认昵称用 openid 后 4 位（避免 count() 并发重名）
      const newUser = {
        openid,
        nickName: '旅友' + openid.slice(-4).toUpperCase(),
        avatarUrl: '',
        profileCompleted: false,
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
