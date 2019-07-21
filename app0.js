const http  = require('http');
const re = require('re');
const express = require('express');
const waferSession = require('wafer-node-session');
const MongoStore = require('connect-mongo')(waferSession);
const config = require('./config');
const async = require('async');
var Buffer = require('Buffer');
var app = express();
var formidable = require('formidable');
const fs = require("fs");
const util = require('util');
var bodyParser = require('body-parser');
let path = require('path');
var multer = require('multer');
var upload = multer({dest:'./tmp/'});
var url = 'mongodb://localhost:27017/weapp';
const querystring = require("querystring");
var process = require("child_process");
const promise = require('Promise');
const xhhwebsocket = require('./xhhwebsocket');
const MongoClient = require('mongodb').MongoClient;
app.get('/hello', function(req,res){
	res.send('Hello World');
});
//判断是否需要注册
app.get('/load',function(req,res){
	var restr = '';
	var openIds = '0';
		async.map(openIds,function(item,callback){
		MongoClient.connect(url,function(err,db){
		if(err) 
		{
			console.log('fail in load');
			throw err;
		}
		var dbo = db.db("weapp");
		var reg = new RegExp(req.query.openId);
		var obj = {session:reg};
		dbo.collection("sessions").find(obj).toArray(function(err,result){
			if(err) {
				console.log('在sessions里面出错了');
			}
			if(result){
			if(result[0]){
			var tmp = result[0].session;
			tmp = JSON.stringify(tmp);
			tmp = tmp.split(':');
			tmp = tmp[12].substring(2,) +":"+ tmp[13].substring(0,tmp[13].length-16);
			restr = tmp;
			console.log('-------sessions-----restr-> ', restr);
			}else{
				restr = 'nosession';
			}
			}else{
			restr = '0';	
			}
			callback(null,restr);
		});
		
	})
		},function(err,restr){
	var resobj = '';
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		var obj = {openId: req.query.openId};
		dbo.collection("users").findOne(obj,function(err,result){
			console.log('result.name-> ', result);
			if(err) {
				throw err;
				res.send('');
				}
			else{
			if(result == null)
			{
				res.send('');
			}else{
			if(result.picurl != restr && restr != "" && restr != 'nosession')////添加了restr != 'nosession'6/23
			{
				console.log('id-> ', result.id);
			resobj = {
				openId:req.query.openId,
				name:result.name,
				id: result.id,
				danwei:result.danwei,
				bumen:result.bumen,
				tel:result.tel,
				picurl:restr
			}
				updata(resobj);
			}else{
				resobj = {
					openId:req.query.openId,
					name:result.name,
					id: result.userid,
					danwei:result.danwei,
					bumen:result.bumen,
					tel:result.tel,
					picurl:'',
				}
			}
				console.log('I want see-> ', resobj);
				if(restr != 'nosession'){/////6/23
					res.send(resobj);
				}else{///////////////////6/23
					res.send(restr);/////////6/23
				}//////////////6/23
		}
			}
			db.close();
		});
	});
		})
});

function updata(obj)
{
	MongoClient.connect(url,function(err,db){
		var query = {openId:obj.openId};
		if(err) throw err;
		var dbo = db.db("weapp");
		dbo.collection("users").update(query,obj)
		db.close();
	})
}
//提交注册信息
app.get('/registe',function(req,res){
	var restr = '';
	console.log('req-> ', req.query.openId);
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		var checkid = {openId:req.query.openId};
		var checkcode = req.query.tel;
		if(checkcode == 'iMaintain')
		{
			dbo.collection("users").find(checkid).toArray(function(err,result)
			{
				if(err) throw err;
				if(result.length == 0 || result == null)
				{
					console.log('添加了');
					var obj = {
						   openId:req.query.openId,
					 	   name: req.query.name,
						   id: req.query.userid,
					  	   danwei: req.query.danwei,
					 	   bumen: req.query.bumen,
						  // tel: req.query.tel
						   };
					InsertRegiste(obj);
				};
				db.close();
				res.send('success');
		});
		}else{
				res.send('fail code');
		}
		});
		
});

function InsertRegiste(obj)
{
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		dbo.collection("users").insertOne(obj,function(err,result)
		{
			if(err) throw err;
			db.close();
		})
	})
}
//登陆功能的实现还需要借助与admin_mon.js来实现：
//将regist中注册的信息转入users集合中；
//删除regist集合


