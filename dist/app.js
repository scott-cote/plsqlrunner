var koa = require('koa');
var path = require('path');
var url = require('url');
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
  var assetProtocol = config.secureHost ? 'https://' : 'http://';
  var assetUrl = assetProtocol+config.host+url.parse(this.url).path;
  this.body = 'proxyAssetRequest not implemented for '+assetUrl;
};

app.use(function *() {
  if (isDbRequest(this.url)) {
    return executeDbRequest.call(this);
  } else {
    return proxyAssetRequest.call(this);
  }
});

runApp();
