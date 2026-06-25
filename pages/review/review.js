// pages/review/review.js
const storage = require('../../utils/storage.js')
const tts = require('../../utils/tts.js')

Page({
  data: {
    wrongWords: [],
    currentIdx: 0,
    currentWord: null,
    flipped: false,
    wrongCount: 0
  },

  onShow() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    this.loadWrongWords()
  },

  loadWrongWords() {
    const words = storage.getWrongWords()
    this.setData({
      wrongWords: words,
      wrongCount: words.length,
      currentIdx: 0,
      currentWord: words.length > 0 ? words[0].word : null,
      flipped: false
    })
  },

  onFlip() {
    this.setData({ flipped: !this.data.flipped })
  },

  onMastered() {
    const word = this.data.currentWord
    if (word) {
      storage.removeWrongWord(word.en)
      storage.recordAttempt(word.en, true) // 记录正确
    }
    this.nextWord()
  },

  onStillWrong() {
    this.nextWord()
  },

  nextWord() {
    const nextIdx = this.data.currentIdx + 1
    const words = storage.getWrongWords()

    if (nextIdx < words.length) {
      this.setData({
        currentIdx: nextIdx,
        currentWord: words[nextIdx].word,
        flipped: false
      })
    } else {
      wx.showToast({ title: '复习完成！🎉', icon: 'none' })
      this.setData({
        wrongCount: 0,
        currentWord: null,
        wrongWords: []
      })
    }
  },

  onPlaySound() {
    if (!this.data.currentWord) return
    tts.play(this.data.currentWord.en)
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
