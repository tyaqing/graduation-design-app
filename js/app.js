"use strict";
/**
  对目前一些常用方法进行封装,依赖mui 需要在muijs加载后使用
  1.状态管理[ok]
  2.http[ok]
  3.窗口管理/鉴权[ok]
  4.支付[ok]
  5.分享[ok]
  6.上传[todo]
  7.自动判断登陆[ok]
  8.热更新与版本更新[todo]
  9.可读性调试打印[ok]
 **/

/**
 * $ 是 mui ;  owner 是app本身
 */
(function($, owner) {
  // 基本配置项 常量
  var appState = {
    base_url: "https://safe.femirror.com",
    version: 1.0,
    debug: true,
    upload_url: "http://jiabang.mogo.club/index/index/upload",
    hotUpdate: false,
    update_url: "" //热更新地址
  };

  // 系统状态栏高度
  owner.statusbarHeight = function() {
    var isImmersedStatusbar = plus.navigator.isImmersedStatusbar(); // 检测是否支持沉浸式 支持沉浸式状态栏则返回true
    var StatusbarHeight = "24px"; // 设置默认值
    if (isImmersedStatusbar) {
      StatusbarHeight = plus.navigator.getStatusbarHeight(); // 获取系统状态栏高度
    }
    return StatusbarHeight;
  };

  /**
   * 窗口管理
   * @param {*} obj 窗口对象
   * @param {*} checkLogin 判断登陆
   * @param {*} infinit 退出后不销毁
   */
  owner.openWebview = function(obj, checkLogin, infinit) {
    var checkLogin = checkLogin || false;
    var infinit = infinit || false;
    // 如果没有登陆就不打开而是提示登陆
    if (checkLogin) {
      var userInfo = app.getState("userInfo");
      if (!userInfo) {
        plus.nativeUI.toast("未登录,请登陆后操作");
        return;
      }
    }
    const wvs = plus.webview.all();
    console.log("打开新的Webview", JSON.stringify(obj));
    console.log(`当前已打开 ${wvs.length} 个webview`);
    if (typeof obj !== "object") return console.error("参数必须为一个对象");
    var config = {
      url: obj.url,
      id: obj.url,
      styles: {
        top: 0, //新页面顶部位置
        bottom: 0, //新页面底部位置
        titleNView: {
          // 窗口的标题栏控件
          titleText: obj.title, // 标题栏文字,当不设置此属性时，默认加载当前页面的标题，并自动更新页面的标题
          titleColor: "#000000", // 字体颜色,颜色值格式为"#RRGGBB",默认值为"#000000"
          titleSize: "17px", // 字体大小,默认17px
          backgroundColor: "#fff", // 控件背景颜色,颜色值格式为"#RRGGBB",默认值为"#F7F7F7"
          autoBackButton: true,
          //        progress: {
          //          // 标题栏控件的进度条样式
          //          color: "#5FC0AA", // 进度条颜色,默认值为"#00FF00"
          //          height: "2px" // 进度条高度,默认值为"2px"
          //        },
          splitLine: {
            // 标题栏控件的底部分割线，类似borderBottom
            color: "#CCCCCC", // 分割线颜色,默认值为"#CCCCCC"
            height: "1px" // 分割线高度,默认值为"2px"
          }
        }
      },
      extras: obj.extras,
      createNew: false, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
      show: {
        autoShow: true, //页面loaded事件发生后自动显示，默认为true
        aniShow: "slide-in-right" //页面显示动画，默认为”slide-in-right“；
        // duration: animationTime //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
      },
      waiting: {
        autoShow: true, //自动显示等待框，默认为true
        title: "正在加载...", //等待对话框上显示的提示内容
        options: {
          width: "150px", //等待框背景区域宽度，默认根据内容自动计算合适宽度
          height: "150px" //等待框背景区域高度，默认根据内容自动计算合适高度
        }
      }
    };
    if (obj.noTitle) {
      config.styles.titleNView = false;
    }
    // obj.noTitle && config.styles.titleNView = false;
    mui.openWindow(config);
    // !infinit&&currentWv.addeventListen('close'){
    //   currentWv
    // }
  };

  // 使用promise封装mui自带的ajax
  owner.http = function(param) { 
    return new Promise(function(resolve, reject) {
      param.type = param.type || "get";
      if (param.tip == false) param.tip = false;
      else param.tip = true;
      $.ajax(param.url, {
        data: param.data ? param.data : {},
//         dataType: "json",
//         headers: {
//           "Content-Type": "application/json"
//         },
        type: param.type,
        responseType:'json', 
        timeout: 10000,
        success: function(data) {
          // 请求成功
          resolve(data);
          console.log(param.url + "请求地址");
        },
        error: function(xhr, type, errorThrown) { 
        		// 首先用try catch 判断错误传回的格式
        		 try {	
             	var response = JSON.parse(xhr.response);
             	if(xhr.status==401){
             		owner.setState('userInfo',null);
             	} 
             		if(xhr.status==400){
             		plus.nativeUI.toast(response.error)
             	} 
             	
             	
             	reject(xhr)

            } catch (e) {
            		console.error('错误信息如下:️-------------')
            		app.log({
            			status:xhr.status,
					statusText:xhr.statusText,
					responseURL:xhr.responseURL,
					response:xhr.response,
            		})
        			plus.nativeUI.alert("服务器返回的不是json格式,请通过控制台输出排查原因",null,xhr.status +' '+ xhr.statusText)   
             	console.error('错误信息如上:----------------️')
            }
        }
      });
    });
  };
  /**
   * 调用支付
   * @param {alipay|wxpay} type 支付类型
   * @param {string|json} signature 签名  微信是一个json 支付宝是一段字符串
   */
  owner.pay = function(type, signature) {
    // 获取支付通道
    let channel;
    return new Promise(function(resolve, reject) {
      plus.payment.getChannels(
        function(s) {
          channel = s.find(item => {
            return item.id == type;
          });
          owner.log("支付方式", channel);
          // if (!channel) return plus.nativeUI.alert("没有该支付软件222");
          // 执行支付
          plus.payment.request(channel, signature, resolve, reject);
        },
        function(e) {
          plus.nativeUI.alert("获取支付通道失败：" + e.message);
        }
      );
    });
  };

  /**
   * 分享接口
   * @param {qq|weixin|tencentweibo|sinaweibo} type 分享类型
   * @param {*} ShareMessage 分享 message 详细文档 http://www.html5plus.org/doc/zh_cn/share.html#plus.share.ShareMessage
   */
  owner.share = function(type, ShareMessage) {
    if (typeof ShareMessage !== "object") throw "ShareMessage must be a object";
    return new Promise(function(resolve, reject) {
      plus.share.getServices(function(services) {
        let service;
        service = services.find(item => {
          return item.id == type;
        });
        if (!service) return plus.nativeUI.alert("没有安装该软件");
        service.send(ShareMessage, resolve, function(e) {
          throw JSON.stringify(e);
          plus.nativeUI.toast("没有分享成功");
          reject(e);
        });
      }, reject);
    });
  };

  /**
   * 获取本地是否安装客户端
   **/
  owner.isInstalled = function(id) {
    if (id === "qihoo" && mui.os.plus) {
      return true;
    }
    if (mui.os.android) {
      var main = plus.android.runtimeMainActivity();
      var packageManager = main.getPackageManager();
      var PackageManager = plus.android.importClass(packageManager);
      var packageName = {
        qq: "com.tencent.mobileqq",
        weixin: "com.tencent.mm",
        sinaweibo: "com.sina.weibo"
      };
      try {
        return packageManager.getPackageInfo(
          packageName[id],
          PackageManager.GET_ACTIVITIES
        );
      } catch (e) {}
    } else {
      switch (id) {
        case "qq":
          var TencentOAuth = plus.ios.import("TencentOAuth");
          return TencentOAuth.iphoneQQInstalled();
        case "weixin":
          var WXApi = plus.ios.import("WXApi");
          return WXApi.isWXAppInstalled();
        case "sinaweibo":
          var SinaAPI = plus.ios.import("WeiboSDK");
          return SinaAPI.isWeiboAppInstalled();
        default:
          break;
      }
    }
  };
  // 目前仅支持图片的压缩
  owner.uploader = function(path) {
    var upload_url = owner.getState("upload_url");
    plus.nativeUI.showWaiting();
    //TODO 图片压缩
    return new Promise(
      function(resolve, reject) {
        plus.zip.compressImage(
          {
            src: path,
            compress: 20
          },
          function(e) {
            var task = plus.uploader.createUpload(
              upload_url,
              {
                method: "POST",
                priority: 100,
                name: "file"
              },
              resolve
            );
            task.addFile(path, {
              key: "file",
              file: path
            });
            task.start();
          }
        );
      },
      function(err) {
        reject(arguments);
      }
    );
  };
  // 选择图片

  /**
   * 设置状态  使用 app.setState('user',null);清空状态
   * @param {string} k 键
   * @param {string|array|object} v 寸处对象
   */
  owner.setState = function(k, v) {
    let state = v;
    //判断参数
    if (typeof k !== "string") throw "key must be a string";
    // 如果是删除
    if (v === null) localStorage.removeItem(k);
    //判断类型
    if (typeof v !== "string") state = JSON.stringify(state);
    state = localStorage.setItem(k, state);
    return state;
  };
  /**
   * 获取状态
   * @param {string} k 状态名称
   */
  owner.getState = function(k) {
    if (typeof k !== "string") throw "key must be a string";
    var state = localStorage.getItem(k);
    if (state === null) return null;
    // 用try来判定存的是不是数组或对象
    try {
      return JSON.parse(state);
    } catch (e) {
      return state;
    }
  };

  /**
   * 自动判断登陆
   */
  owner.autoGetUserInfo = function() {
    return new Promise(function(resolve, reject) {
      //TODO 避免多次调用,设置调用间隔时间
      owner
        .http({
          url: "https://xsb.mogofun.net/index.php/api/isLogin",
          tip: false
        })
        .then(res => {
          // var userInfo = {
          //   avatar: res.avatar,
          //   nickname: res.nickname,
          //   integral: res.integral,
          //   merch: res.merch
          // };
          owner.setState("userInfo", res);
          resolve();
        })
        .catch(err => {
          owner.setState("userInfo", null);
        });
    });
  };
  owner.autoGetUserInfo(); //默认自动获取用户信息

  // 热更新与自动升级
  // TODO
  owner.update = function() {
    plus.runtime.getProperty(plus.runtime.appid, function(inf) {
      wgtVer = inf.version;
      console.log("当前应用版本：" + wgtVer);
    });
    owner
      .http({
        url: appState.update_url
      })
      .then(res => {})
      .catch(err => {});
  };
  /**
   * 可读性调试打印工具
   */
  owner.log = function() {
    if (!arguments) throw "must has a arguments";
    console.log(formatJson(arguments));
  };

  // config 初始化
  owner.stateInit = function(states) {
    // console.log(JSON.stringify(states) + "初始化");
    if (typeof states !== "object") throw "states must be a object";
    for (let k in states) {
      owner.setState(k, states[k]);
    }
  };
  owner.stateInit(appState);
})(mui, (window.app = {}));

