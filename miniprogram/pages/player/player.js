// miniprogram/pages/player/player.js
let musiclist = []
// 当前正在播放的歌曲index
let nowPlayingIndex = 0
const app = getApp()

const backgroundAM = wx.getBackgroundAudioManager();
  
Page({

  /**
   * 页面的初始数据
   */
  data: {
   picUrl: '',
   isPlaying: false, //是否正在播放
   lyric: '',
   isLyricShow: false, //歌词是否显示
   isSame: false  //表示是否为同一首歌
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
  nowPlayingIndex = options.index
  musiclist = wx.getStorageSync('musiclist')
  this._loadMusicDetail(options.musicId)
  
  },
  _loadMusicDetail(musicId) {
    if(musicId == app.getPlayingMusicId()) {
      this.setData({
        isSame: true
      })
    } else {
      this.setData({
       isSame: false
      })
    }
    if(!this.data.isSame) {
      backgroundAM.stop()
    }
    let music = musiclist[nowPlayingIndex]
    wx.setNavigationBarTitle({
      title: music.name
    })
    this.setData({
      picUrl: music.al.picUrl,
      isPlaying:true 
    })
    app.setPlayingMusicId(musicId)
    wx.showLoading({title: '歌曲加载中...'})
    wx.cloud.callFunction({
      name: 'music',
      data: {
        musicId,
        $url: 'musicUrl'
      }
    }).then((res) => {
      wx.hideLoading()
      this.setData({isPlaying: true})
      console.log(JSON.parse(res.result))
      let result = JSON.parse(res.result)
      if(result.data[0].url== null) {
        wx.showToasT({
          title: '该歌曲无播放权限'
        })
        return
      }
      if(!this.data.isSame) {
        backgroundAM.src = result.data[0].url
        backgroundAM.title = music.name
        backgroundAM.coverImgUrl = music.al.picUrl
        backgroundAM.singer = music.ar[0].name
        backgroundAM.epname = music.ar.name
      }
      this.setData({
        isplaying:true
      })
     //  加载歌词
     wx.cloud.callFunction({
      name: 'music',
      data: {
        $url: 'lyric',
        musicId
      }
    }).then((res) => {
      console.log(JSON.parse(res.result).lrc)
      let lyric = '暂无歌词'
      const lrc = JSON.parse(res.result).lrc
      if(lrc) {
        lyric = lrc.lyric
      }
      this.setData({
        lyric
      })
    })


    }).catch(err=> {
      
    })
  },
  // 上一曲
  onPrev() {
    nowPlayingIndex--
    if(nowPlayingIndex<0) {
      nowPlayingIndex = musiclist.length-1
    }
    let music = musiclist[nowPlayingIndex]
    this._loadMusicDetail(music.id)
  },
  // 下一曲
  onNext() {
    nowPlayingIndex++
    if(nowPlayingIndex=== musiclist.length) {
      nowPlayingIndex =0
    }
    let music = musiclist[nowPlayingIndex]
    this._loadMusicDetail(music.id)
  },
  // 歌词显示的切换
  onChangeLyricShow() {
    this.setData({
      isLyricShow: !this.data.isLyricShow
    })
  },
  // 播放 暂停切换
  togglePlaying() {
   if(this.data.isPlaying) {
     backgroundAM.pause()
   } else {
     backgroundAM.play()
   }
   this.setData({isPlaying:!this.data.isPlaying})
  },
  // 把当前播放时间传递给 歌词组件
  timeUpdate(event) {
   this.selectComponent('.lyric').update(event.detail.currentTime)
  },
  onPlay() {
   this.setData({isPlaying: true})
  },
  onPause() {
   this.setData({isPlaying: false})
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})