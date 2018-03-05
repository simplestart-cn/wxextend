/**
 * Weixin applet Function Extend
 * author: Colber.Dun
 * email: colber@yeah.net
 * weixin:Vicdun
 * version:1.0
 */

'use strict';
  
  var appConfig = {
    //服务器域名
    SERVER_HOST: 'https://wxprogram.sourcedesign.cn',
    //用户登录地址
    USER_LOGIN: 'https://wxprogram.sourcedesign.cn/Api/Applet/login',  
    //远程静态资源地址，如：'http://hostname.com/assets/'
    //默认为空时地址为:项目根目录/assets，模板中使用: {{ASSETS}}/imgdemo.png
    ASSETS: '', 
  }
  var wxPage = Page;
  var wxApp = App;

  var extend = (function self() {
    var options, name, src, copy, copyIsArray, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;
    // Handle a deep copy situation
    if (typeof target === "boolean") {
      deep = target;

      // Skip the boolean and the target
      target = arguments[i] || {};
      i++;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && typeof obj !== "function") {
      target = {};
    }

    // Extend jQuery itself if only one argument is passed
    if (i === length) {
      target = this;
      i--;
    }

    for (; i < length; i++) {

      // Only deal with non-null/undefined values
      if ((options = arguments[i]) != null) {

        // Extend the base object
        for (name in options) {
          src = target[name];
          copy = options[name];

          // Prevent never-ending loop
          if (target === copy) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if (deep && copy && (isPlainObject(copy) ||
            (copyIsArray = Array.isArray(copy)))) {

            if (copyIsArray) {
              copyIsArray = false;
              clone = src && Array.isArray(src) ? src : [];

            } else {
              clone = src && isPlainObject(src) ? src : {};
            }

            // Never move original objects, clone them
            target[name] = self(deep, clone, copy);

            // Don't bring in undefined values
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }
    // Return the modified object
    return target;
  });

  function isPlainObject(obj) {
    var proto, Ctor;

    // Detect obvious negatives
    // Use toString instead of jQuery.type to catch host objects
    if (!obj || toString.call(obj) !== "[object Object]") {
      return false;
    }

    proto = getProto(obj);

    // Objects with no prototype (e.g., `Object.create( null )`) are plain
    if (!proto) {
      return true;
    }

    // Objects with prototype are plain iff they were constructed by a global Object function
    Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
    return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
  }

  /**
   * 添加回调，拓展事件函数
   * eg:extendEvent(options, "onLoad", function (e) {
   * //onLoad后执行
   * });
   */
  function extendEvent(options, event, callback) {
    if (options && options[event]){
      var s = options[event];
      options[event] = function (options) {
        callback.call(this, options, event),
          s.call(this, options)
      }
    } else if(options){ 
      options[event] = function (options) {
        callback.call(this, options, event)
      }
    }
  }

  //app实例拓展
  function extendApp(options) {
    if(options){
      options.config = appConfig;
      options.queueRequest = []; //请求队列
      options.user_info = null;
      extendEvent(options, "onLaunch", function (e) {

      });
      

  /**
   * 拓展wx.request
   * 因wx.request的请求均会经过腾讯服务器的转发，而且每次都是带上随机cookie从而导致服务端无法用session
   * 因此服务端在用户登陆时需创建一个session_key并把它返回给小程序客户端
   * 客户端在每次请求再带上登陆时获取到的session_key
   */
      options.request = function (options) {
        var that = this;
        var session_key = '';
        if (typeof options.data != 'object') {
          options.data = {}
        }
        try {
          session_key = wx.getStorageSync('session_key');
        } catch (e) {
        }
        options.data = extend(options.data, {
          //可以添加一些每次请求都带上的默认数据
        });
        options.header = extend(options.header, {
          //這裡可以添加一些頭部數據
          'Cookie': 'PHPSESSID=' + session_key //添加session id使得后台可以用$_SESSION记录登录态
        });

        if (options.method == 'post' || options.method == 'POST') {
          options.header = extend(options.header, {
            'content-type': 'application/x-www-form-urlencoded',
          })
        }
        if (options.showLoading) {
          wx.showLoading({
            title: options.loadingTitle || '加载中...',
            mask: true,
          })
          options.isLoading = true;
        }

        console.log('请求地址：' + options.url);
        console.log('请求参数：');
        console.log(options);
        wx.request({
          url: options.url,
          data: options.data,
          header: options.header,
          method: options.method,
          dataType: options.dataType,
          success: function (res) {
            console.log(options.url + ' 返回的数据：');
            console.log(res);
            if (res && res.data && res.data.error_code && res.data.error_code == 2) {
              //登录过期处理
              console.log('未登录或登录态已过期');
              wx.removeStorageSync('session_key');
              //参数推入队列，并在登录后继续执行该函数
              that.queueRequest.push(options);
              return false;
            }
            if (typeof options.success == 'function') {
              options.success.call(this, res.data);
            }
          },
          fail: function (res) {
            if (typeof options.fail == 'function') {
              options.fail.call(this, res.data);
            }
          },
          complete: function (res) {
            if (options.showLoading) {
              that.hideLoading();
              that.isLoading = false;
            }
            if (typeof options.complete == 'function') {
              options.complete.call(this, res.data);
            }
          },
        });
      }

      options.getUserInfo = function (callback) {
        if (this.user_info != null && !this.user_info.have_change) {
          callback(this.user_info)
        } else {
          //调用登录接口
          this.login(callback, null);
        }
      }

      options.login = function (callback, options = null) {
        var that = this;
        wx.login({
          success: function (res) {
            if (res.code) {
              var code = res.code;
              wx.getUserInfo({
                success: function (info) {
                  info.from = 'weixin';
                  info.code = code;
                  wx.request({
                    url: that.config.USER_LOGIN,
                    data: info,
                    success: function (res) {
                      if (res.data.status) {
                        console.log('登录成功');
                        //登录/注册成功
                        try {
                          wx.setStorageSync('session_key', res.data.session_key);
                          that.user_info = res.data.user_info;
                          that.user_info.have_change = false;
                        } catch (e) {
                          console.log('fail to save session_key');
                        }
                        if (typeof callback == 'function') {
                          if (options != null) {
                            callback(options);
                          } else {
                            callback(res.data.user_info);
                          }
                        }
                        if (that.queueRequest.length > 0) {
                          for (var i = 0; i < that.queueRequest.length; i++) {
                            that.request(that.queueRequest[i]);
                          }
                          that.queueRequest = [];
                        }
                      } else {
                        wx.showModal({
                          title: '温馨提示',
                          content: res.data.message || '登录失败！',
                          showCancel: false,
                          confirmText: '确定',
                          success: function (res) {
                            wx.redirectTo({
                              url: '/pages/system/error/index',
                            })
                          }
                        })
                      }

                    },
                    fail: function (res) {
                      wx.showModal({
                        title: '温馨提示',
                        content: '网络异常，登录失败~',
                        showCancel: false,
                        confirmText: '确定',
                        success: function (res) {
                        }
                      })
                    },
                    complete: function (res) {
                    },
                  });
                },
                fail: function (res) {
                  if (wx.canIUse('openSetting')) {
                    wx.openSetting({
                      success: (res) => {
                        if (res.authSetting['scope.userInfo']) {
                          that.login(callback, options)
                        } else {
                          wx.switchTab({
                            url: '/pages/home/index',
                          })
                        }
                      }
                    });
                  } else {
                    //兼容性处理
                    wx.showModal({
                      title: '温馨提示',
                      content: '你已取消授权登录，请删除小程序从新进入',
                      showCancel: false,
                      confirmText: '确定',
                      success: function (res) {
                        wx.redirectTo({
                          url: '/pages/home/index',
                        })
                      }
                    })
                  }
                }
              })
            }
          },
          fail: function (res) {
            wx.showModal({
              title: '温馨提示',
              content: '网络异常，登录失败~',
              showCancel: false,
              confirmText: '确定',
              success: function (res) {
              }
            })
          }
        });
      }

      /**
       * 拓展wx.navigateTo
       * options.data：json结构参数
       * data属性为数组会把数组以','分隔组成字符串
       * data属性不可为对象或对象数组
       */
      options.navigateTo =function (options) {
        if (typeof options.data == 'object') {
          var param = '';
          for (var par in options.data) {
            param += par + '=' + options.data[par] + '&';
          }
          param = param.substr(0, param.length - 1);
          if (options.url.indexOf('?') > 0) {
            options.url += '&' + param;
          } else {
            options.url += '?' + param;
          }
        }
        wx.navigateTo({
          url: options.url,
          success: function (res) {
            if (typeof options.success == 'function') {
              options.success(res);
            }
          },
          fail: function (res) {
            if (typeof options.fail == 'function') {
              options.fail(res);
            }
          },
          complete: function (res) {
            if (typeof options.complete == 'function') {
              options.complete(res);
            }
          },
        })
      },

      /**
       * 拓展wx.redirectTo
       * options.data：json结构参数
       * data属性为数组会把数组以','分隔组成字符串
       * data属性不可为对象或对象数组
       */
      options.redirectTo = function (options) {
        if (typeof options.data == 'object') {
          var param = '';
          for (var par in options.data) {
            param += par + '=' + options.data[par] + '&';
          }
          param = param.substr(0, param.length - 1);
          if (options.url.indexOf('?') > 0) {
            options.url += '&' + param;
          } else {
            options.url += '?' + param;
          }
        }
        wx.redirectTo({
          url: options.url,
          success: function (res) {
            if (typeof options.success == 'function') {
              options.success(res);
            }
          },
          fail: function (res) {
            if (typeof options.fail == 'function') {
              options.fail(res);
            }
          },
          complete: function (res) {
            if (typeof options.complete == 'function') {
              options.complete(res);
            }
          },
        })
      },

      /**
       * 拓展wx.reLaunch
       * options.data：json结构参数
       * data属性为数组会把数组以','分隔组成字符串
       * data属性不可为对象或对象数组
       */
      options.reLaunch = function (options) {
        if (typeof options.data == 'object') {
          var param = '';
          for (var par in options.data) {
            param += par + '=' + options.data[par] + '&';
          }
          param = param.substr(0, param.length - 1);
          if (options.url.indexOf('?') > 0) {
            options.url += '&' + param;
          } else {
            options.url += '?' + param;
          }
        }
        wx.reLaunch({
          url: options.url,
          success: function (res) {
            if (typeof options.success == 'function') {
              options.success(res);
            }
          },
          fail: function (res) {
            if (typeof options.fail == 'function') {
              options.fail(res);
            }
          },
          complete: function (res) {
            if (typeof options.complete == 'function') {
              options.complete(res);
            }
          },
        })
      },
      
      /**
       * 补充完整的导航函数
       */
      options.switchTab = wx.switchTab;
      options.navigateBack = wx.navigateBack;

      //获取当前页面对象
      options.currentPage = function () {
        var pages = getCurrentPages();
        if (pages.length > 0) {
          return pages[pages.length - 1];
        }
      }

      //获取上一页面对象
      options.prevPage = function () {
        var pages = getCurrentPages();
        if (pages.length > 1) {
          return pages[pages.length - 2];
        }else{
          return pages[0];
        }
      }


    }
    wxApp(options);
  }

  function extendPage (options) {
    if(options){

      extendEvent(options, "onLoad", function (e) {
        //设置app全局参数及静态资源目录
        var app = getApp();
        var relativeAddress = '',
          routePoints = this.__route__.split('/');
        for (var i = 0; i < routePoints.length - 1; i++) {
          relativeAddress += "../";
        }
        if (appConfig.ASSETS == '') {
          app.config.ASSETS = relativeAddress + 'assets'
        }
        app.config.ROOT = relativeAddress;
        this.setData(app.config);
      })

      //这里可以给所有页面拓展新函数 

      /**
       * Extend  bindData function on the Page
       * 
       * eg1: Bind the data "user_name" on bindtab event,
       *      page auto setData 'Colber.Dun' to wxml 
       * <view bindtab="bindData" data-user_name = "Colber.Dun"></view>
       * eg2: Bind the data 'email' on input element bindinput event,
       *      page auto setData the input value to wxml
       * <input type="text"  bindinput="bindData" data-email = "this"/>
       */
      options.bindData=function(e){
        if (!e.type || (e.type != "touchstart" && e.type != "touchmove" && e.type != "touchcancel" && e.type != "touchend" && e.type != "tap" && e.type != "longtap" )){
          return false;
        }
        var that = this;
        if (e && e.currentTarget.dataset) {
          Object.keys(e.currentTarget.dataset).forEach(function (key) {
            if (e.currentTarget.dataset[key] == 'this'){
              e.currentTarget.dataset[key] = e.detail.value
            }
            that.setData(e.currentTarget.dataset);
          });
        }
        if (e && e.target.dataset) {
          Object.keys(e.target.dataset).forEach(function (key) {
            if (e.target.dataset[key] == 'this') {
              e.target.dataset[key] = e.detail.value
            }
            that.setData(e.target.dataset);
          });
        }
      }
    }
    wxPage(options)
  }

App = extendApp;
Page = extendPage;





