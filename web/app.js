//app.js
const wafer = require('/vendors/wafer-client-sdk/index');
const lab = require('/lib/lab');
var https = require('utils/https.js');
var uploadpicture = require('utils/upload_file.js');
var timefunc = require('utils/util.js');
var isregistfunc = require('utils/isregiste.js');
var getRecommend = require('utils/getRecommend.js');
var event = require('utils/event.js');
var time = require('utils/time.js');
wafer.setLoginUrl('https://shipbuildchat.club/login');

let heartCheck = {
  timeout: 10000,
  timeoutObj: null,
  serverTimeoutObj: null,
  reset: function () {
    clearTimeout(this.timeoutObj);
    clearTimeout(this.serverTimeoutObj);
    return this;
  },
  start: function (openId) {

    this.timeoutObj = setTimeout(() => {
      var notice = JSON.stringify({
        type: '_is_link',
        from_id: openId,
        to_id: '',
        msg: ' '
      })
      //      if (socketLink) {
      wx.sendSocketMessage({
        data: notice,
        success() {
        },
        fail() {
          wx.closeSocket();
        }
      });
      //      }
      this.serverTimeoutObj = setTimeout(() => {
        //     if (!socketLink) {
        wx.closeSocket(
          success => {
          },
          fail => {
          }
        );
        //     }
      }, this.timeout);
    }, this.timeout);
  }
};

