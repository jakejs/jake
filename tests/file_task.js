var assert = require('assert')
  , fs = require('fs')
  , exec = require('child_process').exec
  , h = require('./helpers');

process.chdir('./tests');

var tests = new (function () {
  this.testConcatTwoFiles = function () {
    h.exec('../bin/cli.js fileTest:foo/concat.txt', function (out) {
      var data;
      assert.equal('fileTest:foo/src1.txt task\ndefault task\nfileTest:foo/src2.txt task\n' +
          'fileTest:foo/concat.txt task', out);
      // Check to see the two files got concat'd
      data = fs.readFileSync(process.cwd() + '/foo/concat.txt');
      assert.equal('src1src2', data.toString());
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


