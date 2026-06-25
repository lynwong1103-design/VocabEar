// pages/dictation/dictation.js
const wordsUtil = require('../../utils/words.js')
const storage = require('../../utils/storage.js')
const tts = require('../../utils/tts.js')

Page({
  data: {
    // 设置
    group: 0,
    pauseSeconds: 10,

    // 状态
    status: 'ready', // ready | playing | paused | done
    words: [],
    currentIndex: 0,
    totalWords: 0,
    progressPercent: 0,

    // 倒计时
    countdown: 0,
    isPlaying: false,

    // 当前单词
    currentWord: null,

    // 组信息
    groupIndex: 0,
    groupTotal: 0,
    freqLabel: ''
  },

  countdownTimer: null,

  /** 获取频率标签 */
  getFreqLabel(group) {
    const total = wordsUtil.getTotalGroups()
    const ratio = group / total
    if (ratio < 0.1) return '🔥 超高频'
    if (ratio < 0.25) return '⚡ 高频'
    if (ratio < 0.5) return '📊 中频'
    if (ratio < 0.75) return '📚 中低频'
    return '🐢 低频'
  },

  onSetPause(e) {
    const pause = parseInt(e.currentTarget.dataset.pause)
    this.setData({ pauseSeconds: pause })
  },

    onLoad(options) {
    wx.showShareMenu({ withShareTicket: true, menus: ["shareAppMessage", "shareTimeline"] })
    let words, totalWords, groupIndex, groupTotal, freqLabel

    // 支持直接传入单词列表（字母听写）
    if (options.words) {
      try {
        words = JSON.parse(decodeURIComponent(options.words))
        totalWords = words.length
        groupIndex = '📖'
        groupTotal = ''
        freqLabel = ''
      } catch (e) {
        words = []
        totalWords = 0
      }
    } else {
      const group = parseInt(options.group) || 0
      const groupInfo = wordsUtil.getGroupInfo(group)
      words = groupInfo.words
      totalWords = groupInfo.count
      groupIndex = groupInfo.index + 1
      groupTotal = groupInfo.total
      freqLabel = ''
    }

    this.setData({
      words,
      totalWords,
      pauseSeconds: 10,
      currentWord: words[0] || null,
      status: 'ready',
      groupIndex: groupIndex || 0,
      groupTotal: groupTotal || '',
      freqLabel: freqLabel || '',
      isLast: (words.length || 0) <= 1
    })
  },

  onUnload() {
    this.clearTimers()
  },

  clearTimers() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer)
      this.pauseTimer = null
    }
  },

  // ==================== 开始 / 控制 ====================

  onStart() {
    this.setData({
      status: 'playing',
      currentIndex: 0,
      currentWord: this.data.words[0],
      progressPercent: 0
    })
    this.playCurrentAndWait()
  },

  onPause() {
    this.clearTimers()
    this.setData({
      status: 'paused',
      isPlaying: false,
      countdown: 0
    })
  },

  onResume() {
    this.setData({ status: 'playing' })
    this.startCountdown()
  },

  onReplay() {
    // 重播当前词
    this.playSound(this.data.currentWord.en)
    if (this.data.status === 'playing') {
      this.clearTimers()
      this.startCountdown()
    }
  },

  // ==================== 核心听写循环 ====================

  playCurrentAndWait() {
    const word = this.data.words[this.data.currentIndex]
    if (!word) {
      this.onFinish()
      return
    }

    this.setData({
      currentWord: word,
      isPlaying: true,
      countdown: this.data.pauseSeconds
    })

    // 播放发音
    this.playSound(word.en)

    // 开始倒计时
    this.startCountdown()
  },

  startCountdown() {
    this.clearTimers()

    let remaining = this.data.pauseSeconds
    this.setData({ countdown: remaining })

    // 每秒更新倒计时
    this.countdownTimer = setInterval(() => {
      remaining--
      this.setData({ countdown: remaining })

      if (remaining <= 3 && remaining > 0) {
        // 最后3秒振动提示
        wx.vibrateShort({ type: 'light' }).catch(() => {})
      }

      if (remaining <= 0) {
        this.clearTimers()
        this.nextWord()
      }
    }, 1000)
  },

  nextWord() {
    const nextIdx = this.data.currentIndex + 1
    this.setData({
      currentIndex: nextIdx,
      progressPercent: (nextIdx / this.data.totalWords) * 100
    })

    if (nextIdx >= this.data.words.length) {
      this.onFinish()
    } else {
      this.playCurrentAndWait()
    }
  },

  // ==================== TTS 播放 ====================

  playSound(word) {
    tts.play(word)
  },

  // ==================== 完成 ====================

  onFinish() {
    this.clearTimers()
    this.setData({
      status: 'done',
      isPlaying: false,
      countdown: 0
    })

    // 所有单词都记录为"听过"
    this.data.words.forEach(w => {
      storage.recordAttempt(w.en, true)
    })

    wx.redirectTo({
      url: `/pages/result/result?words=${encodeURIComponent(JSON.stringify(this.data.words))}`
    })
  },

  /** 分享给朋友 */
  onShareAppMessage() {
    return {
      title: 'VocabEar - 雅思词汇听写练习',
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
