// components/search/search.js
let keyword = ''
Component({
  /**
   * 组件的属性列表
   */
  properties: {
   placeholder: {
     type:String,
     value: '请输入关键字'
   }
  },
  externalClasses:['iconfont','icon-sousuo','icon-shanchu'],


  /**
   * 组件的初始数据
   */
  data: {
    value: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onInput(event) {
        keyword =  event.detail.value 
        this.setData({value:event.detail.value })
    },
    onSearch() {
       this.triggerEvent('search',{keyword})
    },
    onDelete() {
      if(this.data.value.length<=0){return}
      console.log(this.data.value)
      this.setData({value:''})
      this.triggerEvent('delete')
      console.log(this.data.value)
    }
  }
})
