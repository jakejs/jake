var exec = require('child_process').execSync;
fs = require('fs');
util = require('util');
utils = require('utilities');


task('default', ['tmp']);

directory('tmpsrc');
directory('tmpbin');

////////////////////////////////////////////////////////////
// Simple Suffix Rule
file('tmp', ['tmp_init', 'tmp_dep1.o', 'tmp_dep2.o'], function (params) {
    console.log('tmp task');
    var data1 = fs.readFileSync('tmp_dep1.o');
    var data2 = fs.readFileSync('tmp_dep2.o');
    fs.writeFileSync('tmp', data1 + data2);
});

rule('.o', '.c', function() {
  var cmd = util.format('cp %s %s', this.source, this.name);
  console.log(cmd + ' task');
  exec(cmd);
});

file('tmp_dep1.c', function () {
  fs.writeFileSync('tmp_dep1.c', 'src_1');
  console.log('tmp_dep1.c task');
});

// note that tmp_dep2.o depends on tmp_dep2.c, which is a
// static file.
task('tmp_init', function () {
  fs.writeFileSync('tmp_dep2.c', 'src_2');
  console.log('tmp_dep2.c task');
});
////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
// Pattern Rule
file('tmp_p', ['tmp_init', 'tmp_dep1.oo', 'tmp_dep2.oo'], function (params) {
    console.log('tmp pattern task');
    var data1 = fs.readFileSync('tmp_dep1.oo');
    var data2 = fs.readFileSync('tmp_dep2.oo');
    fs.writeFileSync('tmp_p', data1 + data2 + ' pattern');
});

rule('%.oo', '%.c', function() {
  var cmd = util.format('cp %s %s', this.source, this.name);
  console.log(cmd + ' task');
  exec(cmd);
});
////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
// Pattern Rule with Folder
// i.e.  rule('tmpbin/%.oo', 'tmpsrc/%.c', ...
file('tmp_pf', [
    'tmp_src_init'
  , 'tmpbin'
  , 'tmpbin/tmp_dep1.oo'
  , 'tmpbin/tmp_dep2.oo' ], function (params) {
    console.log('tmp pattern folder task');
    var data1 = fs.readFileSync('tmpbin/tmp_dep1.oo');
    var data2 = fs.readFileSync('tmpbin/tmp_dep2.oo');
    fs.writeFileSync('tmp_pf', data1 + data2 + ' pattern folder');
});

rule('tmpbin/%.oo', 'tmpsrc/%.c', function() {
  var cmd = util.format('cp %s %s', this.source, this.name);
  console.log(cmd + ' task');
  exec(cmd);
});

file('tmpsrc/tmp_dep2.c',['tmpsrc'], function () {
  fs.writeFileSync('tmpsrc/tmp_dep2.c', 'src/src_2');
  console.log('tmpsrc/tmp_dep2.c task');
});

// Create static files in folder tmpsrc.
task('tmp_src_init', ['tmpsrc'], function () {
  fs.writeFileSync('tmpsrc/tmp_dep1.c', 'src/src_1');
  console.log('tmpsrc/tmp_dep1.c task');
});
////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////
// Namespace Test. This is a Mixed Test.
// Test for
// -  rules belonging to different namespace.
// -  rules with folder and pattern
task('tmp_ns', [
    'tmpbin'
  , 'rule:init'
  , 'tmpbin/tmp_dep2.oo'    // *** This relies on a rule defined before.
  , 'rule:tmpbin/dep1.oo'
  , 'rule:tmpbin/file2.oo' ], function () {
    console.log('tmp pattern folder namespace task');
    var data1 = fs.readFileSync('tmpbin/dep1.oo');
    var data2 = fs.readFileSync('tmpbin/tmp_dep2.oo');
    var data3 = fs.readFileSync('tmpbin/file2.oo');
    fs.writeFileSync('tmp_ns', data1 + data2 + data3 + ' pattern folder namespace');
});

namespace('rule', function() {
  task('init', ['tmpsrc'], function () {
    fs.writeFileSync('tmpsrc/file2.c', 'src/src_3');
    console.log('tmpsrc/file2.c init task');
  });

  file('tmpsrc/dep1.c',['tmpsrc'], function () {
    fs.writeFileSync('tmpsrc/dep1.c', 'src/src_1');
    console.log('tmpsrc/dep1.c task');
  }, {async: true});

  rule('tmpbin/%.oo', 'tmpsrc/%.c', function() {
    var cmd = util.format('cp %s %s', this.source, this.name);
    console.log(cmd + ' ns task');
    exec(cmd);
  });
});
////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
// Chain rule
// rule('tmpbin/%.pdf', 'tmpbin/%.dvi', function() { ...
// rule('tmpbin/%.dvi', 'tmpsrc/%.tex', ['tmpbin'], function() { ...
task('tmp_cr', [
    'chainrule:init'
  , 'chainrule:tmpbin/file1.pdf'
  , 'chainrule:tmpbin/file2.pdf' ], function () {
    console.log('tmp chainrule namespace task');
    var data1 = fs.readFileSync('tmpbin/file1.pdf');
    var data2 = fs.readFileSync('tmpbin/file2.pdf');
    fs.writeFileSync('tmp_cr', data1 + data2 + ' chainrule namespace');
});

namespace('chainrule', function() {
  task('init', ['tmpsrc', 'tmpbin'], function () {
    fs.writeFileSync('tmpsrc/file1.tex', 'tex1 ');
    fs.writeFileSync('tmpsrc/file2.tex', 'tex2 ');
    console.log('chainrule init task');
  });

  rule('tmpbin/%.pdf', 'tmpbin/%.dvi', function() {
    var cmd = util.format('cp %s %s', this.source, this.name);
    console.log(cmd + ' dvi->pdf task');
    exec(cmd);
  });

  rule('tmpbin/%.dvi', 'tmpsrc/%.tex', ['tmpbin'], function() {
    var cmd = util.format('cp %s %s', this.source, this.name);
    console.log(cmd + ' tex->dvi task');
    exec(cmd);
  });
});
////////////////////////////////////////////////////////////
namespace('precedence', function () {
  task('test', ['foo.html'], function () {
    console.log('ran test');
  });

  rule('.html', '.txt', function () {
    console.log('created html');
    var data = fs.readFileSync(this.source);
    fs.writeFileSync(this.name, data.toString());
  });
});

namespace('regexPattern', function () {
  task('test', ['foo.html'], function () {
    console.log('ran test');
  });

  rule(/\.html$/, '.txt', function () {
    console.log('created html');
    var data = fs.readFileSync(this.source);
    fs.writeFileSync(this.name, data.toString());
  });
});

namespace('sourceFunction', function () {

  var srcFunc = function (taskName) {
    return taskName.replace(/\.[^.]+$/, '.txt');
  };

  task('test', ['foo.html'], function () {
    console.log('ran test');
  });

  rule('.html', srcFunc, function () {
    console.log('created html');
    var data = fs.readFileSync(this.source);
    fs.writeFileSync(this.name, data.toString());
  });
});

////////////////////////////////////////////////////////////
task('clean', function () {
  utils.file.rmRf('./foo');
  utils.file.rmRf('./tmp');
});
