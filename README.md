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