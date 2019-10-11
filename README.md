# yunmusic
小程序云开发-听歌产品
# 难点：
## 首页

### 1,把长串数字转换为 **.**万 或 **.**亿的格式

```

toString()数字转字符串
substring([start,end)) 截取字符串 不包括end
parseInt() 字符串转数字
parseFloat()字符串转浮点数

observers：当我们监听某个值的时候，我们不能再对当前监听的值赋值，以免造成死循环
解决方法是在data里新建一个值  把监听的值赋值给这个值

歌单组件 playlist的 playlist.js文件
properties: {
  playlist: {type: Object}
},
<!-- 数据监听器 -->
observers: {
  ['playlist.playCount'](val) {
    this.setData({_count:this._transNumber(val,2)})
  }
},
data: {_count:0},
methods: {
  <!-- num:传入的数字 point:保留小数点后几位 decimal截取的小数点后的内容 -->
  _transNumber(num,point) {
   let numStr = num.toString().split('.')[0]
   if(numStr.length<6) {return numStr}

   else if(numStr.length>=6 && numStr.length<=8) {
   let decimal = numStr.substring(numStr.length-4,numStr.length-4+point)
   return parseFloat(parseInt(numStr/10000)+'.'+decimal)+'万'
   } 
   else if(numStr.length>8) {
    let decimal = numStr.substring(numStr.length-8,numStr.length-8+point)
    return parseFloat(parseInt(numStr/100000000)+'.'+decimal)+'亿'
   }
  }
}

```
### 2，从云数据库获取歌单数据 并解决歌单数据去重 突破歌单数据限制
```
云函数getlist  >>>> index.js:
const cloud = require('wx-server-sdk')
<!-- 初始化云函数 -->
cloud.init()
<!-- 初始化数据库 -->
const db = cloud.database()
<!-- 引入request-promise -->
const rp = require('request-promise')
<!-- 从服务器获取歌单列表 -->
const URL = 'http://musicapi/xiecheng.live/personalized'

<!-- 获取’歌单‘的云数据库 ,需要提前在数据库中新建’gedan‘的集合  -->
const playlistCollection = db.collection('gedan')
<!-- 每次从服务器中获取的数据条数 -->
const MAX_LIMIT = 100

<!-- 云函数入口文件 -->
exports.main  async(event,context) => {
  <!-- 获取数据库'gedan'的总条数    返回的是对象-->
 const countResult = await playlistCollection.count()
 <!-- 抓换为数字格式 -->
 const total = countResult.total
 <!-- 总共需要调用云数据库的次数 -->
 const batchTimes = Math.ceil(total/MAX_LIMIT)

 const tasks = []
 for(let i = 0;i<batchTimes;i++) {
   let promise = playlistCollection.skip(i*MAX_LIMIT).limit(MAX_LIMIT).get()
   tasks.push(promise)
 }

 let list = {data: []}
 if(tasks.length>0) {
   <!-- 把多次调用的数组合并成一个新数组 -->
   list = (await Promise.all(tasks)).reduce((acc,cur)=> {
     return {
       data:acc.data.concat(cur.data)
     }
   })
 } 
 <!-- 从服务器中获取歌单列表 -->
 const playlist = await rp(URL).then(res=> {
   return JSON.parse(res).result
 })
 <!-- 数据去重，每次从服务器中去数据时 检查id与与数据库中的数据的id是否相同， -->
 <!-- 只有不同的时候才插入到云数据库中去 -->

 <!-- 去重 -->
const newData = []
for(let i=0;i<playlist.length;i++) {
  let flag = true
  for(let j=0;j<list.data.length;j++) {
    if(playlist[i].id===list.data[j].id) {
      flag = false
      break
    }
  }
  if(flag) {
    newData.push(playlist[i])
  }
}

<!-- 把去重后的数据插入到云数据库中 -->
for(let i =0;i<newData.length;i++) {
  await playlistCollection.add({
    data: {
      ...newData[i],
      createTime: db.serverDate()
    }
  }).then(res=>{console.log('插入成功)}).catch(err=> {
    console.log('插入失败')
  })
}

return newData.length


}



```
### 小程序端 通过云函数music 获取歌单数据

云函数music ---- index.js
```
const cloud = require('wx-server-sdk')
cloud.init({
  env:'你的环境id'
})

const db = cloud.database()
exports.main = async(event,context) => {
  return await db.collection('playlist')
  .skip(event.start)
  .limit(event.count)
  .orderBy('createTime','desc')
  .get()
  .then((res) => {
    return res
  })
}


```

