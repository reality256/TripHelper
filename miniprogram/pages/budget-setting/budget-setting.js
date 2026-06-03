// pages/budget-setting/budget-setting.js
// V3.0 预算设置页面：仅旅行创建者可访问
var tripService = require('../../services/tripService')
var expenseService = require('../../services/expenseService')
var budgetUtils = require('../../utils/budget')
var amountUtils = require('../../utils/amount')

Page({
  data: {
    tripId: '',
    trip: null,
    members: [],
    memberCount: 0,
    loading: true,
    totalBudget: '',
    currentBudget: 0,
    hasBudget: false,
    submitting: false,
    isCreator: false,
    permissionDenied: false,
    perPersonBudget: '',
    perPersonCurrent: '',
    currentExpense: '0.00',
    clearing: false
  },

  onLoad: function (options) {
    if (options.tripId) {
      this.setData({ tripId: options.tripId })
      this.loadData()
    }
  },

  onShow: function () {
    // 从其他页面返回时刷新账单数据
    if (this.data.tripId && !this.data.loading) {
      this.loadExpenseOnly()
    }
  },

  loadData: function () {
    var that = this
    this.setData({ loading: true })

    tripService.getTripDetail(this.data.tripId).then(function (data) {
      var trip = data.trip
      var myOpenid = getApp().globalData.openid || ''
      var isCreator = trip.creatorOpenid === myOpenid
      var budget = trip.budget || {}
      var totalBudget = (budget && budget.totalBudget) ? budget.totalBudget : 0
      var hasBudget = !!(budget && budget.totalBudget && Number(budget.totalBudget) > 0)

      if (!isCreator) {
        wx.showToast({ title: '只有旅行创建者可以修改预算', icon: 'none' })
      }

      var memberCount = (data.members || []).length
      that.setData({
        trip: trip,
        members: data.members || [],
        memberCount: memberCount,
        currentBudget: totalBudget,
        totalBudget: hasBudget ? String(totalBudget) : '',
        hasBudget: hasBudget,
        isCreator: isCreator,
        permissionDenied: !isCreator,
        perPersonBudget: hasBudget ? that.calcPerPerson(totalBudget) : '',
        perPersonCurrent: hasBudget && memberCount > 0 ? (totalBudget / memberCount).toFixed(2) : ''
      })

      // 加载账单数据计算当前总花费
      that.loadExpenseOnly()
    }).catch(function (err) {
      console.error('[budget-setting] 加载失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  // 加载账单并计算总花费（复用 budgetUtils）
  loadExpenseOnly: function () {
    var that = this
    expenseService.getExpenses(this.data.tripId).then(function (data) {
      var bills = data.expenses || []
      var totalExpense = budgetUtils.calculateTotalExpense(bills)
      that.setData({
        currentExpense: totalExpense.toFixed(2),
        loading: false
      })
    }).catch(function (err) {
      console.error('[budget-setting] 账单加载失败:', err)
      that.setData({ loading: false })
    })
  },

  // 计算人均预算（WXML 不支持 .toFixed）
  calcPerPerson: function (budgetVal) {
    var num = Number(budgetVal) || 0
    var count = this.data.memberCount || 1
    return num > 0 ? (num / count).toFixed(2) : ''
  },

  onBudgetInput: function (e) {
    var val = amountUtils.formatAmountInput(e.detail.value)
    this.setData({
      totalBudget: val,
      perPersonBudget: this.calcPerPerson(val)
    })
  },

  // 清除预算：弹窗确认 → 调用云函数
  clearBudget: function () {
    var that = this
    wx.showModal({
      title: '确认清除预算？',
      content: '清除后，账单页将不再显示预算进度。',
      confirmText: '确认清除',
      confirmColor: '#E74C3C',
      success: function (res) {
        if (!res.confirm) return
        that.doClearBudget()
      }
    })
  },

  doClearBudget: function () {
    var that = this
    if (this.data.clearing) return
    this.setData({ clearing: true })
    wx.showLoading({ title: '清除中...' })

    tripService.updateTripBudget(this.data.tripId, 0).then(function () {
      wx.hideLoading()
      wx.showToast({ title: '预算已清除', icon: 'success' })
      that.setData({
        totalBudget: '',
        currentBudget: 0,
        hasBudget: false,
        perPersonBudget: '',
        perPersonCurrent: '',
        clearing: false
      })
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ clearing: false })
      wx.showToast({ title: err.message || '清除失败', icon: 'none' })
    })
  },

  onSubmit: function () {
    var that = this

    // 使用统一的金额校验
    var result = amountUtils.validateAmount(this.data.totalBudget)
    if (!result.valid) {
      wx.showToast({ title: result.message, icon: 'none' })
      return
    }

    if (!this.data.isCreator) {
      wx.showToast({ title: '只有旅行创建者可以修改预算', icon: 'none' })
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '保存中...' })

    tripService.updateTripBudget(this.data.tripId, result.value).then(function (res) {
      wx.hideLoading()
      wx.showToast({ title: '预算已保存', icon: 'success' })
      that.setData({
        submitting: false,
        currentBudget: res.totalBudget,
        hasBudget: res.totalBudget > 0
      })
      setTimeout(function () { wx.navigateBack() }, 1000)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  }
})
