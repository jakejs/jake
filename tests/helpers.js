var exec = require('child_process').exec;

var helpers = new (function () {
  this.exec = function (cmd, callback) {
    exec(cmd, function (err, stdout, stderr) {
      var out = helpers.trim(stdout);
      if (err) {
        throw err;
      }
      if (stderr) {
        callback(stderr);
      }
      else if (out) {
        callback(out);
      }
    });
  };

  this.trim = function (s) {
    var str = s || '';
    return str.replace(/^\s*|\s*$/g, '');
  };

  this.parse = function (s) {
    var str = s || '';
    str = helpers.trim(str);
    str = str.replace(/'/g, '"');
    return JSON.parse(str);
  };

})();

module.exports = helpers;
