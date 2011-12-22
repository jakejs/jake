var assert = require('assert')
  , fs = require('fs')
  , exec = require('child_process').exec
  , h = require('./helpers');

process.chdir('./tests');

var cleanUpAndNext = function () {
  exec('rm -fr ./foo', function (err, stdout, stderr) {
    if (err) { throw err }
    if (stderr || stdout) {
      console.log (stderr || stdout);
    }
    h.next();
  });
};

var tests = new (function () {
  this.testConcatTwoFiles = function () {
    h.exec('../bin/cli.js fileTest:foo/concat.txt', function (out) {
      var data;
      assert.equal('fileTest:foo/src1.txt task\ndefault task\nfileTest:foo/src2.txt task\n' +
          'fileTest:foo/concat.txt task', out);
      // Check to see the two files got concat'd
      data = fs.readFileSync(process.cwd() + '/foo/concat.txt');
      assert.equal('src1src2', data.toString());
      cleanUpAndNext();
    });
  };

  this.testNoPrereqChange = function () {
    h.exec('../bin/cli.js fileTest:foo/from-src1.txt', function (out) {
      assert.equal('fileTest:foo/src1.txt task\nfileTest:foo/from-src1.txt task',
        out);
      h.exec('../bin/cli.js fileTest:foo/from-src1.txt', function (out) {
        // Second time should be a no-op
        assert.equal('', out);
        cleanUpAndNext();
      });
    });
  };

})();

h.run(tests, function () {
  process.chdir('../');
});


