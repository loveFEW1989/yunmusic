// components/progress-bar/progress-bar.js
let movableAreaWidth = 0
let movableViewWidth = 0
const backgroundAudioManager = wx.getBackgroundAudioManager()
let currentSec = -1 // 当前的秒数
let duration = 0 // 当前歌曲的总时长，以秒为单位
let isMoving = false // 表示当前进度条是否在拖拽，解决：当进度条拖动时候和updatetime事件有冲突的问题

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isSame: Boolean
  },

  /**
   * 组件的初始数据
   */
  data: {
  showTime: {
    currentTime: '00:00',
    totalTime: '00:00'
  },
  movableDis: 0,
  progress: 0
  },
  lifetimes: {
    ready() {
      if(this.properties.isSame && this.data.showTime.totalTime == '00:00') {
        this._setTime()
      }
      this._getMovableDis()
      this._bindBGMEvent()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
   onChange(event) {
     console.log(event)
      // 拖动
      if (event.detail.source == 'touch') {
        this.data.progress = event.detail.x / (movableAreaWidth - movableViewWidth) * 100
        this.data.movableDis = event.detail.x
        isMoving = true
        // console.log('change', isMoving)
      }
   },
  //  获取元素的宽度信息
  _getMovableDis() {
    const query = this.createSelectorQuery();
    query.select('.movable-area').boundingClientRect()
    query.select('.movable-view').boundingClientRect()
    query.exec((rect) => {
      movableAreaWidth = rect[0].width
      movableViewWidth = rect[1].width
    })
      
  },
  // 背景音乐控制器
  _bindBGMEvent() {
    backgroundAudioManager.onPlay(() => {
      console.log('onPlay')
      isMoving = false
      
    })

    backgroundAudioManager.onStop(() => {
      console.log('onStop')
    })

    backgroundAudioManager.onPause(() => {
      console.log('Pause')
     
    })

    backgroundAudioManager.onWaiting(() => {
      console.log('onWaiting')
    })
    backgroundAudioManager.onCanplay(()=> {
      console.log('canplay')
      console.log(backgroundAudioManager.duration)
      if(typeof backgroundAudioManager.duration != 'undefined') {
        this._setTime()
      } else {
        setTimeout(()=> {
          this._setTime()
        },1000)
      }
    })

    backgroundAudioManager.onTimeUpdate(()=> {
      console.log('timeupdate...')
    })

    backgroundAudioManager.onEnded(() => {
      console.log("onEnded")
      
    })

  },
  // 设置总的播放时间
  _setTime() {
    console.log('调用了_setTime()')
    duration = backgroundAudioManager.duration
    const durationFmt = this._timeFormat(duration)
    this.setData({
      ['showTime.totalTime']: `${durationFmt.min}:${durationFmt.sec}`
    })
  },
  // 格式化时间
  _timeFormat(time) {
  // time是以秒为单位的
  const min = Math.floor(time / 60)
  const sec = Math.floor(time%60)
  return {
    'min': this._parse0(min),
    'sec': this._parse0(sec)
  }  
  },
  // 补零
  _parse0(time) {
    return time< 10 ? '0'+time :time
  }

  }
})
