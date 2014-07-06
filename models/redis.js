var redis = require('redis');
var client = redis.createClient();

//扔一个漂流瓶
exports.throw = function (bottle, callback) {
  bottle.time = bottle.time || Date.now();
  //为每一个漂流瓶随机生成一个id
  var bottleId = Math.random().toString(16);
  var type = {
    male: 0,
    female: 1
  };
  //根据漂流瓶类型的不同将漂流瓶保持到不同的数据库中
  client.SELECT(type[bottle.type], function () {
  	//以hash类型保存漂流瓶对象
  	client.HMSET(bottleId, bottle, function (err, result) {
  	  if (err) {
  	    return callback({
  	      code: 0,
  	      msg: '过会再试吧'
  	    });
  	    //返回结果，成功返回ok
  	    callback({
  	      code: 1,
  	      msg: result
  	    });
  	    //设置漂流瓶生存期为1天
  	    client.EXPIRE(bottleId, 60*60*24);
  	  };
  	});
  });
}
