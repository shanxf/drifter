var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/drifter');

//定义漂流瓶模型，并设置数据存储到bottles集合
var bottleModel = mongoose.model('Bottle', new mongoose.schema({
  bottle: Array,
  message: Array
}, {
  collection: 'bottles'
}));
//将用户捡到的漂流瓶改变格式保持
exports.save = function (picker, _bottle) {
  var bottle = {
    bottle: [],
    message: []
  };
  bottle.bottle.push(picker);
  bottle.message.push([
    _bottle.owner,
    _bottle.time,
    _bottle.content
  ]);
  bottle = new bottleModel(bottle);
  bottle.save();
}