app.get('/xinzen',function(req,res){
	var restr = '';
	console.log('req.query: ',req.query);
	var tmpstr = req.query.Addrperson;
	tmpstr = tmpstr.split('"');
	var strary = [];
	var index = 0;
	var idx = 0;
	var addr = [];
	addr = req.query.AP.split('[[');
	addr = addr[1];
	addr = addr.split(']]');
	addr = addr[0];
	addr = addr.split('],[');
	while(index < addr.length)
	{
		console.log('addr-> ', addr[index]);
		idx = 0;
		var tmp = addr[index].split('","');
		tmp[0] = tmp[0].substring(1);
		tmp[1] = tmp[1].substring(0,tmp[1].length-1);
		addr[index] = new Array('');
		addr[index] = tmp; 
		++index;
	}
	console.log('new addr-> ',addr);
	var piclastname = [];
	if(req.query.PLname.length > 3){
		piclastname = req.query.PLname.split('","');
		piclastname[0] = piclastname[0].split('["')[1];
		piclastname[piclastname.length-1] = piclastname[piclastname.length-1].split('"]')[0];
	}
	console.log('I want see piclastname ary-> ', piclastname);
	index = 0;
	idx = 0;
	while(index < tmpstr.length){
		if(index%2 == 1)
		{
			strary[idx] = tmpstr[index];
			++idx;
		}
		++index;
	}
	idx = 0;
	index = 0;
	var statary = [];
	console.log('req.query.state = ',req.query.state);
	statary = req.query.state.split('[');
	statary = statary[1].split(']');
	statary = statary[0].split(',');
	console.log('strary = ', strary);
	console.log('req.query.AP = ', req.query.AP);
	let prom = new Promise(function(resolve,reject){
			MongoClient.connect(url,function(err,db){
				if(err) throw err;
				var dbo = db.db("weapp");
				var obj = {HN : req.query.HN};
//首先找船舶编号
				dbo.collection("projects").find(obj).toArray(function(err,result){
					if(err) throw err;
					console.log('resolve-> result: ', result);
					resolve(result[0]);
				});
//找到了就更新，找不到就新建				
				db.close();
			});
	});
	prom.then(function(str){
		console.log('then-> str: ', str);
		if(str == undefined)//没找到，新建
		{	
			var sda = req.query.Da.replace(/\-/g,'/');
			sda = Date.parse(sda);
			var obj = {HN : req.query.HN, DW: req.query.DW, num:'0001',Sda: sda, flag: '0'};
			insertProjectsW(obj);
			MongoClient.connect(url,function(err,db){
				if(err) throw err;
				var dbo = db.db("weapp");
				dbo.collection("projects").insertOne(obj, function(err,result){
					if(err) throw err;
					var saveobj = {
						openId: req.query.openId,
						timeId:req.query.timeId,
						picturenum:req.query.picturenum,
						num: req.query.HN + '-0001',
						DW: req.query.DW,
						HN:req.query.HN,
						PA:req.query.PA,
						Su:req.query.Su,
						Ca:req.query.Ca,
						Ty:req.query.Ty,
						OB:req.query.OB,
						Da:[req.query.Da],
						PLname: piclastname,
						DR:req.query.DR,
						Description:[req.query.Description],
						Addrperson:strary,
						AP:addr,
						flag:req.query.flag,
						state:statary,
						STA: '0'
						};
					savexinzen(saveobj);	
				});
				db.close();
			});
			
		}else{
		//找到了，更新
			var num = Number(str.num);
			num = 1+num;
			num = 10000+num;
			num = String(num).substring(1);
			var sda = req.query.Da.replace(/\-/g,'/');
			sda = Date.parse(sda);
			var obj = {HN : str.HN, DW: req.query.DW, num : num,Sda:sda,flag: '0'};
			insertProjectsW(obj);
			MongoClient.connect(url,function(err,db){
				if(err) throw err;
				var dbo = db.db("weapp");
				console.log('obj-> ', obj);
				var query = {HN:str.HN};
				if(err) throw err;
				dbo.collection("projects").update(query,obj);
				var saveobj = {
					openId:req.query.openId,
					timeId:req.query.timeId,
					picturenum:req.query.picturenum,
					num:req.query.HN + '-' + num,
					DW: req.query.DW,
					HN:req.query.HN,
					PA:req.query.PA,
					Su:req.query.Su,
					Ca:req.query.Ca,
					Ty:req.query.Ty,
					OB:req.query.OB,
					Da:[req.query.Da],
					PLname: piclastname,
					DR:req.query.DR,
					Description:[req.query.Description],
					Addrperson:strary,
					AP:addr,
					flag:req.query.flag,
					state:statary,
					STA: '0'
					};
					savexinzen(saveobj);	
				db.close();
			});
		}
	});
});

