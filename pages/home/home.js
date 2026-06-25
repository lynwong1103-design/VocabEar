// pages/home/home.js
const wordsUtil = require('../../utils/words.js')
const storage = require('../../utils/storage.js')

const app = getApp()

Page({
  data: {
    totalWords: 0,
    totalGroups: 0,
    currentGroup: 0,
    groupInfo: {},
    groupProgressPercent: 0,
    freqLabel: '🔥 超高频',
    todayLearned: 0,
    streakDays: 0,
    alphabetGroups: []
  },

  onLoad() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    const groups = wordsUtil.getAlphabetGroupList()
    const totalGroups = wordsUtil.getTotalGroups()
    // 生成 Picker 范围数组
    const groupPickerRange = []
    for (let i = 0; i < totalGroups; i++) {
      const info = wordsUtil.getGroupInfo(i)
      groupPickerRange.push(`第${i+1}组 (${info.count}词)`)
    }
    this.setData({
      totalWords: wordsUtil.getTotalCount(),
      totalGroups,
      alphabetGroups: groups,
      groupPickerRange
    })
    this.loadGroupInfo()
  },

  onShow() {
    this.loadGroupInfo()
    const stats = storage.getStats()
    this.setData({
      todayLearned: stats.todayLearned,
      streakDays: stats.streakDays
    })
  },

  loadGroupInfo() {
    const settings = storage.getSettings()
    const group = settings.currentGroup || 0
    const info = wordsUtil.getGroupInfo(group)

    // 计算本组进度
    const progress = storage.getAllProgress()
    let learnedInGroup = 0
    info.words.forEach(w => {
      if (progress[w.en]) learnedInGroup++
    })
    const percent = info.count > 0 ? Math.round((learnedInGroup / info.count) * 100) : 0

    this.setData({
      currentGroup: group,
      groupInfo: info,
      groupProgressPercent: percent,
      freqLabel: ''
    })
  },

  getFreqLabel() { return '' },

  onStartDictation() {
    wx.navigateTo({
      url: `/pages/dictation/dictation?group=${this.data.currentGroup}`
    })
  },

  onPickerChange(e) {
    const group = parseInt(e.detail.value)
    storage.saveSettings({ currentGroup: group })
    this.loadGroupInfo()
    wx.showToast({ title: `已切换到第 ${group+1} 组`, icon: 'none' })
  },

  onTodayLearned() {
    wx.navigateTo({ url: '/pages/today/today' })
  },

  onBrowseAll() {
    wx.switchTab({ url: '/pages/wordlist/wordlist' })
  },

  onShowStreak() {
    const stats = storage.getStats()
    wx.showModal({
      title: '📊 学习统计',
      content: `连续打卡: ${stats.streakDays} 天\n今日学习: ${stats.todayLearned} 词\n累计学习: ${stats.totalLearned} 词\n已掌握: ${stats.masteredCount} 词`,
      showCancel: false,
      confirmText: '继续加油 💪'
    })
  },

  onBrowseLetter(e) {
    const letter = e.currentTarget.dataset.letter
    app.globalData.pendingLetter = letter
    wx.switchTab({
      url: `/pages/wordlist/wordlist`
    })
  },

  /** 分享给朋友 */
  onShareAppMessage() {
    return {
      title: 'VocabEar - 雅思词汇听写练习',
      desc: '5252个雅思词汇，按组听写练习',
      path: '/pages/home/home'
    }
  },

  /** 分享到朋友圈 */
  onShareTimeline() {
    return {
      title: 'VocabEar - 雅思词汇听写练习'
    }
  }
})
