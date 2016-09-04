
module.exports = function(info) {

  return function() {
    return this.proxyRequest(this.request, this.response); 
  };
};