function savexinzen(obj){
	MongoClient.connect(url,function(err,db)
	{
		if(err) throw err;
		var dbo = db.db("weapp");
		console.log('/xinzen-obj: ', obj);
		dbo.collection("xinzen").insertOne(obj, function(err,result){
			if(err) throw err;
			db.close();
		});
	});
}

function insertProjectsW(obj){
	var searchobj = {
		HN: obj.HN,
		num: obj.num
	};
	console.log('insertProjectsW obj-> ', obj);
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		console.log('insertProjectsW in Mongodb');
		var dbo = db.db("weapp");
		dbo.collection("suggestAdd").update(searchobj,obj,{upsert:true});
	});
}

app.get('/suggest',function(req,res){
	var restr = '';
	MongoClient.connect(url,function(err,db)
	{
		if(err) throw err;
		var dbo = db.db("weapp");
		var obj = {
			que:req.query.que,
			name:req.query.name,
			danwei:req.query.danwei,
			tel:req.query.tel,
			email:req.query.email
			};
		dbo.collection("suggest").insertOne(obj, function(err,result){
			if(err) throw err;
			db.close();
		});
	});
});

app.get('/getsuggestAdd',function(req,res){
	var searchobj = {DW: req.query.DW};
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		dbo.collection("suggestAdd").find(searchobj).toArray(function(err,result){
			if(err) throw err;
			res.send(result);
		});
	});
});

app.post('/suggestpictures',function(req,res){
	req.setEncoding('binary');
	var body = '';
	var fileName = '';
	var filelastname = '';
	var boundary = req.headers['content-type'].split('; ')[1].replace('boundary=','');
	let prom = new Promise(function(resolve,reject){req.on('data',function(chunk){
		body += chunk;
		console.log('req.on(data)');
		resolve('over-data');
	});
	});
	prom.then(function(str){
		req.on('end',function(){
		console.log('req.on(end)');
		var file = querystring.parse(body,'\r\n',':');
		if(file['Content-Type'].indexOf("image") != -1||file['Content-Type'].indexOf("video") != -1)
		{
			var stringfile = JSON.stringify(file['Content-Disposition']);
			var fileInfo = stringfile.split('; ');
			console.log('fileInfo= '+fileInfo);
			for(value in fileInfo){
				if(fileInfo[value].indexOf("filename=") != -1){
					filelastname = fileInfo[value].substring(0,fileInfo[value].length-1);
					if(filelastname.indexOf('\\') != -1){
						filelastname = filelastname.substring(filelastname.lastIndexOf('.'),filelastname.lastIndexOf('\\'));
						console.log('filelastname = '+filelastname);
						break;
					}
				}
				if(fileInfo[value].indexOf("name=") != -1){
					fileName = fileInfo[value].substring(0,fileInfo[value].length-1);
					if(fileName.indexOf('\\') != -1){
						fileName = fileName.substring(7,fileName.lastIndexOf('\\'));
						console.log('fileName = '+ fileName);
					}
				}
			}
			var entireData = body.toString();
			var contentTypeRegex = /Content-Type: image\/.*/;
			contentType = file['Content-Type'].substring(1);
			var upperBoundary = entireData.indexOf(contentType) + contentType.length;
			var shorterData = entireData.substring(upperBoundary);
			var binaryDataAlmost = shorterData.replace(/^\s\s*/,'').replace(/\s\s*$/,'');
			var binaryData = binaryDataAlmost.substring(0,binaryDataAlmost.indexOf('--'+boundary+'--'));
			fileName = fileName + filelastname;
			console.log('fileName = ' + fileName);
			fs.writeFile(fileName,binaryData,'binary',function(err){
				res.end('图片保存成功');
				console.log('图片保存成功');
			});
			process.exec('mv '+ fileName +' /data/release/weapp/suggestpictures',function(err){
				if(err) throw err;
			});
		}else{
			res.end('图片上传失败');
			console.log('图片保存失败');
		}
		
	});
	});
	
});

