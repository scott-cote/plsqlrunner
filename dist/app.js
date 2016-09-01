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

var proxyAssetRequest = function(request, response) {
  return new Promise((resolve, reject) => {
    var protocol = config.secureHost ? https : http;
    var assetProtocol = config.secureHost ? 'https://' : 'http://';
    var assetUrl = assetProtocol+config.host+url.parse(request.url).path;
    protocol.get(assetUrl, (res) => {
      //console.log('statusCode:', res.statusCode);
      //console.log('headers:', res.headers);
      res.on('end', resolve).on('error', reject).pipe(response);
    }).on('error', reject);
  });
};

(function() {
  var homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var configPath = path.join(homePath, '.plsqlrunner', 'config.json');
  config = require(configPath);

  var handler = function(request, response) {
    if (isDbRequest(request.url)) {
      executeDbRequest(request, response)
        .catch((e) => console.log('Execute DB error: '+e));
    } else {
      proxyAssetRequest(request, response)
        .catch((e) => console.log('Proxy asset error: '+e));
    }
  };

  http.createServer(handler).listen(5150, function() {
    console.log("PLSQLRunner listening on: http://localhost:5150");
  });

})();
