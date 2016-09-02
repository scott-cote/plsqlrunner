var fs = require('fs');
var path = require('path');
var url = require('url');
var http = require('http');
var https = require('https');

var buildRequestHeaders = function(headers) {
  var newHeaders = {};
  Object.keys(headers).forEach((key) => {
    if (!['host','connection','referer'].find(element => key === element)) {
      newHeaders[key] = headers[key];
    }
  });
  newHeaders.host = config.profiles[0].host;
  if (headers.referer) {
    var protocol = config.profiles[0].secureHost ? 'https://' : 'http://';
    newHeaders.referer = protocol+config.profiles[0].host+url.parse(headers.referer).path;
  }
  return newHeaders;
};

var proxyCallback = function(request, response, serverResponse) {
  response.statusCode = serverResponse.statusCode;
  Object.keys(serverResponse.headers).forEach((key) => {
    if (!['connection'].find(element => key === element)) {
      response.setHeader(key, serverResponse.headers[key]);
    }
  });
  serverResponse.pipe(response);
};

var replaceBodyCallback = function(request, response, serverResponse) {
  response.statusCode = serverResponse.statusCode;
  Object.keys(serverResponse.headers).forEach((key) => {
    if (!['connection','content-encoding','transfer-encoding'].find(element => key === element)) {
      response.setHeader(key, serverResponse.headers[key]);
    }
  });
  var readStream = fs.createReadStream('index.html');
  readStream.pipe(response);
};

var proxyAssetRequest = function(request, response) {
  return new Promise((resolve, reject) => {
    var protocol = config.profiles[0].secureHost ? https : http;
    protocol.request({
      host: config.profiles[0].host,
      path: url.parse(request.url).path,
      headers: buildRequestHeaders(request.headers)
    }, (serverResponse) => {
      serverResponse.on('end', resolve).on('error', reject);
      proxyCallback(request, response, serverResponse)
    }).on('error', reject).end();
  });
};

var handleRequest = function(request, response) {
  proxyAssetRequest(request, response)
    .catch((e) => console.log('Proxy asset error: '+e));
};

(function() {
  var homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var configPath = path.join(homePath, '.plsqlrunner', 'config.json');
  config = require(configPath);
  http.createServer(handleRequest).listen(5150, function() {
    console.log("PLSQLRunner listening on: http://localhost:5150");
  });
})();
