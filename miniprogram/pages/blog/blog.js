// miniprogram/pages/blog/blog.js
// 查询关键字
let total = 0
let keyword = ''
Page({

  /**
   * 页面的初始数据
   */
  data: {
   blogList:[],
   modalShow:false // 是否弹出底部弹窗
  },
  // 发布
  onPublish() {
   wx.getSetting({
     success: (res)=> {
       console.log(res)
       if(res.authSetting['scope.userInfo']) {
         wx.getUserInfo({
           success:(res)=>{
                this.loginSuccess({detail: res.userInfo})
           }
         })
       }else {
         console.log('****')
         this.setData({
           modalShow: true
         })

       }
     }
   })
  },
  loginSuccess(event) {
    console.log(event)
    const detail = event.detail
    wx.navigateTo({
      url: `../blog-edit/blog-edit?nickName=${detail.nickName}&avatarUrl=${detail.avatarUrl}`
    })
  },
  loginFail() {
   wx.showModal({
     title:'授权才能发布',
     content: ''
   })
  },

  // 调用云数据库中的博客列表
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this._getBlogList()
  },
  _getBlogList(start=0) {
    wx.showLoading({
      title:'加载博客...'
    })
  
    wx.cloud.callFunction({
      name:'blog',
      data: {
        keyword,
        $url:'list',
        start,
        count:10
      }
    }).then((res)=> {
      total = res.result.total
      
      console.log(res)
      wx.hideLoading()
      this.setData({
        blogList:this.data.blogList.concat(res.result.blogList)
      })
    }).catch(err=> {
     wx.hideLoading()
    })
  
  },

  // 跳转到博客详情评价页
  goComment (event) {
   console.log(event)
   const id = event.currentTarget.dataset.blogid
   wx.navigateTo({
     url:`../../pages/blog-comment/blog-comment?blogId=${id}`
   })
  },
  
  // 实现模糊查询
  onSearch(event) {
    this.setData({
      blogList : []
    })
    keyword = event.detail.keyword
    this._getBlogList(0)

  },
  // 删除搜索关键词
  onDelete() {
    console.log('xxxxx')
    keyword = ''
    this.data.blogList=[]
    this._getBlogList(0)
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
    
   
      this.setData({
        blogList:[]
      })
      this._getBlogList(0)
   
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log(this.data.blogList.length)
    console.log(total)
    if(this.data.blogList.length<total){
      this._getBlogList(this.data.blogList.length)
    }else {
      wx.showToast({title:'没有更多数据'})
      return 
    }
 },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (e) {
   console.log(e)
   let blogObj = event.target.dataset.blog
   return {
     title:blogObj.content,
     path:`/pages/blog-comment/blog-comment?blogId=${blogObj._id}`
   }
  }
})