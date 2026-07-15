// pages/members/members.js
var tripService = require('../../services/tripService')
var userUtils = require('../../utils/user')

Page({
  data: {
    tripId: '',
    members: [],
    inviteCode: '',
    loading: true
  },

  onLoad: function (options) {
    if (options.tripId) this.setData({ tripId: options.tripId })
  },

  onShow: function () {
    if (this.data.tripId) {
      this.loadMembers()
    }
  },

  loadMembers: function () {
    var that = this
    this.setData({ loading: true })

    tripService.getTripDetail(this.data.tripId).then(function (data) {
      var members = data.members || []

      // 收集所有 cloud:// 文件 ID，准备批量转换（去重）
      var cloudFileIds = []
      var seenFileIds = {}
      for (var i = 0; i < members.length; i++) {
        var av = members[i].avatarUrl
        if (userUtils.isCloudFileID(av) && !seenFileIds[av]) {
          cloudFileIds.push(av)
          seenFileIds[av] = true
        }
      }

      var finalize = function (fileMap) {
        fileMap = fileMap || {}
        var membersWithAvatar = members.map(function (m) {
          var displayAvatar = m.avatarUrl || ''
          var fromFileMap = false
          // cloud:// fileID → 转为 temp URL
          if (userUtils.isCloudFileID(displayAvatar) && fileMap[displayAvatar]) {
            displayAvatar = fileMap[displayAvatar]
            fromFileMap = true
          }
          // 并非来自 fileMap 的才需要检查（来自 fileMap 的是新鲜 temp URL）
          if (!fromFileMap) {
            // cloud:// 未能转换 → 无法渲染 → 降级为默认头像
            if (userUtils.isCloudFileID(displayAvatar)) {
              console.warn('[members] 成员头像 cloud:// 未能转换:', m.nickName)
              displayAvatar = ''
            }
            // 数据库中存了过期的 temp URL → 降级为默认头像
            if (userUtils.isCloudTempUrl(displayAvatar)) {
              console.warn('[members] 成员头像为过期临时 URL:', m.nickName)
              displayAvatar = ''
            }
          }
          return {
            openid: m.openid,
            nickName: m.nickName,
            avatarUrl: displayAvatar,
            isCreator: m.isCreator
          }
        })
        that.setData({
          members: membersWithAvatar,
          inviteCode: data.trip.inviteCode,
          loading: false
        })
      }

      if (cloudFileIds.length === 0) {
        finalize({})
      } else {
        wx.cloud.getTempFileURL({ fileList: cloudFileIds }).then(function (res) {
          var fileMap = {}
          var fileList = res.fileList || []
          for (var k = 0; k < fileList.length; k++) {
            if (fileList[k].tempFileURL) {
              fileMap[fileList[k].fileID] = fileList[k].tempFileURL
            }
          }
          finalize(fileMap)
        }).catch(function () {
          finalize({})
        })
      }
    }).catch(function (err) {
      console.error('[members] 加载失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  copyInviteCode: function () {
    var code = this.data.inviteCode
    if (!code) return
    wx.setClipboardData({
      data: code,
      success: function () {
        wx.showToast({ title: '邀请码已复制', icon: 'success' })
      }
    })
  },

  onAvatarError: function () {
    // 头像加载失败时 WXML 中 src 会自动 fallback 到 /images/avatar.png
    console.warn('[members] 头像加载失败，已降级为默认头像')
  }
})