app.get('/baoyan',function(req,res){
	var searchstr = req.query.HN+req.query.Ty;		
	let prom = new Promise(function(resolve, reject){
		searchmap = {hnty: searchstr};
		MongoClient.connect(url,function(err,db){
			if(err) throw err;
			var dbo = db.db("weapp");
			dbo.collection("baoyannum").find(searchmap).toArray(function(err,result){
				if(err) throw err;
				console.log('resolve-> result: ', result);
				resolve(result[0]);
			});
		});
	});
	prom.then(function(data){
		if(data == undefined){
			var insertstr = {
				hnty:searchstr,
				num: 0001
			}
			MongoClient.connect(url,function(err,db){
				if(err) throw err;
				var dbo = db.db("weapp");
				dbo.collection("baoyannum").insertOne(insertstr,function(err,result){
					if(err) throw err;
					db.close();
				});
			})
			var insertbaoyan = {
				openIds: [req.query.openId,req.query.to_id],
				HN: req.query.HN,
				Ty: req.query.Ty,
				num: '00001',
				Da: req.query.Da,
				Ti: req.query.Ti,
				Lo: req.query.Lo,
				InDe: req.query.InDe,
				In: req.query.In,
				Tel: req.query.Tel,
				At: req.query.At,
				DW: req.query.DW,
				flag: req.query.flag
			};
			savebaoyan(insertbaoyan);
		}else{
			var num = number(data.num);
			num = num + 1;
			num = 100000 + num;
			num = num.substring(1);
			var search = {hnty: data.hnty};
			MongoClient.connect(url,function(err,db){
				if(err) throw err;
				var dbo = db.db("weapp");
				var obj = {$set:{num:num}};
				db.collection("baoyannum").update(search,obj);
			});
			var insertbaoyan = {
				openIds: [req.query.openId,req.query.to_id],
				HN: req.query.HN,
				Ty: req.query.Ty,
				num: num,
				Da: req.query.Da,
				Ti: req.query.Ti,
				Lo: req.query.Lo,
				InDe: req.query.InDe,
				In: req.query.In,
				Tel: req.query.Tel,
				At: req.query.At,
				DW: req.query.DW,
				flag: req.query.flag
			};
			savebaoyan(insertbaoyan);
		}
	})
});

function savebaoyan(obj){
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		dbo.collection("baoyan").insertOne(obj, function(err,result){
			if(err) throw err;
			db.close();
		});
	});
}

//接下来就是实现新增意见，难点就是图片的上传，网上的经验就是在Mongodb中存储文件
//的存放路径。但这也同样带来了另外一个问题：如何实现图片的下载。

app.post('/xinzenpictures',function(req,res){
	req.setEncoding('binary');
	var body = '';
	var fileName = '';
	var filelastname = '';
	var boundary = req.headers['content-type'].split('; ')[1].replace('boundary=','');
	console.log('/xinzenpictures');
	let prom = new Promise(function(resolve,reject){req.on('data',function(chunk){
		body += chunk;
		console.log('req.on(data)');
		resolve('over-data');
	});
	});
	prom.then(function(str){
		req.on('end',function(){
		console.log('req.on(end)');
		var file = querystring.parse(body,'\r\n',':');
		if(file['Content-Type'].indexOf("image") != -1||file['Content-Type'].indexOf("video") != -1)
		{
			var stringfile = JSON.stringify(file['Content-Disposition']);
			var fileInfo = stringfile.split('; ');
			console.log('fileInfo= '+fileInfo);
			for(value in fileInfo){
				if(fileInfo[value].indexOf("filename=") != -1){
					filelastname = fileInfo[value].substring(0,fileInfo[value].length-1);
					if(filelastname.indexOf('\\') != -1){
						filelastname = filelastname.substring(filelastname.lastIndexOf('.'),filelastname.lastIndexOf('\\'));
						console.log('filelastname = '+filelastname);
						break;
					}
				}
				if(fileInfo[value].indexOf("name=") != -1){
					fileName = fileInfo[value].substring(0,fileInfo[value].length-1);
					if(fileName.indexOf('\\') != -1){
						fileName = fileName.substring(7,fileName.lastIndexOf('\\'));
						console.log('fileName = '+ fileName);
					}
				}
			}
			var entireData = body.toString();
			var contentTypeRegex = /Content-Type: image\/.*/;
			contentType = file['Content-Type'].substring(1);
			var upperBoundary = entireData.indexOf(contentType) + contentType.length;
			var shorterData = entireData.substring(upperBoundary);
			var binaryDataAlmost = shorterData.replace(/^\s\s*/,'').replace(/\s\s*$/,'');
			var binaryData = binaryDataAlmost.substring(0,binaryDataAlmost.indexOf('--'+boundary+'--'));
			fileName = fileName + filelastname;
			console.log('fileName = ' + fileName);
			fs.writeFile(fileName,binaryData,'binary',function(err){
				res.end('图片保存成功');
				console.log('图片保存成功');
			});
			process.exec('mv '+ fileName +' /data/release/weapp/xinzenpictures',function(err){
				if(err) throw err;
			});
		}else{
			res.end('图片上传失败');
			console.log('图片保存失败');
		}
		
	});
	});
	
});

