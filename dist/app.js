var path = require('path');
var url = require('url');
var http = require('http');
var https = require('https');

var isDbRequest = function(urlString) {
  return url.parse(urlString).pathname.startsWith(config.basePath);
};

var executeDbRequest = function(request, response) {
  return new Promise((resolve, reject) => {
    var packagePath = url.parse(request.url).pathname.replace(config.basePath, '').split('.');
    if (packagePath.length < 3) packagePath.unshift(config.defaultSchema);
    response.end('executeDbRequest not implemented for '+packagePath.join('.'));
    resolve();
  });
};

var buildRequestHeaders = function(headers) {
	var newHeaders = {};
	Object.keys(headers).forEach((key) => {
		if (!['host','connection','referer'].find(element => key === element)) {
			newHeaders[key] = headers[key];
		}
	});
	newHeaders.host = config.host;
	if (headers.referer) {
		var protocol = config.secureHost ? 'https://' : 'http://';
		newHeaders.referer = protocol+config.host+url.parse(headers.referer).path;
	}
	return newHeaders;
};

var buildResponseHeaders = function(headers) {
	var newHeaders = {};
	Object.keys(headers).forEach((key) => {
		if (![].find(element => key === element)) {
			newHeaders[key] = headers[key];
		}
	});
	return newHeaders;
};

var proxyAssetRequest = function(request, response) {
  return new Promise((resolve, reject) => {
    var protocol = config.secureHost ? https : http;
    protocol.request({
      host: config.host,
      path: url.parse(request.url).path,
      headers: buildRequestHeaders(request.headers)
    }, (res) => {
      response.statusCode = res.statusCode;
      var responseHeaders = buildResponseHeaders(res.headers);
      Object.keys(responseHeaders).forEach((key) => {
        response.setHeader(key, responseHeaders[key]);
      });
      res.on('end', resolve).on('error', reject).pipe(response);
    }).on('error', reject).end();
  });
};

var handleRequest = function(request, response) {
  if (isDbRequest(request.url)) {
    executeDbRequest(request, response)
      .catch((e) => console.log('Execute DB error: '+e));
  } else {
    proxyAssetRequest(request, response)
      .catch((e) => console.log('Proxy asset error: '+e));
  }
};

(function() {
  var homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var configPath = path.join(homePath, '.plsqlrunner', 'config.json');
  config = require(configPath);
  http.createServer(handleRequest).listen(5150, function() {
    console.log("PLSQLRunner listening on: http://localhost:5150");
  });
})();
