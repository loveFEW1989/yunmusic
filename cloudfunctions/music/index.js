// 云函数入口文件
const cloud = require('wx-server-sdk')


// 初始化云函数
cloud.init({
  env:'xiaopang-0639b4'
})
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  return await db.collection('playlist')
  .skip(event.start)
  .limit(event.count).orderBy('createTime','desc')
  .get()
  .then(res=> {
    return res
  })
}