// pages/wordlist/wordlist.js
const wordsUtil = require('../../utils/words.js')
const storage = require('../../utils/storage.js')

const app = getApp()

Page({
  data: {
    keyword: '',
    activeLetter: 'all',
    letters: [],
    allWords: [],
    filteredWords: [],
    progress: {},
    displayWords: [],  // 当前显示的单词（分页）
    pageSize: 100,
    pageIndex: 0,
    hasMore: false
  },

  onLoad(options) {
    // 从全局变量读取字母（switchTab 不支持传参）
    const letter = app.globalData.pendingLetter || options.letter || 'all'
    app.globalData.pendingLetter = ''
    const groups = wordsUtil.getAlphabetGroupList()
    const words = letter === 'all' ? wordsUtil.getAllWords() : wordsUtil.getWordsByAlphabet(letter)
    this.setData({
      letters: groups,
      activeLetter: letter,
      allWords: words,
      filteredWords: words
    })
    this.resetPage()
  },

  onShow() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    // 检查是否有待处理的字母（从首页切换Tab过来）
    const pending = app.globalData.pendingLetter
    if (pending) {
      app.globalData.pendingLetter = ''
      this.setData({
        activeLetter: pending,
        keyword: '',
        filteredWords: pending === 'all' ? wordsUtil.getAllWords() : wordsUtil.getWordsByAlphabet(pending)
      })
    }

    // 加载学习进度
    const progress = storage.getAllProgress()
    this.setData({ progress })

    if (!this.data.activeLetter && !this.data.keyword) {
      this.setData({
        allWords: wordsUtil.getAllWords(),
        filteredWords: []
      })
    } else if (this.data.activeLetter === 'all' && !this.data.keyword) {
      this.setData({
        allWords: wordsUtil.getAllWords(),
        filteredWords: wordsUtil.getAllWords()
      })
    } else if (this.data.activeLetter && !this.data.keyword) {
      this.setData({
        filteredWords: wordsUtil.getWordsByAlphabet(this.data.activeLetter)
      })
    }
  },

  onSearch(e) {
    const keyword = e.detail.value
    this.setData({ keyword })
    if (keyword) {
      const results = wordsUtil.searchWords(keyword)
      this.setData({ filteredWords: results })
      this.resetPage()
    } else if (this.data.activeLetter && this.data.activeLetter !== 'all') {
      this.setData({ filteredWords: wordsUtil.getWordsByAlphabet(this.data.activeLetter) })
      this.resetPage()
    } else {
      this.setData({ filteredWords: [] })
      this.setData({ displayWords: [], hasMore: false })
    }
  },

  onSelectLetter(e) {
    const letter = e.currentTarget.dataset.letter
    const words = letter === 'all' ? wordsUtil.getAllWords() : wordsUtil.getWordsByAlphabet(letter)
    this.setData({
      activeLetter: letter,
      keyword: '',
      filteredWords: words
    })
    this.resetPage()
  },

  getWordStatus(wordEn) {
    const p = this.data.progress[wordEn]
    if (!p) return ''
    if (p.correct >= 2) return '✅'
    if (p.correct >= 1) return '📝'
    return ''
  },

  /** 重置分页 */
  resetPage() {
    const words = this.data.filteredWords
    const pageSize = this.data.pageSize
    this.setData({
      pageIndex: 0,
      displayWords: words.slice(0, pageSize),
      hasMore: words.length > pageSize
    })
  },

  /** 加载更多 */
  loadMore() {
    const { filteredWords, pageIndex, pageSize, displayWords } = this.data
    const nextIdx = pageIndex + 1
    const nextBatch = filteredWords.slice(0, (nextIdx + 1) * pageSize)
    this.setData({
      pageIndex: nextIdx,
      displayWords: nextBatch,
      hasMore: nextBatch.length < filteredWords.length
    })
  },

  onWordDetail(e) {
    const word = e.currentTarget.dataset.word
    const p = this.data.progress[word.en]
    let detail = word.zh
    if (p) {
      detail += `\n学习次数: ${p.attempts} | 正确: ${p.correct}`
    }
    wx.showModal({
      title: word.en,
      content: detail,
      showCancel: false
    })
  },

  onDictateLetter() {
    const letter = this.data.activeLetter
    if (!letter) return
    const words = wordsUtil.getWordsByAlphabet(letter)
    if (words.length === 0) {
      wx.showToast({ title: '该字母暂无单词', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/dictation/dictation?words=${encodeURIComponent(JSON.stringify(words))}`
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
