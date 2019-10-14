// components/blog-ctrl/blog-ctrl.js
let userInfo = {}
const db = wx.cloud.database()
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    blogId: String,
    blog: Object
  },
  externalClasses: ['iconfont','icon-pinglun','icon-fenxiang'],

  /**
   * 组件的初始数据
   */
  data: {
    loginShow: false,
    modalShow: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 发布评论
    onSend(event) {
      console.log(event)
      let formId = event.detail.formId
      let content = event.detail.value.content
      if(content.trim() == ' ') {
        wx.showModal({
          titme:'评论内容不能为空',
          content: ''
        })
        return 
      }
      wx.showLoading({
        title:'评论中',
        mask: true
      })
      db.collection('blog-comment').add({
        data: {
          content,
          createTime: db.serverDate(),
          blogId: this.properties.blogId,
          nickName:userInfo.nickName,
          avatarUrl:userInfo.avatarUrl

        }
      }).then((res)=> {
        console.log(res)
        wx.hideLoading()
        wx.showToast({title:'评论成功'})
        this.setData({
          modalShow: false,
          content:''
        })
        // 父元素刷新评论页面
        this.triggerEvent('refreshCommentList')
      }).catch(err=> {
        console.log(err)
        wx.hideLoading()
      })
    },
    comment() {
     wx.getSetting({
       success: (res)=> {
         console.log(res)
         if(res.authSetting['scope.userInfo']) {
           wx.getUserInfo({
             success: (res)=> {
               userInfo = res.userInfo
               this.setData({modalShow: true})
             }
           })
         } else {
            this.setData({loginShow: true})
         }
       }
     })
    },
    loginSuccess(event) {
      userInfo = event.detail
      this.setData({loginShow: false},()=> {
        this.setData({modalShow: true})
      })
    },
    loginFail() {
      wx.showToast({
        title:'授权后才能评论',
        content:''
      })
    }
  }
})