/**
 * JSON格式化
 * @param {JSON} json
 * @param {*} options
 */
var formatJson = function(json, options) {
  var reg = null,
    formatted = "",
    pad = 0,
    PADDING = "    ";
  options = options || {};
  options.newlineAfterColonIfBeforeBraceOrBracket =
    options.newlineAfterColonIfBeforeBraceOrBracket === true ? true : false;
  options.spaceAfterColon = options.spaceAfterColon === false ? false : true;
  if (typeof json !== "string") {
    json = JSON.stringify(json);
  } else {
    json = JSON.parse(json);
    json = JSON.stringify(json);
  }
  reg = /([\{\}])/g;
  json = json.replace(reg, "\r\n$1\r\n");
  reg = /([\[\]])/g;
  json = json.replace(reg, "\r\n$1\r\n");
  reg = /(\,)/g;
  json = json.replace(reg, "$1\r\n");
  reg = /(\r\n\r\n)/g;
  json = json.replace(reg, "\r\n");
  reg = /\r\n\,/g;
  json = json.replace(reg, ",");
  if (!options.newlineAfterColonIfBeforeBraceOrBracket) {
    reg = /\:\r\n\{/g;
    json = json.replace(reg, ":{");
    reg = /\:\r\n\[/g;
    json = json.replace(reg, ":[");
  }
  if (options.spaceAfterColon) {
    reg = /\:/g;
    json = json.replace(reg, ":");
  }
  json.split("\r\n").forEach(function(node, index) {
    //console.log(node);
    var i = 0,
      indent = 0,
      padding = "";

    if (node.match(/\{$/) || node.match(/\[$/)) {
      indent = 1;
    } else if (node.match(/\}/) || node.match(/\]/)) {
      if (pad !== 0) {
        pad -= 1;
      }
    } else {
      indent = 0;
    }

    for (i = 0; i < pad; i++) {
      padding += PADDING;
    }

    formatted += padding + node + "\r\n";
    pad += indent;
  });
  return formatted;
};
