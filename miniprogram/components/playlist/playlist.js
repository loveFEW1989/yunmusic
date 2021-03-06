// components/playlist/playlist.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
   playlist:Object
  },
   observers: {
     ['playlist.playCount'](val) {
       this.setData({
         _count:this._transNumber(val,2)
       })
     }
   },
  /**
   * 组件的初始数据
   */
  data: {
 _count: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    goToMusicList(e) {
      wx.navigateTo({
        url: `../../pages/musiclist/musiclist?playlistId=${this.properties.playlist.id}`
        
      })
    },
    // 播放数转换方法
    _transNumber(num,point) {
      let numStr = num.toString().split('.')[0]
      if(numStr.length<6) {
        return numStr
      }
      else if(numStr.length>=6 && numStr.length<=8) {
        // decimal小数点后面部分
        let decimal = numStr.substring(numStr.length-4,numStr.length-4+point)
        return parseFloat(parseInt(num/10000)+'.'+decimal)+'万'
      }
      else if(numStr.length > 8) {
        let decimal  = numStr.substring(numStr.length-8,numStr.length-8+point)
        return parseFloat(parseInt(num/100000000)+'.'+decimal)+'亿'
      }
      
    }
  }
})