App({
  config: {
    host: 'shipbuildchat.club'
  },
  globalData: {
    openId: '',
    queryResult: '',
    username: '',
    myprojects: '',
    isregiste: false,
    passvalue: '',
    tmpassvalue: '',
    danwei: '',
    bumen: '',
    avatarUrl: '',
    isreadflag: '',
    tel: '',
    userid: '',
    msgInfonum: new Array(),//数组每一个元素是
    resobjmsg: new Array(),
    saveflag: true
  },


  func: {
    req: https.req,
    uploadfile: uploadpicture.uploadfile,
    time: timefunc.wxuuid,
    isregstfunc: isregistfunc.isregiste,
    down_file: getRecommend.down_file,
    gettime: time.time,
  },


  onLoad: function () {
  },

  onLaunch: function () {
    wx.cloud.init({
      env: 'shipbuild-test-a21082',
      traceUser: true
    })
    event.on('request', this, function (data) {
      //  request() {
      wafer.request({
        login: true,
        url: 'https://shipbuildchat.club/me',
        method: 'GET',
        success: (res) => {
          if (+res.statusCode == 200) {
            this.connect();
            if (res.data.openId) {
              lab.finish('session');
            } else {
              console.error('会话获取失败', res.data);
            }
          } else {
          }
        },
        fail: (error) => {
          console.log('没有session会话信息！');
          wx.navigateTo({
            url: '../index/index',
            success: function(res) {},
            fail: function(res) {},
            complete: function(res) {},
          })
          // <view class='row-flex-but'>
          //   <button open-type='getUserInfo' bindgetuserinfo='getUserInfo' bindtap='regestInfo' type='primary'>提交信息</button>
          // </view>
        },
        complete: () => {
        }
      });

    });
    this.getOpenid(this);
  },


  // 获取用户openid
  getOpenid() {
    var userInfo = new Array('');
    let that = this;
    wx.cloud.callFunction({
      name: 'getUserInfo',
      complete: res => {
        this.globalData.openId = res.result.openId;
        let promise = new Promise(function (resolve, reject) {
          https.req('/load', { openId: res.result.openId }, function (res) {
            if (res == '') {//在这里添加判断用户是否注册的功能
              console.log('需要注册');
              that.globalData.isregiste = false;
            } else {
              that.globalData.isregiste = true,
                userInfo[0] = res.name,
                userInfo[1] = res.danwei,
                userInfo[2] = res.bumen,
                userInfo[3] = res.tel,
                userInfo[4] = res.id,
              event.emit('request', ' ');
              wx.switchTab({
                url: "/pages/home/index",
                success: res => {
                },

                fail: res => {
                  console.info('页面跳转失败！')
                }
              })
            }
            //         console.log('before resolve-> user_danwei: ' + user_danwei);
            resolve(userInfo);
            //      return promise;
          });
        });
        promise.then(function (userInfo) {
          that.globalData.username = userInfo[0];
          that.globalData.danwei = userInfo[1];
          that.globalData.bumen = userInfo[2];
          that.globalData.tel = userInfo[3];
          that.globalData.userid = userInfo[4];

        });
      }
    })
  },

  connect() {
    this.listen();
    wafer.setLoginUrl(`https://shipbuildchat.club/login`);
    wafer.login({
      success: () => {
        //     this.globalData.socketLink = true;
        const header = wafer.buildSessionHeader();
        wx.connectSocket({
          url: 'wss://shipbuildchat.club/ws',
          header
        });
        this.initEventHandle();
      },
      fail: (err) => {
        this.setData({
          status: 'warn',
          connecting: false,
          hintLine1: '登录失败',
          hintLine2: err.message || err
        });
      }
    });
  },

  reconnect() {
    this.listen();
    wafer.setLoginUrl(`https://shipbuildchat.club/login`);
    wafer.login({
      success: () => {
        const header = wafer.buildSessionHeader();
        const query = Object.keys(header).map(key => `${key}=${encodeURIComponent(header[key])}`).join('&');
        wx.connectSocket({
          url: 'wss://shipbuildchat.club/ws',
          header
        });
      },
      fail: (err) => {
        console.log('重连失败');
      }
    });
  },
//离线时接收多条消息时下面的逻辑就会出现只保存最新的一条消息，然后该消息会在该聊天窗口中
//没收到一条消息就会重复出现一次。!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
FuncA:function(index){
  var type = this.globalData.resobjmsg[index].type;
  var msg = [];
  let that = this;
  if(type == '_to_user'){
      wx.getStorage({
        key: 'chat' + that.globalData.resobjmsg[index].from_id,
        success: function (res) {
          //根本就没有取数据
          console.log('消息获取了-》res.data-> ', res.data);
          if (res.data.length > 0) {
            msg = res.data;
            that.savemsg(msg, type, index);
          } else {
            that.savemsg(msg, type, index);
          }
        },
        fail: function () {
          console.log('消息获取失败');
          that.savemsg(msg, type, index);
        }
      })
  } else if (type == '_to_group') {
      wx.getStorage({
        key: 'chat' + that.globalData.resobjmsg[index].which_group,
        success: function (res) {
          msg = res.data;
          that.savemsg(msg, type, index);
        },
        fail: function () {
          that.savemsg(msg, type, index);
        }
      })
  }
  this.FuncB(index,msg,type);
},
//消息数组在取之前没有存上，导致只存了后面来的消息
savemsg: function(msg,type,index){
  let that = this;
  //将发过来的新消息保存到本地的chat+from_id/which_id中
  msg[msg.length] = that.globalData.resobjmsg[index];
  if (type == '_to_user') {
    wx.setStorage({
      key: 'chat' + that.globalData.resobjmsg[index].from_id,
      data: msg,
  //    data: that.globalData.resobjmsg
      success: function(){
        console.log('消息保存了 msg: ',msg);
        that.gavetime(index);
        // that.setData({
        //   saveflag: false,
        // })
      }
    });
    event.emit('getmsg', 'chat' + that.globalData.resobjmsg[index].from_id);
  } else if (type == '_to_group') {
    wx.setStorage({
      key: 'chat' + that.globalData.resobjmsg[index].which_group,
      data: msg,
//      data: that.globalData.resobjmsg
      success: function () {
        console.log('消息保存了 msg: ', msg);
        that.gavetime(index);
        // that.setData({
        //   saveflag:false,
        // })
      }
    });
    event.emit('getmsg', 'chat' + that.globalData.resobjmsg[index].which_group);
  };
},

  FuncB: function (index, msg, type){
    //首先记录未读消息的数量
    let that = this;
    var msgindex = 0;
        //查找到后增加计数
        while (msgindex < that.globalData.msgInfonum.length){
          if (type == '_to_user') {
            if (that.globalData.resobjmsg[index].from_id == that.globalData.msgInfonum[msgindex].from_id) {
              that.globalData.msgInfonum[msgindex].num += 1;
              that.globalData.msgInfonum[msgindex].time = that.globalData.resobjmsg[index].time;
              msgindex = 0;
              break;
            }
          } else if (type == '_to_group') {
            if (that.globalData.resobjmsg[index].which_group == that.globalData.msgInfonum[msgindex].from_id) {
              that.globalData.msgInfonum[msgindex].num += 1;
              that.globalData.msgInfonum[msgindex].time = that.globalData.resobjmsg[index].time;
              msgindex = 0;
              break;
            }
          }
          ++msgindex;
        }
      if (msgindex == that.globalData.msgInfonum.length) {
        if (type == '_to_user') {
          that.globalData.msgInfonum[msgindex] = {
            from_id: this.globalData.resobjmsg[index].from_id,
            num: 1,
            time: this.globalData.resobjmsg[index].time,
            type: '_to_user'
          };
        } else if (type == '_to_group') {
          that.globalData.msgInfonum[msgindex] = {
            from_id: this.globalData.resobjmsg[index].which_group,
            openId: this.globalData.resobjmsg[index].from_id,
            num: 1,
            time: this.globalData.resobjmsg[index].time,
            type: '_to_group'
          };
        }
      }
    // this.setmsgInfo();
    //将msgInfonum保存到本地的noreadmsg中
    wx.setStorage({
      key: 'noreadmsg',
      data: that.globalData.msgInfonum,
      success:function(){
        event.emit('noreadmsg');
        event.emit('noreadchat');
      }
    })
    //判断是否调用FuncA函数
    // index = index + 1;
    // if(index < that.globalData.resobjmsg.length){
    //   // while (that.globalData.saveflag){}
    //   // that.globalData.saveflag = true;
    //     that.FuncA(index);
    // }
  },

  gavetime:function(index){
    let that = this;
    setTimeout(function(){
      index = index + 1;
      if (index < that.globalData.resobjmsg.length) {
        that.FuncA(index);
      }
    },200)
  },

// setmsgInfo:function(){
//   var ary = app.globalData.msgInfonum;
//   this.setData({
//     ary
//   })
//},
  initEventHandle() {
    // let that = this
    wx.onSocketMessage((res) => {
      var tmp = JSON.parse(res.data);
      if(tmp instanceof Array)
      {
        console.log('离线时接收到了一个数组消息为tmp: ',tmp);
        this.globalData.resobjmsg = tmp;
      }else{
        this.globalData.resobjmsg[0] = tmp;
      }
      let that = this;
      wx.getStorage({
        key: 'noreadmsg',
        success: function(resu) {
            that.globalData.msgInfonum = resu.data
          that.FuncA(0);
        },
        fail: function(){
          that.FuncA(0);
        }
      });
    })

    wx.onSocketOpen(() => {
    })
    wx.onSocketError((res) => {
      console.log('WebSocket连接打开失败')
      this.reconnect()
    })
    wx.onSocketClose((res) => {
      this.reconnect()
      // }
    })

  },

  isRead() {
    let that = this;
    wx.getStorage({
      key: 'chatmsg',
      success: function (res) {
        if (res.data.length > 0) {
          that.globalData.isreadflag = false;
          console.log('有消息未读');
        }
      },
    })
  },
  /**
   * WebSocket 是否已经连接
   */
  socketOpen: false,

  listen() {
    wx.onSocketOpen(() => {
      // this.socketOpen = true;
      // this.setData({
      //   status: 'success',
      //   connecting: false,
      //   hintLine1: '连接成功',
      //   hintLine2: '现在可以通过 WebSocket 发送接收消息了'
      // });
      console.info('WebSocket 已连接');
    });
  }
})
