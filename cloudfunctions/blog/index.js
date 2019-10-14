// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router')
// 初始化云函数
cloud.init({
  env:'xiaopang-0639b4'
})
const db = cloud.database()
const blogCollection = db.collection('blog')



const MAX_LIMIT = 100
// 云函数入口函数
exports.main = async (event, context) => {
 const app = new TcbRouter({event})
//  博客列表
 app.router('list',async(ctx,next) => {
   const keyword = event.keyword
   let w = {}
   if(keyword.trim() != '') {
     w = {
       content: new db.RegExp({
         regexp:keyword,
         options: 'i'
       })
     }
   }
   const countResult = await blogCollection.count()
   const total = countResult.total
   let blogList = await blogCollection.where(w).skip(event.start).limit(event.count)
   .orderBy('createTime','desc').get().then((res)=> {
     return res.data
   })
   ctx.body = {
     blogList,
     total
   }
 })
//  博客详情
app.router('detail',async(ctx,next) => {
  let blogId = event.blogId
  // 详情查询
  let detail = await blogCollection.where({
    _id: blogId
  }).get().then((res)=> {
    return res.data
  })
  // 评论查询
  const countResult = await blogCollection.count()
  const total = countResult.total
  let commentList = {
    data: {}
  }
  if(total> 0) {
    const betchTimes = Math.ceil(total/MAX_LIMIT)
    const tasks = []
    for(let i=0;i<betchTimes;i++) {
      let promise = db.collection('blog-comment').skip(i*MAX_LIMIT)
      .limit(MAX_LIMIT).where({blogId})
      .orderBy('createTime','desc').get()
      tasks.push(promise)
    }
    if(tasks.length>0) {
      commentList = (await Promise.all(tasks)).reduce((acc,cur) => {
        return {data: acc.data.concat(cur.data)}
      })
    }

  }
  ctx.body ={
    commentList,
    detail
  }


})


 return app.serve()
}