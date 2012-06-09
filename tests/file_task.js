var assert = require('assert')
  , fs = require('fs')
  , path = require('path')
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

var tests = {

  'test concating two files': function () {
    h.exec('../bin/cli.js fileTest:foo/concat.txt', function (out) {
      var data;
      assert.equal('fileTest:foo/src1.txt task\ndefault task\nfileTest:foo/src2.txt task\n' +
          'fileTest:foo/concat.txt task', out);
      // Check to see the two files got concat'd
      data = fs.readFileSync(process.cwd() + '/foo/concat.txt');
      assert.equal('src1src2', data.toString());
      cleanUpAndNext();
    });
  }

, 'test where a file-task prereq does not change': function () {
    h.exec('../bin/cli.js fileTest:foo/from-src1.txt', function (out) {
      assert.equal('fileTest:foo/src1.txt task\nfileTest:foo/from-src1.txt task', out);
      h.exec('../bin/cli.js fileTest:foo/from-src1.txt', function (out) {
        // Second time should be a no-op
        assert.equal('', out);
        cleanUpAndNext();
      });
    });
  }

, 'test where a file-task prereq does not change with --always-make': function () {
    h.exec('../bin/cli.js fileTest:foo/from-src1.txt', function (out) {
      assert.equal('fileTest:foo/src1.txt task\nfileTest:foo/from-src1.txt task',
        out);
      h.exec('../bin/cli.js -B fileTest:foo/from-src1.txt', function (out) {
        assert.equal('fileTest:foo/src1.txt task\nfileTest:foo/from-src1.txt task',
          out);
        cleanUpAndNext();
      });
    });
  }

, 'test a preexisting file': function () {
    var prereqData = 'howdy';
    h.exec('mkdir -p foo', function (out) {
      fs.writeFileSync('foo/prereq.txt', prereqData);
      h.exec('../bin/cli.js fileTest:foo/from-prereq.txt', function (out) {
        var data;
        assert.equal('fileTest:foo/from-prereq.txt task', out);
        data = fs.readFileSync(process.cwd() + '/foo/from-prereq.txt');
        assert.equal(prereqData, data.toString());
        h.exec('../bin/cli.js fileTest:foo/from-prereq.txt', function (out) {
          // Second time should be a no-op
          assert.equal('', out);
          cleanUpAndNext();
        });
      });
    });
  }

, 'test a preexisting file with --always-make flag': function () {
    var prereqData = 'howdy';
    h.exec('mkdir -p foo', function (out) {
      fs.writeFileSync('foo/prereq.txt', prereqData);
      h.exec('../bin/cli.js fileTest:foo/from-prereq.txt', function (out) {
        var data;
        assert.equal('fileTest:foo/from-prereq.txt task', out);
        data = fs.readFileSync(process.cwd() + '/foo/from-prereq.txt');
        assert.equal(prereqData, data.toString());
        h.exec('../bin/cli.js -B fileTest:foo/from-prereq.txt', function (out) {
          assert.equal('fileTest:foo/from-prereq.txt task', out);
          cleanUpAndNext();
        });
      });
    });
  }

, 'test nested directory-task': function () {
    h.exec('../bin/cli.js fileTest:foo/bar/baz/bamf.txt', function (out) {
      data = fs.readFileSync(process.cwd() + '/foo/bar/baz/bamf.txt');
      assert.equal('w00t', data);
      cleanUpAndNext();
    });
  }

};

h.run(tests, function () {
  process.chdir('../');
});


