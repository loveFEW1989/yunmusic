// components/lyric/lyric.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
   isLyricShow: {
     type: Boolean,
     value: false
   },
   lyric: String
  },

  observers: {
    lyric(lrc) {
      if(lrc == '暂无歌词') {
        this.setData({
          lrcList: [{
            lrc,
            time:0
          }]
        })
      } else {
        this._parseLyric(lrc)
      }
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
   lrcList: [],
   nowLyricIndex: 0, //当前正在播放的歌词索引
   scrollTop: 0, //滚动条滚动的高度
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 解析歌词
   _parseLyric(sLyric) {
    //  换行显示
     let line = sLyric.split('\n')
     let _lrcList = []
     line.forEach((elem)=> {
      //  匹配出前面的时间 [00：00：00]
      
       let time = elem.match(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]/g)
       console.log(time)
       if(time!==null) {
        // 后面的歌词部分 
        let lrc = elem.split(time)[1]

        let timeReg = time[0].match(/(\d{2,}):(\d{2})(?:\.(\d{2,3}))?/)
        console.log(timeReg)
        // 把时间转换为秒
        let time2Seconds = parseInt(timeReg[1]*60)+ parseInt(timeReg[2])+parseInt(timeReg[3])/1000
       console.log(time2Seconds)
        _lrcList.push({
          lrc,
          time: time2Seconds
        })
       }
     })
     this.setData({
       lrcList: _lrcList
     })
   }
  }
})
