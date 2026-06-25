/**
 * TTS 播放模块
 * 每次新建 InnerAudioContext（独立播放，互不干扰）
 */
function play(word) {
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=0`
  const ctx = wx.createInnerAudioContext()
  ctx.obeyMuteSwitch = false
  ctx.src = url
  ctx.play()
  // 5秒后自动清理
  setTimeout(() => { try { ctx.destroy() } catch(e) {} }, 5000)
}

module.exports = { play }
