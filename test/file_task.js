let assert = require('assert');
let fs = require('fs');
let exec = require('child_process').execSync;
let utils = require('utilities');

let cleanUp = function () {
  utils.file.rmRf('./foo', {
    silent: true
  });
};

suite('fileTask', function () {

  setup(function () {
    process.chdir('./test');
    cleanUp();
  });

  teardown(function () {
    process.chdir('../');
  });

  test('concating two files', function () {
    let out = exec('../bin/cli.js -q fileTest:foo/concat.txt').toString().trim();
    assert.equal('fileTest:foo/src1.txt task\ndefault task\nfileTest:foo/src2.txt task\n' +
        'fileTest:foo/concat.txt task', out);
    // Check to see the two files got concat'd
    let data = fs.readFileSync(process.cwd() + '/foo/concat.txt');
    assert.equal('src1src2', data.toString());
    cleanUp();
  });

  /*
 'test where a file-task prereq does not change': function (next) {
    h.exec('../bin/cli.js -q fileTest:foo/from-src1.txt', function (out) {
      assert.equal('fileTest:foo/src1.txt task\nfileTest:foo/from-src1.txt task', out);
      h.exec('../bin/cli.js -q fileTest:foo/from-src1.txt', function (out) {
        // Second time should be a no-op
        assert.equal('', out);
        next(); // Don't clean up
      });
    });
  },

 'file-task where prereq file is modified': function (next) {
    setTimeout(function () {
      fs.writeFile('./foo/src1.txt', '', function (err, data) {
        if (err) {
          throw err;
        }
        h.exec('../bin/cli.js -q fileTest:foo/from-src1.txt', function (out) {
          assert.equal('fileTest:foo/from-src1.txt task', out);
          cleanUp(next);
        });
      });
    }, 1000); // Wait to do the mod to ensure mod-time is different
  },

 'test where a file-task prereq does not change with --always-make': function (next) {
    h.exec('../bin/cli.js -q fileTest:foo/from-src1.txt', function (out) {
      assert.equal('fileTest:foo/src1.txt task\nfileTest:foo/from-src1.txt task',
        out);
      h.exec('../bin/cli.js -q -B fileTest:foo/from-src1.txt', function (out) {
        assert.equal('fileTest:foo/src1.txt task\nfileTest:foo/from-src1.txt task',
          out);
        cleanUp(next);
      });
    });
  },

 'test a preexisting file': function (next) {
    let prereqData = 'howdy';
    utils.file.mkdirP('foo');
    fs.writeFileSync('foo/prereq.txt', prereqData);
    h.exec('../bin/cli.js -q fileTest:foo/from-prereq.txt', function (out) {
      let data;
      assert.equal('fileTest:foo/from-prereq.txt task', out);
      data = fs.readFileSync(process.cwd() + '/foo/from-prereq.txt');
      assert.equal(prereqData, data.toString());
      h.exec('../bin/cli.js -q fileTest:foo/from-prereq.txt', function (out) {
        // Second time should be a no-op
        assert.equal('', out);
        cleanUp(next);
      });
    });
  },
  */

  test('a preexisting file with --always-make flag', function () {
    let prereqData = 'howdy';
    utils.file.mkdirP('foo');
    fs.writeFileSync('foo/prereq.txt', prereqData);
    let out;
    out = exec('../bin/cli.js -q fileTest:foo/from-prereq.txt').toString().trim();
    assert.equal('fileTest:foo/from-prereq.txt task', out);
    let data = fs.readFileSync(process.cwd() + '/foo/from-prereq.txt');
    assert.equal(prereqData, data.toString());
    out = exec('../bin/cli.js -q -B fileTest:foo/from-prereq.txt').toString().trim();
    assert.equal('fileTest:foo/from-prereq.txt task', out);
    cleanUp();
  });

  test('nested directory-task', function () {
    let out = exec('../bin/cli.js -q fileTest:foo/bar/baz/bamf.txt').toString().trim();
    let data = fs.readFileSync(process.cwd() + '/foo/bar/baz/bamf.txt');
    assert.equal('w00t', data);
    cleanUp();
  });

});

