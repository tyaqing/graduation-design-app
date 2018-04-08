const GLOBAL_URL = "https://safe.femirror.com";

$.ajaxSetup({
  type: "POST", // 默认使用POST方式
  showLoading: false,
  debug: true,
  dataType: "json",
  headers: {
    // 默认添加请求头
  },
  error: function(jqXHR, textStatus, errorMsg) {
    // 出错时默认 的处理函数 比如404 401 502
    console.log("应该到我了吗", jqXHR);
    // return;
    // jqXHR.responseText
    if (jqXHR.responseText) {
      let data = JSON.parse(jqXHR.responseText);
      mui.toast(data.msg);
    }
    // console.log(jqXHR.responseJson);
    if (jqXHR.status == "401") {
      setTimeout(function() {
        location.href = "../login.html";
      }, 600);
    } else {
      console.log("errorMsg", JSON.stringify(JSON.stringify(jqXHR)));
    }

    console.log("404 或5错误", jqXHR.responseText);
  },
  beforeSend: function() {
    // console.log("执行成功 :", this.type, this.url);
    this.showLoading && plus.nativeUI.showWaiting("加载中...");
  },
  complete: function() {
    // 收到回应(response)会执行
    this.showLoading && plus.nativeUI.closeWaiting();
  },
  success: function(res) {
    this.debug && console.log("请求结果", res);
  }
});
// 打开新的窗口
function openWebview(obj) {
  console.log("打开新的Webview", JSON.stringify(obj));
  mui.openWindow({
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
        progress: {
          // 标题栏控件的进度条样式
          color: "#00FF00", // 进度条颜色,默认值为"#00FF00"
          height: "2px" // 进度条高度,默认值为"2px"
        },
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
  });
}
/**
 * 清理webview
 * @example 适用场景：登录注销后，关闭无用或历史webview；
 * @param {Array} idList 不被关闭的webview的id集合
 */
var clearWebview = function(idList) {
  idList.push(plus.runtime.appid); //入口页不可销毁
  var wvList = plus.webview.all();
  for (var i = 0, len = wvList.length; i < len; i++) {
    if (~idList.indexOf(wvList[i].id)) {
      //当前webview不需关闭
      continue;
    }
    wvList[i].close("none"); //静默关闭，不使用动画效果；
  }
};

// showloading 实现
(function($, window) {
  //显示加载框
  $.showLoading = function(message, type) {
    if ($.os.plus && type !== "div") {
      $.plusReady(function() {
        plus.nativeUI.showWaiting(message);
      });
    } else {
      var html = "";
      html += '<i class="mui-spinner mui-spinner-white"></i>';
      html += '<p class="text">' + (message || "数据加载中") + "</p>";

      //遮罩层
      var mask = document.getElementsByClassName("mui-show-loading-mask");
      if (mask.length == 0) {
        mask = document.createElement("div");
        mask.classList.add("mui-show-loading-mask");
        document.body.appendChild(mask);
        mask.addEventListener("touchmove", function(e) {
          e.stopPropagation();
          e.preventDefault();
        });
      } else {
        mask[0].classList.remove("mui-show-loading-mask-hidden");
      }
      //加载框
      var toast = document.getElementsByClassName("mui-show-loading");
      if (toast.length == 0) {
        toast = document.createElement("div");
        toast.classList.add("mui-show-loading");
        toast.classList.add("loading-visible");
        document.body.appendChild(toast);
        toast.innerHTML = html;
        toast.addEventListener("touchmove", function(e) {
          e.stopPropagation();
          e.preventDefault();
        });
      } else {
        toast[0].innerHTML = html;
        toast[0].classList.add("loading-visible");
      }
    }
  };

  //隐藏加载框
  $.hideLoading = function(callback) {
    if ($.os.plus) {
      $.plusReady(function() {
        plus.nativeUI.closeWaiting();
      });
    }
    var mask = document.getElementsByClassName("mui-show-loading-mask");
    var toast = document.getElementsByClassName("mui-show-loading");
    if (mask.length > 0) {
      mask[0].classList.add("mui-show-loading-mask-hidden");
    }
    if (toast.length > 0) {
      toast[0].classList.remove("loading-visible");
      callback && callback();
    }
  };
})(mui, window);
