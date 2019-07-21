var seedrandom = require('seedrandom');

openId = '139'
var pri = {};
pri[openId] = '245632452345'
var rng = seedrandom(openId);
var res = Math.ceil(rng()*1000);
console.log(pri[openId]);
