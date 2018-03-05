# wxextend
微信小程序拓展包，完善授权登录注册接口，升级小程序内导航接口，网络请求接口，让小程序开发更加简单快捷
一. 功能说明：
	对以下接口进行了拓展：
	wx.login
	wx.getUserInfo
	wx.request
	wx.navigateTo
	wx.redirectTo
	wx.switchTab
	wx.navigateBack
	接口使用：
	app.login
	app.getUserInfo
	app.request
	app.navigateTo
	app.redirectTo
	app.switchTab
	app.navigateBack
	----------------------------------
	1. app.login和app.getUserInfo自动登录注册，配合simplecms使用效果更佳喔
	2. app.request在每次请求带上session id,使用服务端可以通过session保存登录态
	3. app.navigateTo，app.redirectTo均可带上json格式参数而无需手动拼接地址
		如：
		wx.navigateTo({
		  url: '../user/index?uid=123&parm1=value1&param2=value2',
		})
		//华丽升级之后.....
		app.navigateTo({
		  url: '../user/index',
		  data:{uid:123,parm1:value1,parm2:value2}
		})

二. 引用。
	在app.js引入一次即可
	//app.js
	require("lib/wxExtend/wxExtend.js");
	App({
	  onLaunch: function () {
	    
	  },
	  globalData: {
	    userInfo: null
	  }
	})

三. 设置
  var appConfig = {
    //服务器域名
    SERVER_HOST: 'http://domain.com',
    //用户登录地址
    USER_LOGIN: 'http://domain.com/Api/Applet/login',  
    //远程静态资源地址，如：'http://domain.com/assets/'
    //默认为空时地址为:项目根目录/assets，模板中使用: {{ASSETS}}/imgdemo.png
    ASSETS: '', 
  }

四. 获取用户资料
	//获取用户资料,新用户会自动调用app.login进行登录注册
    app.getUserInfo(function(res){
      that.setData(res)
    })
	
