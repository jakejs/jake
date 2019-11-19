var assert = require('assert');
var h = require('./helpers');

var tests = {

  'before': function () {
    process.chdir('./test');
  },

  'after': function () {
    process.chdir('../');
  },

  'test simple concurrent prerequisites 1': function (next) {
    h.exec('../bin/cli.js -q concurrent:simple1', function (out) {
      assert.equal('Started A\nStarted B\nFinished B\nFinished A', out);
      next();
    });
  },
  'test simple concurrent prerequisites 2': function (next) {
    h.exec('../bin/cli.js -q concurrent:simple2', function (out) {
      assert.equal('Started C\nStarted D\nFinished C\nFinished D', out);
      next();
    });
  },
  'test sequential concurrent prerequisites': function (next) {
    h.exec('../bin/cli.js -q concurrent:seqconcurrent', function (out) {
      assert.equal('Started A\nStarted B\nFinished B\nFinished A\nStarted C\nStarted D\nFinished C\nFinished D', out);
      next();
    });
  },
  'test concurrent concurrent prerequisites': function (next) {
    h.exec('../bin/cli.js -q concurrent:concurrentconcurrent', function (out) {
      assert.equal('Started A\nStarted B\nStarted C\nStarted D\nFinished B\nFinished C\nFinished A\nFinished D', out);
      next();
    });
  },
  'test concurrent prerequisites with subdependency': function (next) {
    h.exec('../bin/cli.js -q concurrent:subdep', function (out) {
      assert.equal('Started A\nFinished A\nStarted Ba\nFinished Ba', out);
      next();
    });
  },
  'test failing in concurrent prerequisites': function (next) {
    h.exec('../bin/cli.js -q concurrent:Cfail', {breakOnError:false}, function (out) {
      assert.equal(1, out.code);
      next();
    });
  }
}
module.exports = tests;

