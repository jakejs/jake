var assert = require('assert')
  , fs = require('fs')
  , path = require('path')
  , exec = require('child_process').exec
  , h = require('./helpers');

var cleanUpAndNext = function (callback) {
  exec('rm -fr ./foo ./tmp*', function (err, stdout, stderr) {
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

, 'test rule w/o pattern': function (next) {
    h.exec( '../bin/cli.js -f Jakefile.rule tmp', function (out) {
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

, 'test rule w pattern w/o folder w/o namespace': function (next) {
    h.exec( '../bin/cli.js  -f Jakefile.rule tmp_p', function (out) {
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
    h.exec( '../bin/cli.js  -f Jakefile.rule tmp_pf', function (out) {
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
    h.exec( '../bin/cli.js  -f Jakefile.rule tmp_ns', function (out) {
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
    h.exec( '../bin/cli.js  -f Jakefile.rule tmp_cr', function (out) {
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

module.exports = tests;

