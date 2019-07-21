//引入ws支持WebSocket的实现
const ws = require('ws');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/weapp';
const async = require('async');
var seedrandom = require('seedrandom');
var getIndex = require('./optUserWs.js');
exports.listen = listen;
/**
 *
 * 在 HTTP Server 上处理 WebSocket 请求
 * @param {http.Server} server
 * @param {wafer.SessionMiddleware} sessionMiddleware
 */

var socketobj = {};
var socketuser = {};
var onlineuser = {};
var hasmsg = {};
function listen(server, sessionMiddleware) {
    // 使用 HTTP Server 创建 WebSocket 服务，使用 path 参数指定需要升级为 WebSocket 的路径
    const wss = new ws.Server({ server, path: '/ws' });
    // 监听 WebSocket 连接建立
    wss.on('connection', (ws,request) => {// 要升级到 WebSocket 协议的 HTTP 连接
    console.log('监听到有人连接服务器了');

        // 被升级到 WebSocket 的请求不会被 express 处理，
        // 需要使用会话中间节获取会话
        sessionMiddleware(request, null, () => {
            const session = request.session;
            if (!session) {
                // 没有获取到会话，强制断开 WebSocket 连接
                ws.send(JSON.stringify(request.sessionError) || "No session avaliable");
                ws.close();
                return;
            }
            // 保留这个日志的输出可让实验室能检查到当前步骤是否完成
            console.log(`WebSocket client connected with openId=${session.userInfo.openId}`);
	    var index = getIndex(session.userInfo.openId);
	    console.log('openId->index: ',index);
	    socketobj[index] = ws;
	    socketuser[index] = session.userInfo.openId;
	    if(hasmsg[index] === '1'){
		//从数据库中的msgtable表中查找到对应的数据并将读取到的数删除
		MongoClient.connect(url,function(err,db){
		 if(err) throw err;
		 var dbo = db.db("weapp");
		 var obj = {to_id:session.userInfo.openId};
		 dbo.collection("msgtable").find(obj).toArray(function(err,result){
			if(err) throw err;
		//组装数据并发送
			console.log('新上线的用户有消息在数据库中，取出并传递了,result->',result);
//result需要变为string格式才能传递，不然用户端接收不到内容
			ws.send(JSON.stringify(result));
		 });
		 dbo.collection("msgtable").deleteMany(obj,function(err,result){
			if(err) throw err;
			db.close();
		 })
		})
		hasmsg[index] = ''
	    }
	    socketobj[index].on('message',(msgobj) => {
		var splitstr = JSON.parse(msgobj);
		var type = splitstr.type;
		var from_id = splitstr.from_id;
		console.log('msgobj-> ',type);
		console.log('创建了的对象');
		if(type == '_is_link')
		{
   //	  serveheart(from_ws);
		 console.log('判断正确，要进入serveheart');
		}else if(type == '_to_user'){
		  console.log('成功判断了_to_user');
		  touser(msgobj,hasmsg,socketobj);
		}else{
		 togroup(msgobj,hasmsg);
   //实现的机制是，msgobj还需要一个标志位flag（0表示第一次连接进入，1表示不是第一次进入）
   //当flag为0时，msgobj的结构上to_id变为数组，togroup实现群发功能。
		}
	   });
   
	   socketobj[index].on('close',(code,message) => {
		console.log('用户断开连接');
		delete socketobj[index];
		process.send('child send');
   //	 delete socketuser[index];
		console.log('删除socketobj,socketuser成功');
	   });
	    })
	   console.log('xhhwebsocket->after objsocket');

    });
}

function serveheart(from_ws){
	console.log('发送心跳')
//	 from_ws.send(' ');
}

