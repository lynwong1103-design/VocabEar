/**
 * TTS 播放模块 — iOS 最终方案
 * 单例 + autoplay
 * 仅设 src，靠 autoplay 自动播放，不显式调用 play()
 */
let ctx = null

function getCtx() {
  if (!ctx) {
    ctx = wx.createInnerAudioContext()
    ctx.obeyMuteSwitch = false
    ctx.autoplay = true
  }
  return ctx
}

function play(word) {
  const c = getCtx()
  c.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=0`
  // 不显式调用 play()，靠 autoplay 自动播放
}

module.exports = { play }