app.get('/myprojects',function(req,res){
	var restr = '';
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		console.log('req.query.openId: ', req.query.openId);
		console.log('req.query.SN: ', req.query.SN);
		if(req.query.SN != 'undefined' && req.query.SN != '')
		{
			var obj = {openId: req.query.openId,
				   SN: req.query.SN};
			console.log('req.query =  ', req.query);
			dbo.collection("projects").find(obj).toArray(function(err,result){
				if(err) throw err;
				restr = result;
				res.send(restr);
				db.close();
			});
		}else{
			var obj = {openId: req.query.openId};
			console.log('req.query.SN ==  ',req.length);
			dbo.collection("projects").find(obj).toArray(function(err,result){
				if(err) throw err;
				restr = result;
				res.send(restr);
				db.close();
			});
		}
	});
});

app.get('/kanban',function(req,res){
	var searchstr = {DW:req.query.danwei};
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		dbo.collection("xinzen").find(searchstr).toArray(function(err,result){
			if(err) throw err;
			res.send(result);
			db.close();
		});
	});
});

app.get('/changestate',function(req,res){
	var obj = {
			openId: req.query.Id,
			num: req.query.num,
			state: req.query.state
		}
	chgedstatefunc(obj);
});
function chgedstatefunc(objword){
	console.log('chgedstatefunc objword-> ', objword);
	var reg = new RegExp("(?:)"+objword.openId+"(?:)",'g');
	var regnum = new RegExp("(?:)"+objword.num+"(?:)",'g');
	var state = objword.state;
	var searchstr = {Addrperson: reg, num:regnum};
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		dbo.collection("xinzen").find(searchstr).toArray(function(err,result){
			if(err) throw err;
			var index = 0;
			console.log('in chgedstatefunc get result-> ',result);
			while(index < result[0].Addrperson.length)
			{
				if(result[0].Addrperson[index] == objword.openId)
				{
					break;
				}
				++index;
			}
			var tmp = result[0].state;
			tmp[index] = state;
//function insertProjectsW(obj){
//function insertProjectsW(obj){
//}
//}???????????????????????????????????????????????????????????????????????????什么时候添加的？？？？？？？？？？？？？
			if(result[0].STA < state)
			{
				var updatastr = {
					state: tmp,
					STA: state
				}; 
				changestate(searchstr,updatastr);
			}else{
				var updatastr = {
					state: tmp
				}; 
				changestate(searchstr,updatastr);
			}
			db.close();
		});
	});
}
app.get('/deliver',function(req,res){
	console.log('in deliver get req -> ',req.query);
	var sda = req.query.Sda.replace(/\-/g,'/');
	console.log('req.query.Sda-> ',req.query.Sda);
	sda = Date.parse(sda);
	console.log('sda-> ',sda);
	var eda = req.query.Eda.replace(/\-/g,'/');
	eda = Date.parse(eda);
	var searchstr = {
		num:req.query.HN + '-' + req.query.num,
		};
	if(req.query.id == '0'){
		var obj = {
			deliverdescrip: req.query.deliverdescrip,
			delivername: req.query.delivername,
			deliverid: req.query.deliverid,
		}
		var stateobj = {
			openId: req.query.deliverid,
			num:req.query.HN + '-' + req.query.num,
			state: '2',
		}
		updelivermsg(searchstr,obj);
		chgedstatefunc(stateobj);
		var projectobj = {
			HN: req.query.HN,
			DW: req.query.DW,
			num: req.query.num,
			Sda: sda,
			Eda: eda,
			flag: '1'
		}
		insertProjectsW(projectobj);
	}else{
		var obj = {
	//		deliverdescrip:req.query.deliverdescrip,
			delivername: req.query.delivername,
			deliverid: req.query.deliverid,
			flag: 'true'
		}
		var stateobj = {
			openId: req.query.deliverid,
			num: req.query.num,
			state: '3',
		}
		updelivermsg(searchstr,obj);
		chgedstatefunc(stateobj);
		var projectobj = {
			HN: req.query.HN,
			DW: req.query.DW,
			num: req.query.num,
			Sda: sda,
			Eda: eda,
			flag: '2'
		}
		insertProjectsW(projectobj);
	}
});

