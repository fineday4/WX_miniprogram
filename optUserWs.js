var seedrandom = require('seedrandom');
var promise = require('Promise');

	
	function getIndex(str)
	{
	  var rng = seedrandom(str);
	  var index = Math.ceil(rng()*1000);
	  return index;
	}
module.exports = getIndex;
