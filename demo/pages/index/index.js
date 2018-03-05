//index.js
//获取应用实例
const app = getApp()
Page({
  data: { },
  onLoad: function () {
    var that = this;
    //获取用户资料,新用户会自动调用app.login进行登录注册
    app.getUserInfo(function(res){
      that.setData(res)
    })
    // wx.navigateTo({
    //   url: '../user/index?uid=123&parm1=value1&param2=value2',
    // })
    
    // app.navigateTo({
    //   url: '../user/index',
    //   data:{uid:123,parm1:value1,parm2:value2}
    // })
  },

  bindViewTap:function(){
    app.navigateTo({
      url: '../logs/logs',
      data:{uid:123}
    })
  }
})