function updelivermsg(searchstr,state){
	console.log('提交描述问题：searchstr-> ',searchstr);
	console.log('state-> ',state);
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var findstr = searchstr;
		var modstr = {$set:state};
		var dbo = db.db("weapp");
		dbo.collection("xinzen").update(findstr,modstr);
		db.close();
	})
	
}

app.get('/rewrite',function(req,res){
	var item = req.query.item;
	var item_word = req.query.item_word;
	var state = '';
	if(item == 'name'){
		state = {name:item_word};
	}else if(item == 'bumen'){
		state = {bumen:item_word};
	}else if(item == 'id'){
		state = {id:item_word};
	}else if(item == 'danwei'){
		state = {danwei:item_word};
	}else if(item == 'tel'){
		state = {tel:item_word};
	}
	var openId = req.query.openId;
	var searchstr = {openId: openId};
	rewriteuser(searchstr,state);
});

function rewriteuser(searchstr,state){
	console.log('rewriteuser-> ', searchstr);
	console.log('state-> ',state);
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var findstr = searchstr;
		var modstr = {$set:state};
		var dbo = db.db("weapp");
		dbo.collection("users").update(findstr,modstr);
		db.close();
	})
}

function changestate(searchstr,state){
	console.log('提交描述： searchstr-> ',searchstr);
	console.log('提交描述：state-> ',state);
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var findstr = searchstr;
		var modstr = {$set:state};
		var dbo = db.db("weapp");
		dbo.collection("xinzen").update(findstr,modstr);
		db.close();
	})
	
}

app.get('/detaildeliver',function(req,res){
	console.log('in detaildeliver get req.query-> ', req.query);
	var searchstr = {num:req.query.num};
	var da = req.query.Da;
	var addrperson = req.query.Addrperson;
	var descr = req.query.Description;
	var aryap = req.query.AP;
	console.log('aryda-> ',aryap);
	aryap = aryap.split('["');
	aryap = aryap[1];
	aryap = aryap.split('"]');
	aryap = aryap[0];
	aryap = aryap.split('","');
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		dbo.collection("xinzen").find(searchstr).toArray(function(err,result){
			if(err) throw err;
			var descri = result[0].Description;
			var addr = result[0].Addrperson;
			var ap = result[0].AP;
			var state = result[0].state;
			var data = result[0].Da;
			var len = ap.length;
			descri[len] = descr;
			addr[len+1] = addrperson;
			ap[len] = aryap;
			data[len] = da;
			state[len+1] = '0';
			var addrstr = {
				desc: descri,
				addr: addr,
				ap: ap,
				state: state,
				date: data
			}
			console.log('addeliver-> ', addrstr);
			addeliver(searchstr,addrstr);
			db.close();
		});
	});
})

function addeliver(searchstr,state){
	console.log('searchstr-> ',searchstr);
	console.log('state-> ',state);
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var findstr = searchstr;
		var modstr = {$set:
			{
			 "AP":state.ap,
			 "Da":state.date,
			 "Addrperson":state.addr,
			 "state": state.state,
			 "Description": state.desc
			}
			};
		var dbo = db.db("weapp");
		dbo.collection("xinzen").update(findstr,modstr);
		db.close();
	})
	
}

