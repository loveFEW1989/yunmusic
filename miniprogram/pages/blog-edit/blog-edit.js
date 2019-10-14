// miniprogram/pages/blog-edit/blog-edit.js
// 最大输入文字数
const MAX_WORDS_NUM = 140
// 最大上传图片数量
const MAX_IMG_NUM = 9

const db = wx.cloud.database()

// 输入的文字
let content = ''
let userInfo = {}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    wordsNum: 0,
    footerBottom: 0,
    images: [],
    selectPhoto: true
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  console.log(options)
  userInfo = options
  },
  // 输入文字的事件
  onInput(event) {
    console.log(event)
    let wordsNum = event.detail.value.length
    if(wordsNum >= MAX_WORDS_NUM) {
      wordsNum =`最大字数${MAX_WORDS_NUM}`
 
    }
    this.setData({
      wordsNum
    })
    content = event.detail.value

  },
  // 获取焦点的事件
  onFocus(event) {
    this.setData({
      footerBottom:event.detail.height
    })
  },
  // 失去焦点的事件
  onBlur() {
    this.setData({footerBottom:0})
  },
// 选择图片
onChooseImage() {
  // 第一次点击+号 还能再选几张照片
  let max = MAX_IMG_NUM - this.data.images.length

  wx.chooseImage({
    count:max,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res)=> {
     console.log(res)
     this.setData({
       images:this.data.images.concat(res.tempFilePaths)
     })
    //  现在还能再选几张
    max = MAX_IMG_NUM-this.data.images.length
    this.setData({
      selectPhoto: max<=0 ? false : true
    })
    }
  })
},
// 删除图片
onDelImage(event) {
  console.log(event)
  let index = event.currentTarget.dataset.index
  this.data.images.splice(index,1)
  this.setData({images:this.data.images})
   if(this.data.images.length<MAX_IMG_NUM) {
     this.setData({
       selectPhoto: true
     })
   }

},
// 预览图片
onPreviewImage(event) {
  wx.previewImage({
    current: event.target.dataset.imgsrc, // 当前显示图片的http链接
    urls: this.data.images // 需要预览的图片http链接列表
  })
},

// 发布博客
send() {
wx.showLoading({
  title:'发布中...',
  mask: true
})
let promiseArr = []
let fileIds = []
// 循环遍历每一张图片
for(let i=0;i<this.data.images.length;i++) {
 let p = new Promise((resolve,reject)=> {
   let item = this.data.images[i]
   let suffix = /\.\w+$/.exec(item)[0]
   wx.cloud.uploadFile({
     cloudPath:'blog/'+Date.now()+Math.random()*1000000+suffix,
     filePath: item,
     success: (res) => {
       console.log(res)
       fileIds = fileIds.concat(res.fileID)
       resolve()
     },
     fail: (err) => {
       console.error(err)
       reject()
     }
   })
 })
 promiseArr.push(p)
}
console.log(promiseArr)
// 存入云数据库
Promise.all(promiseArr).then((res) => {
  console.log(res)
  db.collection('blog').add({
   data: {
     ...userInfo,
     content,
     img:fileIds,
     createTime:db.serverDate()
   }
  }).then((res) => {
    console.log(res)
    wx.hideLoading()
    wx.showToast({
      title:'发布成功'
    })
    wx.navigateBack()
    const pages =  getCurrentPages()
    const prevPage = pages[pages.length-2]
    prevPage.onPullDownRefresh()
    
  }).catch(err=> {
    wx.hideLoading()
    wx.showToast({
      title:'发布失败'
    })
  })
})




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