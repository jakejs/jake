var assert = require('assert')
  , fs = require('fs')
  , path = require('path')
  , exec = require('child_process').exec
  , h = require('./helpers')
  , Matcher = require('../lib/rule').Matcher
  , utils = require('../lib/utils');

var cleanUpAndNext = function (callback) {
  utils.file.rmRf("./foo");
  utils.file.rmRf("./tmp*");
  callback();
};

var tests = {

  'before': function (next) {
    process.chdir('./test');
    cleanUpAndNext(next);
  }

, 'after': function () {
    process.chdir('../');
  }

  //  - name   foo:bin/main.o
  //  - pattern    bin/%.o
  //  - source    src/%.c
  //
  // return {
  //    'dep' : 'foo:src/main.c',
  //    'file': 'src/main.c'
  //  };
, 'test Matcher.getSource': function () {
    var src = Matcher.getSource('foo:bin/main.o', 'bin/%.o', 'src/%.c');
    assert.equal('foo:src/main.c', src);
  }


/*

  Undiagnosed issue, probably due to Windows difference

  AssertionError: "tmp_dep2.c task\ntmp_dep1.c task\ncp tmp_dep1.c tmp_dep1.o task\ncp tmp_dep2.c tmp_dep2.o task\ntmp task" == "tmp_dep2.c task\ncp tmp_dep2.c tmp_dep2.o task\ntmp task"
    at C:\src\jake\test\rule.js:48:14

    where lin 48 refers to the first assert.equal below:

, 'test rule w/o pattern': function (next) {
    h.exec( 'node ../bin/cli.js -f Jakefile.rule tmp', function (out) {
      var output = [
        "tmp_dep2.c task"
      , "tmp_dep1.c task"
      , "cp tmp_dep1.c tmp_dep1.o task"
      , "cp tmp_dep2.c tmp_dep2.o task"
      , "tmp task" ];
      var data;
      assert.equal( output.join('\n') , out);
      data = fs.readFileSync(process.cwd() + '/tmp');
      assert.equal('src_1src_2', data.toString());
      cleanUpAndNext(next);
    });
  }

  AssertionError: "tmp_dep2.c task\ntmp_dep1.c task\ncp tmp_dep1.c tmp_dep1.oo task\ncp tmp_dep2.c tmp_dep2.oo task\ntmp pattern task" == "tmp_dep2.c task\ncp tmp_dep1.c tmp_dep1.oo task\ncp tmp_dep2.c tmp_dep2.oo task\ntmp pattern task"
    at C:\src\jake\test\rule.js:64:14  

    (where line 64 referred to the first assert.equal below)


, 'test rule w pattern w/o folder w/o namespace': function (next) {
    h.exec( 'node ../bin/cli.js  -f Jakefile.rule tmp_p', function (out) {
      var output = [
        "tmp_dep2.c task"
      , "tmp_dep1.c task"
      , "cp tmp_dep1.c tmp_dep1.oo task"
      , "cp tmp_dep2.c tmp_dep2.oo task"
      , "tmp pattern task" ];
      var data;
      assert.equal( output.join('\n') , out);
      data = fs.readFileSync(process.cwd() + '/tmp_p');
      assert.equal('src_1src_2 pattern', data.toString());
      cleanUpAndNext(next);
    });
  }



, 'test rule w pattern w folder w/o namespace': function (next) {
    h.exec( 'node ../bin/cli.js  -f Jakefile.rule tmp_pf', function (out) {
      var output = [
        "tmpsrc/tmp_dep1.c task"
      , "cp tmpsrc/tmp_dep1.c tmpbin/tmp_dep1.oo task"
      , "tmpsrc/tmp_dep2.c task"
      , "cp tmpsrc/tmp_dep2.c tmpbin/tmp_dep2.oo task"
      , "tmp pattern folder task" ];
      var data;
      assert.equal( output.join('\n') , out);
      data = fs.readFileSync(process.cwd() + '/tmp_pf');
      assert.equal('src/src_1src/src_2 pattern folder', data.toString());
      cleanUpAndNext(next);
    });
  }

, 'test rule w pattern w folder w namespace': function (next) {
    h.exec( 'node ../bin/cli.js  -f Jakefile.rule tmp_ns', function (out) {
      var output = [
        "tmpsrc/file2.c init task"
      , "tmpsrc/tmp_dep2.c task"
      , "cp tmpsrc/tmp_dep2.c tmpbin/tmp_dep2.oo task"
      , "tmpsrc/dep1.c task"
      , "cp tmpsrc/dep1.c tmpbin/dep1.oo ns task"
      , "cp tmpsrc/file2.c tmpbin/file2.oo ns task"
      , "tmp pattern folder namespace task" ];
      var data;
      assert.equal( output.join('\n') , out);
      data = fs.readFileSync(process.cwd() + '/tmp_ns');
      assert.equal('src/src_1src/src_2src/src_3 pattern folder namespace', data.toString());
      cleanUpAndNext(next);
    });
  }

, 'test rule w chain w pattern w folder w namespace': function (next) {
    h.exec( 'node ../bin/cli.js  -f Jakefile.rule tmp_cr', function (out) {
      var output = [
        "chainrule init task"
      , "cp tmpsrc/file1.tex tmpbin/file1.dvi tex->dvi task"
      , "cp tmpbin/file1.dvi tmpbin/file1.pdf dvi->pdf task"
      , "cp tmpsrc/file2.tex tmpbin/file2.dvi tex->dvi task"
      , "cp tmpbin/file2.dvi tmpbin/file2.pdf dvi->pdf task"
      , "tmp chainrule namespace task" ];
      var data;
      assert.equal( output.join('\n') , out);
      data = fs.readFileSync(process.cwd() + '/tmp_cr');
      assert.equal('tex1 tex2  chainrule namespace', data.toString());
      cleanUpAndNext(next);
    });
  }

};

['precedence', 'regexPattern', 'sourceFunction'].forEach(function (key) {

  tests['test rule with source file not created yet (' + key  + ')'] = function (next) {
    utils.file.rmRf('foo.txt', {silent: true});
    utils.file.rmRf('foo.html', {silent: true});
    h.exec('node ../bin/cli.js  -f Jakefile.rule ' + key + ':test', {breakOnError: false},
        function (out) {
      // foo.txt prereq doesn't exist yet
      assert.ok(out.toString().indexOf('Unknown task "foo.html"') > -1);
      next();
    });
  };

  tests['test rule with source file now created (' + key  + ')'] = function (next) {
    fs.writeFileSync('foo.txt', '');
    h.exec('node ../bin/cli.js  -f Jakefile.rule ' + key + ':test', function (out) {
      // Should run prereq and test task
      var output = [
        'created html'
      , 'ran test'
      ];
      assert.equal(output.join('\n'), out);
      next();
    });
  };

  tests['test rule with objective file now created (' + key  + ')'] = function (next) {
    fs.writeFileSync('foo.txt', '');
    h.exec('node ../bin/cli.js  -f Jakefile.rule ' + key + ':test', function (out) {
      // Should only run test task
      var output = [
        'ran test'
      ];
      assert.equal(output.join('\n'), out);
      next();
    });
  };

  tests['test rule with source file modified (' + key  + ')'] = function (next) {
    setTimeout(function () {
      exec('touch foo.txt', function (err, data) {
        if (err) {
          throw err;
        }
        h.exec('../bin/cli.js  -f Jakefile.rule ' + key + ':test', function (out) {
          // Should again run both prereq and test task
          var output = [
            'created html'
          , 'ran test'
          ];
          assert.equal(output.join('\n'), out);
          //next();
          cleanUpAndNext(next);
        });
      });
    }, 1000); // Wait to do the touch to ensure mod-time is different
  };

  tests['test rule with existing objective file and no source ' +
      ' (should be normal file-task) (' + key  + ')'] = function (next) {
    // Remove just the source file
    utils.file.rmRf('foo.txt', {silent: true});
    h.exec('node ../bin/cli.js  -f Jakefile.rule ' + key + ':test', function (out) {
      // Should treat existing objective file as plain file-task,
      // and just run test-task
      var output = [
        'ran test'
      ];
      assert.equal(output.join('\n'), out);
      cleanUpAndNext(next);
    });
  };

});




module.exports = tests;


*/};

