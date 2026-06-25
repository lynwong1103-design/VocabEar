const storage = require('../../utils/storage.js')
const tts = require('../../utils/tts.js')
const wordsUtil = require('../../utils/words.js')

Page({
  data: {
    words: [],
    totalWords: 0,
    groupIndex: 0,
    groupTotal: 0,
    hasNextGroup: false
  },

  onLoad(options) {
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] })
    let words = []
    try {
      words = JSON.parse(decodeURIComponent(options.words || '[]'))
    } catch (e) {}

    const nextGroup = storage.advanceGroup()
    const totalGroups = wordsUtil.getTotalGroups()
    
    // 加载收藏状态
    const wrongWords = storage.getWrongWords()
    const bookmarkMap = {}
    wrongWords.forEach(w => { bookmarkMap[w.word.en] = true })

    this.setData({
      words,
      totalWords: words.length,
      groupIndex: nextGroup + 1,
      groupTotal: totalGroups,
      hasNextGroup: nextGroup + 1 < totalGroups,
      bookmarkMap
    })
  },

  getBookmarkStatus(en) {
    return this.data.bookmarkMap && this.data.bookmarkMap[en]
  },

  onToggleBookmark(e) {
    const en = e.currentTarget.dataset.en
    const zh = e.currentTarget.dataset.zh
    const map = { ...this.data.bookmarkMap }
    
    if (map[en]) {
      // 取消收藏
      storage.removeWrongWord(en)
      delete map[en]
    } else {
      // 收藏到复习
      storage.addWrongWord({ en, zh })
      map[en] = true
    }
    this.setData({ bookmarkMap: map })
  },

  onPlayWord(e) {
    const word = e.currentTarget.dataset.word
    this.playSound(word.en)
  },

  onReplayAll() {
    const words = this.data.words
    let i = 0
    wx.showLoading({ title: '播放中...' })
    const playNext = () => {
      if (i >= words.length) { wx.hideLoading(); return }
      this.playSound(words[i].en)
      i++
      setTimeout(playNext, 2000)
    }
    playNext()
  },

  onNextGroup() {
    wx.redirectTo({
      url: `/pages/dictation/dictation?group=${storage.getSettings().currentGroup}`
    })
  },

  playSound(word) {
    tts.play(word)
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/home/home' })
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