page页面---playlist.js

wx.stopPullDownRefresh() 停止下拉刷新的动作
在playlist.json中设置  允许下拉刷新：
"enablePullDownRefresh": true

```
const MAX_LIMIT = 15
data: {
   playlist:[], // 歌单
   loading: false   // 加锁 解锁
},

onLoad :function(options) {
  this.getList()
},
getList() {
  wx.showLoading()
  this.locked()
  this._getList()
},
_getList() {
  wx.cloud.callFunction({
    name: 'music',
    data: {
      start: this.properties.playlist.length,
      count:MAX_LIMIT,
    },
    $url:'playlist'

  }).then((res) => {
    wx.hideLoading()
    wx.stopPullDownRefresh()
    if(this.hasMore(res.result.data)) {
      this.setMoreData(res.result.data)
    } else {
      this.unlocked()
      wx.showLoading({
        title: '没有更多数据了...'
      })

    }
  }).catch(err=> {
    this.unlocked()
    wx.hideLoading()
    wx.stopPullDownRefresh()
  })
},
setMoreData(data) {
   const tempArray = this.data.playlist.concat(data)
   this.setData({playlist: tempArray})
}
<!-- 是否还有更多的数据 -->
hasMore(data) {
  return data.length >  0
}
<!-- 加锁 -->
locked() {
  this.setData({loading: true})
}
<!-- 解锁 -->
unlocked() {
  this.setData({loading: false})
},

<!-- 上拉触底事件 -->
onReachBottom: function() {
  if(this.data.loading) {
    this.getList()
  }
}
<!-- 下拉刷新 -->
onPullDownRefresh: function() {
  this.setData({playlist: []})
  this.getList()
}


```



### 云函数music路由改造

```
npm i --save tcb-router
npm i --save request request-promise
云函数music ----  index.js

const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router')
const rp = require('request-promise')
const BASE_URL = 'http://musicapi.xiecheng.live'
const db = cloud.database()
cloud.init({env: '你的环境id'})

<!-- 云函数入口函数 -->

exports.main = async(cevent,context) => {
  const app = new TcbRouter({event})
  
  <!-- 获取歌单列表 -->
  app.router('playlist', async(ctx,next) => {
    ctx.body = await db.collection('playlist')
    .skip(event.start)
    .limit(event.count)
    .orderBy('createTime', 'desc')
    .get()
    .then((res) => {
      return res
    })
  })
  <!-- 获取歌单详情 -->
  app.router('musiclist', async(ctx,next) => {
  ctx.body = await rp(BASE_URL+'/playlist/detail?id='+parseInt(event.playlistId))
  .then((res)=> {
    return JSON.parse(res)
  })
   
  })


  return app.serve()
}





```

## 播放页面  
<!-- page ----   player -->

### 控制面板 实现 （播放歌曲 暂停 上一首 下一首）
html文件：
```
<view class="control">
    <text class="iconfont icon-shangyishoushangyige" bind:tap="onPrev"></text>
    <text class="iconfont {{isPlaying?'icon-zanting1':'icon-bofang1'}}" bind:tap="togglePlaying"></text>
    <text class="iconfont icon-xiayigexiayishou" bind:tap="onNext"></text>
</view>

```
相关js文件：

