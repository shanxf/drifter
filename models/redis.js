var redis = require('redis');
var settings = require('../settings');
var client = redis.createClient(settings.REDIS_PORT, settings.REDIS_HOST);
var client2 = redis.createClient(settings.REDIS_PORT, settings.REDIS_HOST);
var client3 = redis.createClient(settings.REDIS_PORT, settings.REDIS_HOST);

client.on("error", function (err) {  
  console.log("Error " + err);  
  return false;  
});  
client2.on("error", function (err) {  
  console.log("Error " + err);  
  return false;  
});
client3.on("error", function (err) {  
  console.log("Error " + err);  
  return false;  
});
//检查用户是否超出扔瓶次数限制
function checkPickTimes (user, callback) {
  //先到3号数据库检查用户是否超过捡瓶次数限制
  client3.SELECT(3, function () {
    // 获取该用户捡瓶次数
    client3.GET(user, function (err, result) {
      if (result >= 10) {
        return callback({
          code: 0,
          msg: '今天捡瓶子的机会已经用完了'
        });
      };
      //捡瓶次数++
      client3.INCR(user, function (err, ttl) {
        // 检查是否是当天第一次捡瓶子
        //若是，则设置记录该用户捡瓶次数键的生成周期为1天
        //若不是，生存期保持不变
        if (ttl ===-1) {
          client3.EXPIRE(user, 60*60*24);
        };
      });
    });
  });
}
//检查用户是否超过捡瓶次数限制
function checkThrowTimes (argument) {
  //先到2号数据库检查用户是否超过扔瓶次数限制
  client2.SELECT(2, function () {
    // 获取该用户扔瓶次数
    client2.GET(bottle.owner, function (err, result) {
      if (result >= 10) {
        return callback({
          code: 0,
          msg: '今天扔瓶子的机会已经用完了'
        });
      };
      //扔瓶子次数++
      client2.INCR(bottle.owner, function () {
        //检查是否是当天第一次扔瓶子
        //若是，则设置记录该用户仍瓶子次数键的生存期为1天
        //若不是，生存期保持不变
        client2.TTL(bottle.owner, function (err, ttl) {
          if (ttl === -1) {
            client2.EXPIRE(bottle.owner, 60*60*24);
          };
        });
      });
    });
  });
}
//扔一个瓶子
function throwOneBottle (bottle, callback) {
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
        callback({
          code: 1,
          msg: result
        });
      };
    });
  });
}
//捡一个瓶子
function pickOneBottle (info, callback) {
  var type = {
    all: Math.round(Math.random()),
    male: 0,
    female: 1
  };
  info.type = info.type || 'all';
  console.log("++++:"+info.type);
  //根据请求的瓶子类型到不同的数据库中取
  client.SELECT(type[info.type], function () {
    //随机返回漂流瓶id
    client.RANDOMKEY(function (err, bottleId) {
      if (!bottleId) {
        return callback({
          code: 0,
          msg: '海星'
        });
      };
      //根据漂流瓶ID取到漂流瓶网址信息
      client.HGETALL(bottleId, function (err, bottle) {
        if (err) {
          return callback({
            code: 0,
            msg: '漂流瓶破损了。。。'
          });
        };
        //返回结果，成功时包含捡到的漂流瓶信息
        callback({
          code: 1,
          msg: bottle
        });
        //从redis中删除该漂流瓶
        client.DEL(bottleId);
      });
    });
  });
}
//扔一个漂流瓶
exports.throw = function (bottle, callback) {
  checkThrowTimes(bottle.owner, function (result) {
    if (result.code ===0) {
      return callback(result);
    };
    throwOneBottle(bottle, function (result) {
      callback(result);
    });
  });
}
//捡一个漂流瓶
exports.pick = function (info, callback) {
  checkPickTimes(info.user, function (result) {
    if (result.code === 0) {
      return callback(result);
    };
  });
  
  var r = Math.random();
  console.log("......"+r);
  //20%概率捡到海星
  if (r <= 0.2) {
    return callback({
      code: 0,
      msg: '海星'
    });
  };
  console.log(">>>>>");
  pickOneBottle(info, function (result) {
    callback(result);
  });
};
//将打开的漂流瓶扔回海里
exports.throwBack = function (bottle, callback) {
  var type = {
    male: 0,
    female: 1
  };
  //为漂流瓶随机生成一个id
  var bottleId = Math.random().toString(16);
  //根据漂流瓶类型的不同将漂流瓶保存到不同的数据库中
  client.SELECT(type[bottle.type], function () {
    //以hash类型保持漂流瓶对象
    client.HMSET(bottleId, bottle, function (err, result) {
      if (err) {
        return callback({
          code: 0,
          msg: '过会再试试吧'
        });
      };
      //返回结果，成功时返回ok
      callback({
        code: 1,
        msg: result
      });
      //根据漂流瓶的原始时间戳设置生存周期
      client.PEXPIRE(bottleId, bottle.time + 1000*60*60*24-Date.now());
    });
  });
}
