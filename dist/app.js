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
  newHeaders.host = profile.host;
  if (headers.referer) {
    var protocol = profile.secureHost ? 'https://' : 'http://';
    newHeaders.referer = protocol+profile.host+url.parse(headers.referer).path;
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
    var protocol = profile.secureHost ? https : http;
    protocol.request({
      host: profile.host,
      path: url.parse(request.url).path,
      headers: buildRequestHeaders(request.headers)
    }, (serverResponse) => {
      serverResponse.on('end', resolve).on('error', reject);
      proxyCallback(request, response, serverResponse)
    }).on('error', reject).end();
  });
};

var pluginMatcher = function(request) {
  return function(plugin) {
    return false;
  };
}

var handleRequest = function(request, response) {
  var plugin = plugins.find(pluginMatcher(request)) || defaultPlugin;
  plugin.handleRequest(request, response)
    .catch((e) => console.log('Error: '+e));
};

(function() {
  var homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var configPath = path.join(homePath, '.plsqlrunner', 'config.json');
  config = require(configPath);
  profile = config.profiles[0];
  plugins = profile.plugins || [];
  defaultPlugin = {
    handleRequest: proxyAssetRequest
  };
  http.createServer(handleRequest).listen(5150, function() {
    console.log("PLSQLRunner listening on: http://localhost:5150");
  });
})();
