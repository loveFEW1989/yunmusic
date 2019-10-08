// miniprogram/pages/playlist/playlist.js
const MAX_LIMIT = 15
Page({

  /**
   * 页面的初始数据
   */
  data: {
    swiperImgs: [
        {
        url: 'http://p1.music.126.net/oeH9rlBAj3UNkhOmfog8Hw==/109951164169407335.jpg',
      },
        {
          url: 'http://p1.music.126.net/xhWAaHI-SIYP8ZMzL9NOqg==/109951164167032995.jpg',
        },
        {
          url: 'http://p1.music.126.net/Yo-FjrJTQ9clkDkuUCTtUg==/109951164169441928.jpg',
        }
        ],
    playlist:[],
    loading: false    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  this.getList()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
   this.setData({playlist:[]})
   this.getList()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if(this.data.loading) {
      this.getList()
    }
   
  },
  getList() {
   console.log(this.data.loading)
    wx.showLoading()
    this.locked()
    this._getList()
    
    
  },
   // 调用云函数获取云数据库中的歌单
_getList() {
  wx.cloud.callFunction({
    name:'music',
    data: {
      start:this.data.playlist.length,
      count:MAX_LIMIT
    }
  }).then((res)=> {
    wx.hideLoading()
    wx.stopPullDownRefresh()
    console.log(res)
    if(this.hasmore(res.result.data)) {
      this.setMoreData(res.result.data)
    } else {
      this.unlocked()
      wx.showToast({
        title: '没有更多数据...'
      })
      
    }
    
  }).catch(err=> {
    console.log(err)
    this.unlocked()
    wx.stopPullDownRefresh()
    wx.hideLoading()
  })
},  
// 获取新的歌单数据
setMoreData(data) {
  const tempArray = this.data.playlist.concat(data)
  this.setData({playlist:  tempArray})
},

// 上锁
locked() {
  this.setData({loading: true})
},
// 解锁
unlocked() {
  this.setData({loading:false})
},
// 判断是否还有数据
hasmore(data) {
  return data.length>0 ?true : false 
},

    
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})