function touser(msgobj,hasmsg,socketobj){
	console.log('进入touser内部');
	var splitstr = JSON.parse(msgobj);
	var from_id = splitstr.from_id;
	var to_id = splitstr.to_id;
	var msg = splitstr.msg;
	var from_index = getIndex(from_id);
	var to_index = getIndex(to_id);
	console.log('to_index-> ',to_index);
	console.log('in xhhObjsocket->touser->socketobj: ', typeof(socketobj));
	var to_ws = socketobj[to_index];
	var from_ws = socketobj[from_index];
	if(to_ws)//在对象内部如何获取其他对象的ws？？解决办法，调用一个全局的静态类：getUserWs,该类有两个功能一是返回
	{	//查询的在线客户的ws，二是当用户退出时，删除该用户的在新信息
	 console.log('对方在线，发送数据');
	 to_ws.send(msgobj);
	}else{
	 console.log('对方不在线');//对方不在线时，数据怎么发送？？
	 msgobj = JSON.stringify({
	  type: '_is_not_online',
	  from_id: ' ',
	  to_id: to_id,
	  msg: ' '
	 });
	 from_ws.send(msgobj);
//把消息整个的保存到weapp数据库的msgtable表中,并标记该消息未读，
	 var obj ={
	   type: '_to_user',
	   from_id: from_id,
	   to_id: to_id,
	   msg:msg,
	   time:splitstr.time	    
	 };
	 MongoClient.connect(url,function(err,db){
	   if(err) throw err;
	   var dbo = db.db("weapp");
	   dbo.collection("msgtable").insertOne(obj,function(err,result){
		if(err) throw err;
		db.close();
	   })
	 })
//并将to_id保存到hasmsgsocke数组中
	 hasmsg[to_index] = '1';
	}
}

function togroup(msgobj,hasmsg){
	
	//第一步：根据flag判断是否是第一次连接，第一次则分解to_id为数组并保存该数组对应的socketobj索引，
	//若不是第一次则直接使用保存下来的索引
	//第二步：循环发送消息给每一个to_id[index]
	//在这里需要创建一个广播方法实现在群组内广播消息，
	//所以还需要两个变量：一是用来记录在线的群，二是用来记录在线群的在线用户
	//去掉flag每次来都if-else都要做
	var splitstr = JSON.parse(msgobj);
	console.log('togroup-> tmpstr: ', splitstr);
//	var flag = splitstr.flag;
//	if(flag == '0'){
	 var to_id = splitstr.to_id;
//	 console.log('to_id[0] = ', to_id[0]);
	 var to_id_ary = to_id;
	 var index = 0;
//获取每一个openId
	 while(index < to_id_ary.length)
	 {
	   console.log('this.to_id_ary-> ',to_id_ary[index]);
	   ++index;
	 }
//获取每一个openId对应的索引
	 index = 0;
	 var to_id_ary_index = [];
	 while(index < to_id_ary.length)
	 {
	   to_id_ary_index[index] = getIndex(to_id_ary[index]);
	   console.log('while-> ', to_id_ary_index[index]);
	   ++index;
	 }
//	}else{
	index = 0;
	let that = this;
	async.map(to_id_ary_index,function(item,callback){
	console.log('this.to_id_ary_index-> ', item);
	var obj = {
	 type:'_to_group',
	 from_id: splitstr.from_id,
	 to_id: to_id_ary[index],
	 which_group:splitstr.which_group,
	 msg:splitstr.msg,
	 time:splitstr.time
	};
	 if(socketobj[item])
	 {
	   var strobj = JSON.stringify(obj);
		 togroupuser(socketobj[item],strobj);
	   ++index;
	 }else{
		var from_id = splitstr.from_id;
		var which_group = splitstr.which_group;
		var mssg = splitstr.msg;
		++index;
	 MongoClient.connect(url,function(err,db){
	   if(err) throw err;
	   var dbo = db.db("weapp");
	   dbo.collection("msgtable").insertOne(obj,function(err,result){
		if(err) throw err;
		db.close();
	   })
	 })
	   hasmsg[item] = '1';
	 }
	})
   //}
}

function togroupuser(ws,msgjson){
	console.log('进入togroupuser内部,msgjson-> ', msgjson);
	 console.log('对方在线，发送数据');
	 ws.send(msgjson);
}



