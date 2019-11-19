let assert = require('assert');
let fs = require('fs');
let h = require('./helpers');
let exec = require('child_process').exec;
let execSync = require('child_process').execSync;
let Matcher = require('../lib/rule').Matcher;
let utils = require('utilities');

let cleanUpAndNext = function (callback) {
  // Gotta add globbing to file utils rmRf
  let tmpFiles = [
    'tmp'
    , 'tmp_ns'
    , 'tmp_cr'
    , 'tmp_p'
    , 'tmp_pf'
    , 'tmpbin'
    , 'tmpsrc'
    , 'tmp_dep1.c'
    , 'tmp_dep1.o'
    , 'tmp_dep1.oo'
    , 'tmp_dep2.c'
    , 'tmp_dep2.o'
    , 'tmp_dep2.oo'
    , 'foo'
    , 'foo.html'
  ];
  tmpFiles.forEach(function (f) {
    utils.file.rmRf(f, {
      silent: true
    });
  });
  callback();
};

suite('rule', function () {

  setup(function (next) {
    console.log('changing');
    process.chdir('./test');
    cleanUpAndNext(next);
  });

  teardown(function () {
    process.chdir('../');
  });

  //  - name   foo:bin/main.o
  //  - pattern    bin/%.o
  //  - source    src/%.c
  //
  // return {
  //    'dep' : 'foo:src/main.c',
  //    'file': 'src/main.c'
  //  };
  test(' Matcher.getSource', function () {
    let src = Matcher.getSource('foo:bin/main.o', 'bin/%.o', 'src/%.c');
    assert.equal('foo:src/main.c', src);
  });

  test(' rule w/o pattern', function (next) {
    exec( '../bin/cli.js -q -f Jakefile.rule tmp', function (err, out) {
      if (err) {
        throw err;
      }
      let output = [
        "tmp_dep2.c task"
        , "tmp_dep1.c task"
        , "cp tmp_dep1.c tmp_dep1.o task"
        , "cp tmp_dep2.c tmp_dep2.o task"
        , "tmp task"
        , ""
        ];
      let data;
      assert.equal( output.join('\n'), out);
      data = fs.readFileSync(process.cwd() + '/tmp');
      assert.equal('src_1src_2', data.toString());
      cleanUpAndNext(next);
    });
  });

  test(' rule w pattern w/o folder w/o namespace', function (next) {
    exec( '../bin/cli.js  -q -f Jakefile.rule tmp_p', function (err, out) {
      if (err) {
        throw err;
      }
      let output = [
        "tmp_dep2.c task"
        , "tmp_dep1.c task"
        , "cp tmp_dep1.c tmp_dep1.oo task"
        , "cp tmp_dep2.c tmp_dep2.oo task"
        , "tmp pattern task"
        , ""
        ];
      let data;
      assert.equal( output.join('\n'), out);
      data = fs.readFileSync(process.cwd() + '/tmp_p');
      assert.equal('src_1src_2 pattern', data.toString());
      cleanUpAndNext(next);
    });
  });

  test(' rule w pattern w folder w/o namespace', function (next) {
    exec( '../bin/cli.js  -q -f Jakefile.rule tmp_pf', function (err, out) {
      if (err) {
        throw err;
      }
      let output = [
        "tmpsrc/tmp_dep1.c task"
        , "cp tmpsrc/tmp_dep1.c tmpbin/tmp_dep1.oo task"
        , "tmpsrc/tmp_dep2.c task"
        , "cp tmpsrc/tmp_dep2.c tmpbin/tmp_dep2.oo task"
        , "tmp pattern folder task"
        , ""
        ];
      let data;
      assert.equal( output.join('\n'), out);
      data = fs.readFileSync(process.cwd() + '/tmp_pf');
      assert.equal('src/src_1src/src_2 pattern folder', data.toString());
      cleanUpAndNext(next);
    });
  });

  test(' rule w pattern w folder w namespace', function (next) {
    exec( '../bin/cli.js -q  -f Jakefile.rule tmp_ns', function (err, out) {
      if (err) {
        throw err;
      }
      let output = [
        "tmpsrc/file2.c init task"
        , "tmpsrc/tmp_dep2.c task"
        , "cp tmpsrc/tmp_dep2.c tmpbin/tmp_dep2.oo task"
        , "tmpsrc/dep1.c task"
        , "cp tmpsrc/dep1.c tmpbin/dep1.oo ns task"
        , "cp tmpsrc/file2.c tmpbin/file2.oo ns task"
        , "tmp pattern folder namespace task"
        , ""
        ];
      let data;
      assert.equal( output.join('\n'), out);
      data = fs.readFileSync(process.cwd() + '/tmp_ns');
      assert.equal('src/src_1src/src_2src/src_3 pattern folder namespace', data.toString());
      cleanUpAndNext(next);
    });
  });


  test(' rule w chain w pattern w folder w namespace', function (next) {
    exec( '../bin/cli.js -q  -f Jakefile.rule tmp_cr', function (err, out) {
      if (err) {
        throw err;
      }
      let output = [
        "chainrule init task"
        , "cp tmpsrc/file1.tex tmpbin/file1.dvi tex->dvi task"
        , "cp tmpbin/file1.dvi tmpbin/file1.pdf dvi->pdf task"
        , "cp tmpsrc/file2.tex tmpbin/file2.dvi tex->dvi task"
        , "cp tmpbin/file2.dvi tmpbin/file2.pdf dvi->pdf task"
        , "tmp chainrule namespace task"
        , ""
        ];
      let data;
      assert.equal( output.join('\n'), out);
      data = fs.readFileSync(process.cwd() + '/tmp_cr');
      assert.equal('tex1 tex2  chainrule namespace', data.toString());
      cleanUpAndNext(next);
    });
  });

  ['precedence', 'regexPattern', 'sourceFunction'].forEach(function (key) {

    test(' rule with source file not created yet (' + key  + ')', function (next) {
      utils.file.rmRf('foo.txt', {silent: true});
      utils.file.rmRf('foo.html', {silent: true});
      exec('../bin/cli.js -f Jakefile.rule ' + key + ':test', function (err, out) {
        // foo.txt prereq doesn't exist yet
        if (err) {
          assert.ok(err.message.indexOf('Unknown task "foo.html"') > -1);
          next();
        }
        else {
          throw new Error('task not erroring is an error');
        }
      });
    });

    test(' rule with source file created (' + key  + ')', function (next) {
      fs.writeFileSync('foo.txt', '');
      exec('../bin/cli.js -q -f Jakefile.rule ' + key + ':test', function (err, out) {
        if (err) {
          throw err;
        }
        // Should run prereq and test task
        let output = [
          'created html',
          'ran test',
          ''
        ];
        assert.equal(output.join('\n'), out);
        next();
      });
    });

    test(' rule with source file modified (' + key  + ')', function (next) {
      setTimeout(function () {
        fs.writeFile('foo.txt', '', function (err, data) {
          if (err) {
            throw err;
          }
          exec('../bin/cli.js -q -f Jakefile.rule ' + key + ':test', function (err, out) {
            if (err) {
              throw err;
            }
            // Should again run both prereq and test task
            let output = [
              'created html',
              'ran test',
              ''
            ];
            assert.equal(output.join('\n'), out);
            //next();
            cleanUpAndNext(next);
          });
        });
      }, 1000); // Wait to do the touch to ensure mod-time is different
    });

    test(' rule with existing objective file and no source ' +
        ' (should be normal file-task) (' + key  + ')', function (next) {
      // Remove just the source file
      fs.writeFileSync('foo.html', '');
      utils.file.rmRf('foo.txt', {silent: true});
      exec('../bin/cli.js -q -f Jakefile.rule ' + key + ':test', function (err, out) {
        if (err) {
          throw err;
        }
        // Should treat existing objective file as plain file-task,
        // and just run test-task
        let output = [
          'ran test',
          ''
        ];
        assert.equal(output.join('\n'), out);
        cleanUpAndNext(next);
      });
    });

  });

});

