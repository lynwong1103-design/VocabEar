/**
 * 本地存储工具 — 封装微信小程序存储 API
 * 管理：学习进度、错词列表、统计信息
 */

// ==================== 存储键名 ====================
const KEYS = {
  WORD_PROGRESS: 'ielts_word_progress',   // { [wordEn]: { attempts, correct, lastSeen } }
  WRONG_WORDS: 'ielts_wrong_words',       // [ { word: {en, zh}, timestamp } ]
  STATS: 'ielts_stats',                   // { todayLearned, masteredWords, streakDays, lastDate }
  SETTINGS: 'ielts_settings'              // { wordCount }
}

// ==================== 内部工具 ====================

function getData(key, defaultVal = null) {
  try {
    const val = wx.getStorageSync(key)
    return val || defaultVal
  } catch (e) {
    return defaultVal
  }
}

function setData(key, val) {
  try {
    wx.setStorageSync(key, val)
    return true
  } catch (e) {
    console.error('存储写入失败:', key, e)
    return false
  }
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ==================== 学习进度 ====================

/**
 * 记录一次答题结果
 * @param {string} wordEn - 英文单词
 * @param {boolean} isCorrect - 是否答对
 */
function recordAttempt(wordEn, isCorrect) {
  // 更新单词进度
  const progress = getData(KEYS.WORD_PROGRESS, {})
  if (!progress[wordEn]) {
    progress[wordEn] = { attempts: 0, correct: 0, lastSeen: null }
  }
  progress[wordEn].attempts++
  if (isCorrect) progress[wordEn].correct++
  progress[wordEn].lastSeen = today()
  setData(KEYS.WORD_PROGRESS, progress)

  // 更新每日统计
  updateDailyStats(wordEn, isCorrect)
}

/**
 * 获取某个单词的学习进度
 */
function getWordProgress(wordEn) {
  const progress = getData(KEYS.WORD_PROGRESS, {})
  return progress[wordEn] || null
}

/**
 * 获取所有单词的学习进度
 */
function getAllProgress() {
  return getData(KEYS.WORD_PROGRESS, {})
}

/**
 * 获取已掌握单词数（正确次数 >= 2 的单词）
 */
function getMasteredCount() {
  const progress = getData(KEYS.WORD_PROGRESS, {})
  let count = 0
  for (const en in progress) {
    if (progress[en].correct >= 2) count++
  }
  return count
}

// ==================== 错词管理 ====================

/**
 * 添加错词
 */
function addWrongWord(word) {
  const words = getData(KEYS.WRONG_WORDS, [])
  // 去重
  const exists = words.some(w => w.word.en === word.en)
  if (!exists) {
    words.push({ word: { en: word.en, zh: word.zh }, timestamp: Date.now() })
    setData(KEYS.WRONG_WORDS, words)
  }
}

/**
 * 从错词表移除（已掌握）
 */
function removeWrongWord(wordEn) {
  let words = getData(KEYS.WRONG_WORDS, [])
  words = words.filter(w => w.word.en !== wordEn)
  setData(KEYS.WRONG_WORDS, words)
}

/**
 * 获取所有错词
 */
function getWrongWords() {
  return getData(KEYS.WRONG_WORDS, [])
}

/**
 * 获取错词数量
 */
function getWrongCount() {
  return getData(KEYS.WRONG_WORDS, []).length
}

/**
 * 清空错词
 */
function clearWrongWords() {
  setData(KEYS.WRONG_WORDS, [])
}

// ==================== 每日统计 ====================

/**
 * 更新每日学习统计
 */
function updateDailyStats(wordEn, isCorrect) {
  const stats = getData(KEYS.STATS, {
    totalLearned: 0,
    totalCorrect: 0,
    streakDays: 0,
    lastDate: null,
    todayLearned: 0,
    todayCorrect: 0,
    dailyLog: {}
  })

  const t = today()

  // 如果换了新的一天，重置今日统计
  if (stats.lastDate !== t) {
    stats.todayLearned = 0
    stats.todayCorrect = 0
  }

  stats.todayLearned++
  if (isCorrect) stats.todayCorrect++
  stats.totalLearned++
  if (isCorrect) stats.totalCorrect++

  // 更新连续打卡
  if (stats.lastDate !== t) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    if (stats.lastDate === yStr) {
      stats.streakDays++
    } else if (stats.lastDate !== t) {
      stats.streakDays = 1
    }
  }

  // 每日日志
  if (!stats.dailyLog) stats.dailyLog = {}
  if (!stats.dailyLog[t]) {
    stats.dailyLog[t] = { learned: 0, correct: 0 }
  }
  stats.dailyLog[t].learned++
  if (isCorrect) stats.dailyLog[t].correct++

  stats.lastDate = t
  setData(KEYS.STATS, stats)
}

/**
 * 获取当前统计信息
 */
function getStats() {
  const stats = getData(KEYS.STATS, {
    totalLearned: 0,
    totalCorrect: 0,
    streakDays: 0,
    lastDate: null,
    todayLearned: 0,
    todayCorrect: 0,
    dailyLog: {}
  })

  const t = today()
  if (stats.lastDate !== t) {
    stats.todayLearned = 0
    stats.todayCorrect = 0
  }

  return {
    totalLearned: stats.totalLearned || 0,
    totalCorrect: stats.totalCorrect || 0,
    todayLearned: stats.todayLearned || 0,
    todayCorrect: stats.todayCorrect || 0,
    streakDays: stats.streakDays || 0,
    lastDate: stats.lastDate,
    masteredCount: getMasteredCount()
  }
}

/**
 * 获取今日统计专用
 */
function getTodayStats() {
  const s = getStats()
  return {
    todayLearned: s.todayLearned,
    todayCorrect: s.todayCorrect,
    streakDays: s.streakDays
  }
}

// ==================== 设置 ====================

/**
 * 获取用户设置
 */
function getSettings() {
  return getData(KEYS.SETTINGS, { wordCount: 20 })
}

/**
 * 保存用户设置
 */
function saveSettings(settings) {
  const current = getSettings()
  const merged = { ...current, ...settings }
  return setData(KEYS.SETTINGS, merged)
}

// ==================== 工具 ====================

/**
 * 重置所有数据
 */
function resetAll() {
  wx.removeStorageSync(KEYS.WORD_PROGRESS)
  wx.removeStorageSync(KEYS.WRONG_WORDS)
  wx.removeStorageSync(KEYS.STATS)
  wx.removeStorageSync(KEYS.SETTINGS)
}

/**
 * 获取当前组索引（从 0 开始）
 */
function getCurrentGroup() {
  const settings = getData(KEYS.SETTINGS, {})
  return settings.currentGroup || 0
}

/**
 * 推进到下一组
 */
function advanceGroup() {
  const current = getCurrentGroup()
  const wordsUtil = require('./words.js')
  const next = Math.min(current + 1, (wordsUtil.getTotalGroups ? wordsUtil.getTotalGroups() : 311) - 1)
  saveSettings({ currentGroup: next })
  return next
}

/**
 * 重置到第 1 组
 */
function resetGroup() {
  saveSettings({ currentGroup: 0 })
}

module.exports = {
  // 学习进度
  recordAttempt,
  getWordProgress,
  getAllProgress,
  getMasteredCount,

  // 错词管理
  addWrongWord,
  removeWrongWord,
  getWrongWords,
  getWrongCount,
  clearWrongWords,

  // 统计
  getStats,
  getTodayStats,

  // 设置
  getSettings,
  saveSettings,

  // 组管理
  getCurrentGroup,
  advanceGroup,
  resetGroup,

  // 工具
  resetAll
}
