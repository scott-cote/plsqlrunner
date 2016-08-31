var koa = require('koa');
var path = require('path');
var url = require('url');
var http = require('http');
var https = require('https');
var app = koa();

var runApp = function() {
  var homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var configPath = path.join(homePath, '.plsqlrunner', 'config.json');
  config = require(configPath);
  app.listen(5150);
};

var isDbRequest = function(urlString) {
  return url.parse(urlString).pathname.startsWith(config.basePath);
};

var executeDbRequest = function() {
  var packagePath = url.parse(this.url).pathname.replace(config.basePath, '').split('.');
  if (packagePath.length < 3) packagePath.unshift(config.defaultSchema);
  this.body = 'executeDbRequest not implemented for '+packagePath.join('.');
};

var proxyAssetRequest = function() {
  return new Promise((resolve, reject) => {
    var protocol = config.secureHost ? https : http;
    var assetProtocol = config.secureHost ? 'https://' : 'http://';
    var assetUrl = assetProtocol+config.host+url.parse(this.url).path;
    protocol.get(assetUrl, (res) => {
      //console.log('statusCode:', res.statusCode);
      //console.log('headers:', res.headers);
      res.pipe(this.res);
      res.on('end', resolve);
    }).on('error', reject);
  });
};

app.use(function *() {
  if (isDbRequest(this.url)) {
    return executeDbRequest.call(this);
  } else {
    return proxyAssetRequest.call(this);
  }
});

runApp();