app.get('/mywilldone',function(req,res){
	var restr = '';
	console.log('/mywilldone->CP ', req.query.CP);
	console.log('/mywilldone->HN ', req.query.HN);
	console.log('/mywilldone->flag ', req.query.flag);
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		if(req.query.HN != 'undefined')
		{
			console.log(' in error !undefined-> req.query ',req.query);
			var reg = new RegExp("(?:)"+req.query.CP+"(?:)",'g');
			var obj = {Addrperson: reg,HN:req.query.HN, flag: 'false'};
			dbo.collection("xinzen").find(obj).sort({_id:-1}).toArray(function(err,result){
				if(err) throw err;
				restr = result;
				//提取出对应用户的对应意见的状态
				var index = 0;
				while(index < result.length){
					var idx = 0;
					while(idx < result[index].Addrperson.length)
					{
						if(result[index].Addrperson[idx] == req.query.CP)
						{
							restr[index].state = result[index].state[idx];
							break;
						}
						++idx;
					}
					++index;
				}
				console.log('in error restr-> ',result);
				res.send(restr);
				db.close();
		});
		}else{
			console.log('undefined-> req.query ',req.query);
			var reg = new RegExp("(?:)"+req.query.CP+"(?:)",'g');
			var obj = {Addrperson: reg,flag:req.query.flag};
			dbo.collection("xinzen").find(obj).sort({_id:-1}).toArray(function(err,result){
				if(err) throw err;
				var tmp = result.Addrperson;
				console.log('tmp-> ', tmp);
				var index = 0;
				var idx = 0;
				restr = result;
				var index = 0;
				while(index < result.length){
					var idx = 0;
					while(idx < result[index].Addrperson.length)
					{
						if(result[index].Addrperson[idx] == req.query.CP)
						{
							restr[index].state = result[index].state[idx];
							break;
						}
						++idx;
					}
					++index;
				}
				console.log('mywilldone restr-> ', restr);
				res.send(restr);
				db.close();
			});
		}
	});
});

app.get('/mydone',function(req,res){
	var restr = '';
	console.log('/mydone--------------');
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		var reg = new RegExp("(?:)"+req.query.CP+"(?:)",'g');
		if(req.query.HN != 'undefined')
		{
			var obj = {Addrperson: reg,
				   HN: req.query.HN,
				  flag: 'true'
				};
			dbo.collection("xinzen").find(obj).sort({_id:-1}).toArray(function(err,result){
				if(err) throw err;
				restr = result;
				res.send(restr);
				db.close();
		});
		}else{
			var obj = {Addrperson:reg,
				   flag: 'true'
				 };
			console.log('/mydone----->obj: ',obj);
			dbo.collection("xinzen").find(obj).sort({_id:-1}).toArray(function(err,result){
				if(err) throw err;
				console.log('/mydone----->result: ',result);
				restr = result;
				res.send(restr);
				db.close();
		});
		}
	});
});

app.get('/willdonespecific',function(req,res){
	var path = './xinzenpictures/';
	var openId = req.query.openId;
	var timeId = req.query.timeId;
	var picturenum = req.query.picturenum;
	var flag = picturenum;
	var picnames = new Array('');
	var index = 0;
	let pro = new Promise(function(resolve,reject){
		var tmpnames = new Array('');
		while(picturenum > 0){		
		console.log('while->in');
			var picname = picturenum + timeId + openId;	
				let prm = new Promise(function(resolve,reject){
					process.exec('ls '+ path+picname+'*' ,function(err, result){
						if(err){
							console.log('没有要找的文件: ',path+picname);
						}
						var Length = result.length;
						console.log('result->', result.substring(0,Length-1));
						resolve(result.substring(0,Length-1));
					});
				});
				prm.then(function(onename){
					picnames[index] = onename;
					console.log('picturenum: ',picnames[index]);
					++index;
					if(index == flag)
					{
						resolve();
					}
				});
			--picturenum;
		};
	});
	pro.then(function(){
		console.log('picnames: ', picnames);
		res.send(picnames);
	},
	function(){
		console.log('pro失败');
	});
});

app.use('/xinzenpictures',express.static('xinzenpictures'));

