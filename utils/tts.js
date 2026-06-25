/**
 * TTS 播放模块
 * autoplay 驱动 + onEnded 回调（iOS 链式播放用）
 */
let ctx = null

function getCtx() {
  if (!ctx) {
    ctx = wx.createInnerAudioContext()
    ctx.autoplay = true
    ctx.obeyMuteSwitch = false
  }
  return ctx
}

function play(word) {
  const c = getCtx()
  c.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=0`
}

function setOnEnded(cb) {
  getCtx().onEnded(cb)
}

module.exports = { play, setOnEnded }
