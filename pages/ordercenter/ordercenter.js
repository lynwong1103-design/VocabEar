Page({
  data: {},
  onLoad() {
    wx.showShareMenu({ withShareTicket: true, menus: ["shareAppMessage", "shareTimeline"] })
  },
  onShareAppMessage() { return { title: "VocabEar" } },
  onShareTimeline() { return { title: "VocabEar" } }
})