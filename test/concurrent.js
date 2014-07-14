var assert = require('assert')
  , h = require('./helpers');

var tests = {

  'before': function () {
    process.chdir('./test');
  }

, 'after': function () {
    process.chdir('../');
  }

, 'test simple concurrent task 1': function (next) {
    h.exec('../bin/cli.js concurrent:simple1', function (out) {
      assert.equal('Started A\nStarted B\nFinished B\nFinished A', out);
      next();
    });
  }
, 'test simple concurrent task 2': function (next) {
    h.exec('../bin/cli.js concurrent:simple2', function (out) {
      assert.equal('Started C\nStarted D\nFinished C\nFinished D', out);
      next();
    });
  }
, 'test sequential concurrent tasks': function (next) {
    h.exec('../bin/cli.js concurrent:seqconcurrent', function (out) {
      assert.equal('Started A\nStarted B\nFinished B\nFinished A\nStarted C\nStarted D\nFinished C\nFinished D', out);
      next();
    });
  }
, 'test concurrent concurrent tasks': function (next) {
    h.exec('../bin/cli.js concurrent:concurrentconcurrent', function (out) {
      assert.equal('Started A\nStarted B\nStarted C\nStarted D\nFinished B\nFinished C\nFinished A\nFinished D', out);
      next();
    });
  }
, 'test concurrent task with subdependency': function (next) {
    h.exec('../bin/cli.js concurrent:subdep', function (out) {
      assert.equal('Started A\nFinished A\nStarted Ba\nFinished Ba', out);
      next();
    });
  }
, 'test failing in concurrent tasks': function (next) {
    h.exec('../bin/cli.js concurrent:Cfail', {breakOnError:false},function (out) {
      assert.equal(1, out.code);
      next();
    });
  }
}
module.exports = tests;