```
<!-- 歌单内的歌曲信息列表 -->
let musiclist = []
// 正在播放歌曲的index
let nowPlayingIndex = 0
// 获取全局唯一的背景音频管理器
const backgroundAudioManager = wx.getBackgroundAudioManager()

data: {
  picUrl: '',
  isPlaying: false , // 是否正在播放
  
},
onLoad: function(options) {
  nowPlayingIndex = options.index
  musiclist = music.wx.getStorageSync('musiclist')
  this._loadMusicDetail(options.index)
},
_loadMusicDetail(musicId) {
  let music = musiclist[nowPlayingIndex]
  wx.setNavgationBarTitle({
    title: music.name
  })
  this.setData({
    picUrl: music.al.picUrl,
    isPlaying: false
  })
  wx.showLoading({
    title: '歌曲加载中...'
  })
  wx.cloud.callFunction({
    name: 'music',
    data: {
      $url:'musicUrl',
      musicId
    }
  }).then((res)=> {
    let result = JSON.parse(res.result)
    if(result.data[0].url == null) {
      wx.showLoading({title:'该歌曲无播放权限'})
      return 
    }
     backgroundAudioManager.src = result.data[0].url
     backgroundAudioManager.title = music.name
     backgroundAudioManager.coverImgUrl = music.al.picUrl
     backgroundAudioManager.singer = music.ar[0].name
     backgroundAudioManager.epname = music.al.name
     this.setData({isPlaying: true})
     wx.hideLoading()
  })
},
<!-- 切换 播放/暂停 -->
togglePlaying() {
  if(this.data.Playing) {
    backgroundAudioManager.pause()
  } else {
    backgroundAudioManager.play()
  }
  this.setData({
    isPlaying: !this.data.isPlaying
  })
},

<!-- 上一首 -->
onPrev() {
 nowPlayingIndex--
 if(nowPlayingIndex< 0 ) {
   nowPlayingIndex =musiclist.length-1
 }
 this._loadMusicDetail(musiclist[nowPlayingIndex].id)
},
<!-- 下一首 -->
onNext() {
 nowPlayingIndex++
 if(nowPlayingIndex== musiclist.length) {
   nowPlayingIndex = 0
 }
 this._loadMusicDetail(musiclist[nowPlayingIndex].id)
}



```


### 进度条
html:
```
 <movable-area class="movable-area">
      <movable-view direction="horizontal" class="movable-view"
        damping="1000" x="{{movableDis}}" bindchange="onChange"
        bindtouchend="onTouchEnd"
      />
 </movable-area>
<progress stroke-width="4" backgroundColor="#969696"
    activeColor="#fff" percent="{{progress}}"></progress>

```
相关Js文件：

let movableAreaWidth = 0 // 可拖动区域外部元素 也就是进度条的宽
let movableViewWidth = 0 // 可拖动区域内部元素 也就是圆球的宽度
const backgroundAM = wx.getBackgroundAudioManager()
let currentSec = -1 //当前播放到多少秒
let duration = 0 // 当前歌曲的总时长 单位是秒
let isMoving = false //表示当前进度条是否在拖拽 用来解决 拖动与 updatetime冲突

data : {
  showTime: {
    startTime: 00:00,
    total: 00:00
  },
  movableDis: 0, //圆球拖动的距离
  progress: 0 //进度条的进度  ?%
},
lifetimes: {
  ready() {
    this._getMovableDis() //取到进度条的宽 以及圆球的宽
    this._bindBGMEvent()  //监听音乐 播放 暂停 停止 可以播放 等状态
  }
},
methods: {
  圆球开始拖动
  onChange(event) {
   if(event.detail.soure == 'touch') {
     this.data.progress = event.detail.x/(movableAreaWidth-movableViewWidth)*100
     this.data.movableDis = event.detail.x
     isMoving = true
   }
  },
  松开手指（圆球结束拖动）
  onTouchEnd() {
   <!-- 把当前歌曲正在播放的时间转换为xx:xx格式 -->
   const startTimeFmt = this._timeFormat(Math.floor(backgroundAM.currentTime))
   this.setData({
     progress: this.data.progress,
     movableDis: this.data.movableDis,
     ['showTime.startTime']: startTimeFmt.min+':'+startTimeFmt.sec,
     <!-- 跳转当前播放进度 -->
     backgroundAM.seek(duration*this.data.progress/100)
     isMoving = false
     
   })
  },
  _getMovableDis() {
    const query = this.createSelectorQuery()
    query.select('.movable-area').boundingClientRect()
    query.select('.movable-view').boundingClientRect()
    query.exec((rect)=> {
      movableAreaWidth = rect[0].width
      movableViewWidth = rect[1].width
    })
  },
  _bindBGMEvent() {
    backgroundAM.onCanplay(() => {
      if(typeof backgroundAM.duration !='undefined') {
        this._setTime()
      } else {
         setTimeout(()=> {
           this._setTime()
         },1000)
      }
    })
    backgroundAM.onTimeUpdate(()=> {
    if(!isMoving) {
      const currentTime = backgroundAM.currentTime
      const currentTimeFmt = this._timeFormat(currentTime)
      const duration = backgroundAM.duration
      const sec = currentTime.toString().split('.')[0]
      if(sec !==currentSec) {
       movableDis: (movableAreaWidth - movableViewWidth) * curentTime/duration,
       progress: currentTime/duration *100,
       ['showTime.startTime']: currentTimeFmt.min+':'+ currentTimeFmt.sec
      }
      currentSec = sec
      
    }
    })
    backgroundAM.onEnded(()=> {
    <!-- 自动播放下一首 -->
    this.triggerEvent('musicEnd')
    })
  },
  <!-- 设置歌曲总时间  格式为 00:00 -->
  _setTime() {
    <!-- 当前歌曲总时长 以秒为单位 -->
    duration = backgroundAM.duraiton
    const durationFmt = this._timeFormat(duration)
    this.setData({
      ['showTime.totalTime']: `${durationFmt.min}:${durationFmt.sec}`
    })
  },
  <!-- 格式化时间  最后的格式 00:00 -->
  _timeFormat(time) {
    const min = Math.floor(time/60)
    const sec = Math.floor(time% 60)
    return {
      'min': this._parse0(min),
      'sec': this._parse0(sec)
    }
  },
  <!-- 补零  8 --》 08   -->
  _parse0(time) {
    return time<10 ? '0'+time : time
  }
}

