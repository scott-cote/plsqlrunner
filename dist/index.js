
module.exports = function(info) {

  info.matchFunction = function(request) {
    return false;
  };

  info.handleRequest = function() {
    throw "PLSQLRUNNER not implemented.";
  };

  return info;
};
