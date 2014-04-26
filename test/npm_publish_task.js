
var assert = require('assert')
  , h = require('./helpers');

var tests = {

  'before': function () {
    process.chdir('./test');
  }

, 'after': function () {
    process.chdir('../');
  }

, 'test default task': function (next) {
    h.exec('../bin/cli.js  -f Jakefile.publish publish', function (out) {
    });
  }

};

module.exports = tests;


