/**
 * 演示程序当前的 “注册/登录” 等操作，是基于 “本地存储” 完成的
 * 当您要参考这个演示程序进行相关 app 的开发时，
 * 请注意将相关方法调整成 “基于服务端Service” 的实现。
 **/
(function($, owner) {
  // 基本配置项
  // owner.setSettings
  var appConfig = {
    base_url: "https://safe.femirror.com",
    version: 1.0
  };

  // 封装mui自带的ajax 使用promise
  $.http = function(param) {
    return new Promise(function(resolve, reject) {
      param.type = param.type || "get";
      $.ajax(param.url, {
        data: param.data ? param.data : {},
        dataType: "json",
        headers: {
          "Content-Type": "application/json"
        },
        type: param.type,
        timeout: 10000,
        success: function(data) {
          // 请求成功
          resolve(data);
        },
        error: function(xhr, type, errorThrown) {
          // 处理返回 由于某种原因返回的可能是text所以需要判断
          var response;
          if (typeof xhr.response === "string") {
            response = JSON.parse(xhr.response);
          } else {
            response = xhr.response;
          }
          if (param.debug) {
            console.log(
              xhr.status,
              this.type,
              this.url,
              JSON.stringify(response)
            );
          }
          response.error && $.toast(response.error);
          reject(response);
        }
      });
    });
  };
  /**
   * 用户登录
   **/
  owner.login = function(loginInfo, callback) {
    callback = callback || $.noop;
    loginInfo = loginInfo || {};
    loginInfo.account = loginInfo.account || "";
    loginInfo.password = loginInfo.password || "";
    if (loginInfo.account.length < 5) {
      return callback("账号最短为 5 个字符");
    }

    $.http({
      url: "https://safe.femirror.com/login",
      type: "post",
      debug: true,
      data: {
        tel: loginInfo.account,
        code: loginInfo.password
      }
    }).then(data => {
      return owner.createState(data.user, callback);
    });
  };
  // 创建state
  owner.createState = function(name, callback) {
    var state = owner.getState();
    state.account = name;
    state.token = "token123456789";
    owner.setState(state);
    return callback();
  };

  owner.sendMsm = function(tel) {
    console.log(owner.config("base_url"));
    $.http({
      url: "https://safe.femirror.com/send_msm",
      type: "post",
      debug: true,
      data: {
        tel: tel
      }
    }).then(res => {});
  };

  /**
   * 新用户注册
   **/
  owner.reg = function(regInfo, callback) {
    callback = callback || $.noop;
    regInfo = regInfo || {};
    regInfo.account = regInfo.account || "";
    regInfo.password = regInfo.password || "";
    if (regInfo.account.length < 5) {
      return callback("用户名最短需要 5 个字符");
    }
    if (regInfo.password.length < 6) {
      return callback("密码最短需要 6 个字符");
    }
    if (!checkEmail(regInfo.email)) {
      return callback("邮箱地址不合法");
    }
    var users = JSON.parse(localStorage.getItem("$users") || "[]");
    users.push(regInfo);
    localStorage.setItem("$users", JSON.stringify(users));
    return callback();
  };

  /**
   * 获取当前状态
   **/
  owner.getState = function() {
    var stateText = localStorage.getItem("$state") || "{}";
    return JSON.parse(stateText);
  };

  /**
   * 设置当前状态
   **/
  owner.setState = function(state) {
    state = state || {};
    localStorage.setItem("$state", JSON.stringify(state));
    //var settings = owner.getSettings();
    //settings.gestures = '';
    //owner.setSettings(settings);
  };
  // 检查邮箱
  var checkEmail = function(email) {
    email = email || "";
    return email.length > 3 && email.indexOf("@") > -1;
  };

  /**
   * 找回密码
   **/
  owner.forgetPassword = function(email, callback) {
    callback = callback || $.noop;
    if (!checkEmail(email)) {
      return callback("邮箱地址不合法");
    }
    return callback(null, "新的随机密码已经发送到您的邮箱，请查收邮件。");
  };

  /**
   * 获取应用本地配置
   **/
  owner.setSettings = function(settings) {
    settings = settings || {};
    localStorage.setItem("$settings", JSON.stringify(settings));
  };

  /**
   * 设置应用本地配置
   **/
  owner.getSettings = function() {
    var settingsText = localStorage.getItem("$settings") || "{}";
    return JSON.parse(settingsText);
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
  //
  // 设置config
  owner.config = function(k, v) {
    var configText = localStorage.getItem("$config") || "{}";
    var config = JSON.parse(configText);
    // 存 或者覆盖
    if (k && v) {
      // 考虑到V可能是json
      if (typeof v === "object" || typeof v === "array") {
        v = JSON.stringify(v);
      }
      config[k] = v;
    } else if (k) {
      var value = config[k];
      try {
        // console.log("value", value);
        // console.log("type", typeof value);
        return JSON.parse(value);
      } catch (e) {
        // console.error(e);
        return value;
      }
    } else {
      throw "参数错误";
    }
    localStorage.setItem("$config", JSON.stringify(config));
  };
  // config 初始化
  owner.configInit = function(settings) {
    settings = settings || {};
    localStorage.setItem("$config", JSON.stringify(settings));
  };
  owner.configInit(appConfig);
})(mui, (window.app = {}));
