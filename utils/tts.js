/**
 * TTS 播放模块
 * 单例模式 - 在用户点击时创建（iOS 要求）
 * 后续只换 src 不重建（定时器回调也可播）
 */
let ctx = null

function ensureCtx() {
  if (!ctx) {
    ctx = wx.createInnerAudioContext()
    ctx.obeyMuteSwitch = false
  }
  return ctx
}

function play(word) {
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=0`
  const c = ensureCtx()
  c.src = url
  c.play()
}

module.exports = { play }