app.get('/addrusers',function(req,res){
	var restr = '';
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		console.log('req-> ', req.query);
		var dbo = db.db("weapp");
		if(req.query.name != ''&& req.query.name != 'undefined')
		{
			var obj = {danwei: req.query.danwei,
				   name: req.query.name};
			dbo.collection("users").find(obj).toArray(function(err,result){
				if(err) throw err;
				restr = result;
				res.send(restr);
				db.close();
		});
		}else{
			var obj = {danwei: req.query.danwei};
			dbo.collection("users").find(obj).toArray(function(err,result){
				if(err) throw err;
				restr = result;
				res.send(restr);
				db.close();
		});
		}
	});
});

app.get('/jieguo',function(req,res){
	var reg = new RegExp("(?:)"+req.query.openId+"(?:)",'g');
	console.log('reg= ',reg);
	var obj = {openIds:reg};
	console.log('/jieguo-obj: ',obj);
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		dbo.collection("baoyan").find(obj).sort({_id:-1}).toArray(function(err,result){
			if(err) throw err;
			res.send(result);
			db.close();
		});
		
	})
});

app.get('/feedback',function(req,res){
	var obj = {
		backword: req.query.backword,
		flag: req.query.flag
	}
	var searchobj = {
		HN: req.query.HN,
		num: req.query.num,
		Ty: req.query.Ty
	}
	var insertobj = {$set:obj};
	MongoClient.connect(url,function(err,db){
		if(err) throw err;
		var dbo = db.db("weapp");
		dbo.collection("baoyan").update(searchobj,insertobj);
	});
})

app.get('/getuserpic',function(req,res){
	console.log('req.query.openIds: ',req.query.openIds);
	console.log('req.query.openIds[1]: ',req.query.openIds[1]);
	var querystr = JSON.stringify(req.query.openIds);
	querystr = querystr.split(',');
	var openIds = {};
	var index = 0;
	var restr = {};
	while(index < querystr.length)
	{
		var temp = '';
		temp = querystr[index].split(':');
		openIds[index] = temp[1].substring(2,temp[1].length-2);
		if(index === querystr.length-1)
		{
			openIds[index] = openIds[index].substring(0,openIds[index].length-2);
		}
		console.log('1');
		++index;
	}
		async.map(openIds,function(item,callback){
			MongoClient.connect(url,function(err,db){
				if(err) throw err;
				var dbo = db.db("weapp");
				var reg = new RegExp("(?:)"+item+"(?:)",'g');
				console.log('reg= ',reg);
				var obj = {session:reg};
				dbo.collection("sessions").find(obj).toArray(function(err,result){
					if(err) throw err;
					callback(null,result[0]);
				});
				db.close();
			});
		},function(err,results){
			console.log('results-> ',typeof(results[3]));
			var index = 0;
			while(index < results.length)
			{
				if(results[index] === undefined)
				{
					restr[index] = '0';
				}else{
					var tmp = results[index].session;
					tmp = JSON.stringify(tmp);
					tmp = tmp.split(':');
					tmp = tmp[12].substring(2,)+tmp[13].substring(0,tmp[13].length-16)
		//			results[index] = tmp;
					restr[index] = tmp
					console.log('results-sessioin -> ',restr[index]);
					
				}
				++index;
			}	
			res.send(restr);
		})
});
	
/////////////////////////////////////////////////////////////
// 独立出会话中间件给 express 和 ws 使用
const sessionMiddleware = waferSession({
    appId: config.appId,
    appSecret: config.appSecret,
    loginPath: '/login',
    store: new MongoStore({
     //  url: 'mongodb://${config.mongoUser}:${config.mongoPass}@${config.mongoHost}:${config.mongoPort}/${config.mongoDb}'
       url: 'mongodb://weapp:xhh123@127.0.0.1:27017/weapp'
   })
});
app.use(sessionMiddleware);

app.use('/me',(req,res,next) =>{
	console.log('访问了/me');
	res.json(req.session? req.session.userInfo : {noBody:true});
	if(req.session){
		console.log('Wafer session success with openId=${req.session.userInfo.openId}');
	}else{
		console.log('有人的session没有正确处理');
	}
});

app.use((req,res,next) =>{
	res.write('Response from express');
	res.end();
});



const server = http.createServer(app);
xhhwebsocket.listen(server,sessionMiddleware);
server.listen(config.serverPort);
