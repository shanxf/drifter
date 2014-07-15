var request = require('../node_modules/request');
/*request 请求限制5次，两个for分别执行*/
/*
for (var j = 1; j <= 5; j++) {
  (function (j) {
    request.post({
      url: "http://127.0.0.1:3000",
      json: {
        "owner": "bottle" +j,
        "type": "male",
        "content": "content" +j
      }
    });
  })(j);
}
*/
for (var i = 6; i <= 10; i++) {
  (function (i) {
  	request.post({
      url: "http://127.0.0.1:3000",
      json: {
        "owner": "bottle" +i,
        "type": "female",
        "content": "content" +i
      }
    }); 
  })(i);
}

