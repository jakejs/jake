var exec = require('child_process').exec;

var helpers = new (function () {
  var _tests
    , _names = []
    , _name
    , _callback
    , _runner = function () {
        if (!!(_name = _names.shift())) {
          console.log('Running ' + _name);
          _tests[_name]();
        }
        else {
          _callback();
        }
      };

  this.exec = function (cmd, callback) {
    cmd += ' --trace';
    exec(cmd, function (err, stdout, stderr) {
      var out = helpers.trim(stdout);
      if (err) {
        throw err;
      }
      if (stderr) {
        callback(stderr);
      }
      else {
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

  this.run = function (tests, callback) {
    _tests = tests;
    _names = Object.keys(tests);
    _callback = callback;
    _runner();
  };

  this.next = function () {
    _runner();
  };

})();

module.exports = helpers;
