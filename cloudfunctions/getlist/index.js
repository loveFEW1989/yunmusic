// 云函数入口文件
const cloud = require('wx-server-sdk')
// 初始化云函数
cloud.init({
  env:'xiaopang-0639b4'
})
// 初始化数据库
const db = cloud.database()
// 引入request-promise
const rp = require('request-promise')
// 从服务器获取歌单地址
const URL = 'http://musicapi.xiecheng.live/personalized'

// 获取歌单的 云数据库 
const playlistCollection = db.collection('playlist')

// 每次从云数据库中获取的数据条数
const MAX_LIMIT = 100

// 云函数入口函数
exports.main = async (event, context) => {

// 云数据库中数据的总条数 ---返回的是对象
const countResult = await playlistCollection.count()
// 转为数字
const total = countResult.total

// 小程序端需要从云数据库中调用数据的总次数
const batchTimes = Math.ceil(total/MAX_LIMIT)

const tasks = []

for(let i=0;i<batchTimes;i++) {
  let promise = playlistCollection.skip(i*MAX_LIMIT).limit(MAX_LIMIT).get()
  tasks.push(promise)
}

// 突破数据限制
let list = {
  data: []
}
if(tasks.length>0) {
  list = (await Promise.all(tasks)).reduce((acc,cur)=> {
    return {
      data: acc.data.concat(cur.data)
    }
  })
}
// 从服务器中获取歌单数据
const playlist = await rp(URL).then(res=> {
  // 字符串转换为对象
  return JSON.parse(res).result
})
// 数组去重
const newData = []
for(let i =0; i<playlist.length;i++) {
  let flag = true
  for(let j=0;j<list.data.length;j++) {
    if(playlist[i].id === list.data[j].id) {
      flag = false
      break
    }
  }
  if(flag) {
    newData.push(playlist[i])
  }
}

// 把去重后的数据插入到云数据库中
for(let i=0;i<newData.length;i++) {
  await playlistCollection.add({
    data: {
      ...newData[i],
      createTime: db.serverDate()
    }
  }).then(res=> {
    console.log('数据插入成功')
  }).catch(err=> {
    console.log('数据插入失败')
  })
}
return newData.length

}