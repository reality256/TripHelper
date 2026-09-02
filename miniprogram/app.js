// app.js
App({
  globalData: {
    user: null,
    openid: null
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: 'cloud1-d3gp6kk8v7af7dc9b',
      traceUser: true
    })

    console.log('[app] 云开发初始化完成')

    // 用户初始化：调用 login 云函数获取 openid 和用户信息
    this.initUser()
  },

  // 初始化用户：调用 login 云函数，完成用户识别和记录创建
  // 返回 Promise 挂到 this._userReady，页面可等待初始化完成（解决冷启动竞态）
  initUser: function () {
    var that = this

    this._userReady = wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then(function (res) {
      var result = res.result
      if (result && result.success) {
        that.globalData.openid = result.data.openid
        that.globalData.user = result.data.user
        return result.data.user
      }
      throw new Error((result && result.message) || '登录失败')
    }).catch(function (err) {
      console.error('[app] 用户初始化失败:', err && err.message ? err.message : err)
      return null
    })

    return this._userReady
  }
})
