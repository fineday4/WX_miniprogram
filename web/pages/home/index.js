//index.js
var app = getApp();
var util = require('../../utils/util.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  //轮播图的切换事件
  swiperChange: function (e) {
    //只要把切换后当前的index传给<swiper>组件的current属性即可
    this.setData({
      swiperCurrent: e.detail.current
    })
  },
  //点击指示点切换
  chuangEvent: function (e) {
    this.setData({
      swiperCurrent: e.currentTarget.id
    })
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
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    
  },
  kanban:function(){
    app.func.isregstfunc(app.globalData.isregiste);
    app.func.req('/kanban',{danwei:app.globalData.danwei},function(res){
      wx.setStorage({
        key: 'alltasks',
        data: res,
      })
      console.log('kanban->res: ',res);
      var hn = ['默认'];
      var index = 0;
      while(index < res.length){
        var idx = 1;
        while(idx < hn.length){
          if(hn[idx] == res[index])
          {
            break;
          }
          ++idx;
        }
        if(idx == hn.length){
          hn[idx] = res[index].HN;
        }
        ++index;
      }
      wx.navigateTo({
        url: '../kanban/kanban?hn=' + hn,
      })
    })
  },
  yijian:function(){
    console.info("意见点击事件");
  },
  zhuantai:function(){
    app.func.isregstfunc(app.globalData.isregiste);
      wx.navigateTo({
        url: '../zhuantai/zhuantai'
      })
  },
  shenqing:function(){
    app.func.isregstfunc(app.globalData.isregiste);
      wx.navigateTo({
        url: '../baoyan/baoyan'
      })
  },
  xinzen:function(){
    app.func.isregstfunc(app.globalData.isregiste);
      wx.navigateTo({
        url: '../xinzen/xinzen'
      })
    var timestamp = Date.parse(new Date());
    var date = new Date(timestamp);
    //获取年份  
    var Y = date.getFullYear();
    //获取月份  
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
    //获取当日日期 
    var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    console.log("当前时间：" + Y + '-' + M + '-' + D);
    app.globalData.passvalue = Y + '-' + M + '-' + D
  },
  bitem:function(){
    console.info("图片点击事件");
  },
  jieguo:function(){
    app.func.isregstfunc(app.globalData.isregiste);
    app.func.req('/jieguo',{openId: app.globalData.openId},function(res){
      console.log('index-130-res-> ',res);
      wx.setStorage({
        key: 'jieguo',
        data: res,
      })
    })
      wx.navigateTo({
        url: '../jieguo/jieguo'
      })
  }
})