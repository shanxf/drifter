var express = require('express');
var redis = require('./module/redis.js');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongodb = require('./models/mongodb');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//扔一个漂流瓶
//POST owner=***&type=***&content=***[&time=***]
app.post('/', function (req, res) {
  if (!(req.body.owner && req.body.type && req.body.content)) {
    return res.json({
      code: 0,
      msg: "信息不完整"
    });
    redis.throw(req.body, function (result) {
      res.json(result);
    });
  };
});
//捡一个漂流瓶
//GET /?user=***[type=***]
app.get('/', function (req, res) {
  if (!req.query.user) {
    return req.json({
      code:0,
      msg: '信息不完整'
    });
  };
  redis.pick(req.query, function (result) {
    res.json(result);
    if (result.code === 1) {
      mongodb.save(req.query.user, result.msg);
    };
  });
});
//将捡到的漂流瓶扔到海里
app.post('/back', function (req, res) {
  redis.throwBack(req.body, function (result) {
    res.json(result);
  });
});

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
