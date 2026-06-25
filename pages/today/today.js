const storage = require('../../utils/storage.js')
const tts = require('../../utils/tts.js')

Page({
  data: {
    words: []
  },

  onLoad() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    const progress = storage.getAllProgress()
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
    
    const todayWords = []
    for (const en in progress) {
      if (progress[en].lastSeen === todayStr) {
        todayWords.push({ en, count: progress[en].attempts })
      }
    }

    this.setData({ words: todayWords })
  },

  onPlay(e) {
    tts.play(e.currentTarget.dataset.word)
  },

  onPlayAll() {
    const words = this.data.words
    if (words.length === 0) return
    let i = 0
    wx.showLoading({ title: '播放中...' })
    const playNext = () => {
      if (i >= words.length) { wx.hideLoading(); return }
      tts.play(words[i].en)
      i++
      setTimeout(playNext, 2000)
    }
    playNext()
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