```




```

### 歌词显示

歌词组件lyric   >>>  lyric.js文件：

```
properties: {
  isLyricShow: {
    type: Boolean,
    value: false
  },
  lyric: String // 接收父组件传来的歌词文件
},
<!-- 监听器 -->
observers: {
  lyric(lrc) {
    <!-- 解析歌词 -->
    this._parseLyric(lrc)
  }
},
data: {
  lrcList: [], //解析后的歌词组件
  nowLyricIndex: 0, //当前正在播放的歌词索引
  scrollTop: 0 //滚动区域滚动的高度
},
methods: {
  _parseLyric(sLyric) {
    <!-- 先让歌词文件换行显示 -->
   let line  = sLyric.split('\n')
   let _lrcList = []
   line.forEach((elem)=> {
     <!-- 前面的时间部分 -->
     let time = elem.match(/\[(\d{2})(?:\.(\d{2,3}))?]/g)
     if(time!==null) {
       <!-- 后面的歌词部分 -->
       let lrc = elem.split(time)[1]
       
       let timeReg = time[0].match(/(\d{2,}):(\d{2})(?:\.(\d{2,3}))?/)

<!-- timeReg的结果  类似这样的集合，["00:00.000", "00", "00", "000", index: 1, input: "[00:00.000]", groups: undefined] -->
       <!-- 把事件转换为秒 -->
       let time2Sec = parseInt(timeReg[1]*60)+parseInt(timeReg[2])+parseInt(timeReg[3])/1000
       _lrcList.push({
         lrc,
         time: time2Sec
       })
     }
   })
   this.setData({
     lrcList: _lrcList
   })
  }
}





```


### 歌词 与 播放进度的联动

父组件还可以通过 this.selectComponent 方法获取子组件实例对象，这样就可以直接访问组件的任意数据和方法。

歌曲播放会调用 backgroundAudioManager.onTimeUpdate（）， 在这个函数中 向外派发自定义事件‘timeUpdate’，携带参数为当前正在播放的时间currentTime,
父组件接收到‘timeUpdate’时，调用歌词子组件的 update方法   传入参数 currentTime
比较currentTime 与 当前歌词的时间 来高亮和向上滚动



当前正在播放的歌词高亮 歌词整体随着播放进度向上滚动

```
lyric.js : 
<!-- 一行歌词所占的高度 -->
let lyricHeight = 0
lifetimes: {
  ready() {
    wx.getSystemInfo({
      success(res) {
        <!-- 60rpx在不同机型下实际的px -->
        lyricHeight: res.screenWidth / 750 * 60
      }
    })
  }
},
methods: {
  update(currentTime) {
   let lrcList = this.data.lrcList
   if(lrcList.length==0) {
     return
   }
   <!-- 如果实际歌曲的时间比歌词文件中的时间长的话 -->
   if(currentTime>lrcList[lrcList.length-1].time) {
     if(this.data.nowLyricIndex!=-1) {
       this.setData({
         nowLyricIndex: -1,
         scrollTop: lrcList.length* lycicHeight
       })
     }
   }
   for(let i=0;i<lrcList.length;i++) {
     if(current<= lrcList[i].time) {
       this.setData({
         nowLyricIndex:i-1,
         scrollTop: (i-1)*lyricHeight
       })
       break
     }
   }
  }
}


```









