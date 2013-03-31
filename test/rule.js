var assert = require('assert')
  , fs = require('fs')
  , path = require('path')
  , exec = require('child_process').exec
  , h = require('./helpers');

var cleanUpAndNext = function (callback) {
  exec('rm -fr ./rule', function (err, stdout, stderr) {
    if (err) { throw err }
    if (stderr || stdout) {
      console.log (stderr || stdout);
    }
    callback();
  });
};

var tests = {

  'before': function () {
    process.chdir('./test');
  }

, 'after': function () {
    process.chdir('../');
  }

, 'test concating two files': function (next) {
    h.exec('../bin/cli.js ruleTest:rule/concat.txt', function (out) {
      var data;
      assert.equal('fileTest:foo/src1.txt task\ndefault task\nfileTest:foo/src2.txt task\n' +
          'fileTest:foo/concat.txt task', out);
      // Check to see the two files got concat'd
      data = fs.readFileSync(process.cwd() + '/foo/concat.txt');
      assert.equal('src1src2', data.toString());
      cleanUpAndNext(next);
    });
  }
};

module.exports = tests;

