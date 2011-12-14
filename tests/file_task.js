var assert = require('assert')
  , fs = require('fs')
  , exec = require('child_process').exec
  , h = require('./helpers');

process.chdir('./tests');

var tests = new (function () {
  this.testConcatTwoFiles = function () {
    h.exec('../bin/cli.js foo/concat.txt', function (out) {
      var data;
      assert.equal('default task\nfoo/src2.txt task\n' +
          'foo/concat.txt task\nfoo/src1.txt task', out);
      data = fs.readFileSync(process.cwd() + '/foo/concat.txt');
      exec('rm -fr ./foo', function (err, stdout, stderr) {
        if (err) { throw err }
        if (stderr || stdout) {
          console.log (stderr || stdout);
        }
        h.next();
      });
    });
  };

})();

h.run(tests, function () {
  process.chdir('../');
});


