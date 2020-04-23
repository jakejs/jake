/*
 * Utilities: A classic collection of JavaScript utilities
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var assert = require('assert')
  , fs = require('fs')
  , path = require('path')
  , file = require('../lib/utils/file')
  , existsSync = fs.existsSync || path.existsSync
  , exec = require('child_process').execSync
  , tests;


suite('fileUtils', function () {

  setup(function () {
    process.chdir('./test');
  });

  teardown(function () {
    process.chdir('../');
  });

  test('mkdirP', function () {
    var expected = [
          ['foo']
        , ['foo', 'bar']
        , ['foo', 'bar', 'baz']
        , ['foo', 'bar', 'baz', 'qux']
        ]
      , res;
    file.mkdirP('foo/bar/baz/qux');
    res = exec('find foo').toString().trim().split('\n');
    for (var i = 0, ii = res.length; i < ii; i++) {
      assert.equal(path.join.apply(path, expected[i]), res[i]);
    }
    file.rmRf('foo');
  });

  test('rmRf', function () {
    file.mkdirP('foo/bar/baz/qux');
    file.rmRf('foo/bar');
    res = exec('find foo').toString().trim().split('\n');
    assert.equal(1, res.length);
    assert.equal('foo', res[0]);
    fs.rmdirSync('foo');
  });

  test('rmRf with symlink subdir', function () {
    file.mkdirP('foo');
    file.mkdirP('bar');
    fs.writeFileSync('foo/hello.txt', 'hello, it\'s me');
    fs.symlinkSync('../foo', 'bar/foo'); file.rmRf('bar');

    // Make sure the bar directory was successfully deleted
    var barDeleted = false;
    try {
      var stat = fs.statSync('bar');
    } catch(err) {
      if(err.code == 'ENOENT') {
        barDeleted = true;
      }
    }
    assert.equal(true, barDeleted);

    // Make sure that the file inside the linked folder wasn't deleted
    res = fs.readdirSync('foo');
    assert.equal(1, res.length);
    assert.equal('hello.txt', res[0]);

    // Cleanup
    fs.unlinkSync('foo/hello.txt');
    fs.rmdirSync('foo');
  });

  test('rmRf with symlinked dir', function () {
    file.mkdirP('foo');
    fs.writeFileSync('foo/hello.txt', 'hello!');
    fs.symlinkSync('foo', 'bar');
    file.rmRf('bar');

    // Make sure the bar directory was successfully deleted
    var barDeleted = false;
    try {
      var stat = fs.statSync('bar');
    } catch(err) {
      if(err.code == 'ENOENT') {
        barDeleted = true;
      }
    }
    assert.equal(true, barDeleted);

    // Make sure that the file inside the linked folder wasn't deleted
    res = fs.readdirSync('foo');
    assert.equal(1, res.length);
    assert.equal('hello.txt', res[0]);

    // Cleanup
    fs.unlinkSync('foo/hello.txt');
    fs.rmdirSync('foo');
  });

  test('cpR with same name and different directory', function () {
      file.mkdirP('foo');
      fs.writeFileSync('foo/bar.txt', 'w00t');
      file.cpR('foo', 'bar');
      assert.ok(existsSync('bar/bar.txt'));
      file.rmRf('foo');
      file.rmRf('bar');
  });

  test('cpR with same to and from will throw', function () {
    assert.throws(function () {
      file.cpR('foo.txt', 'foo.txt');
    });
  });

  test('cpR rename via copy in directory', function () {
    file.mkdirP('foo');
    fs.writeFileSync('foo/bar.txt', 'w00t');
    file.cpR('foo/bar.txt', 'foo/baz.txt');
    assert.ok(existsSync('foo/baz.txt'));
    file.rmRf('foo');
  });

  test('cpR rename via copy in base', function () {
    fs.writeFileSync('bar.txt', 'w00t');
    file.cpR('bar.txt', 'baz.txt');
    assert.ok(existsSync('baz.txt'));
    file.rmRf('bar.txt');
    file.rmRf('baz.txt');
  });

  test('cpR keeps file mode', function () {
    fs.writeFileSync('bar.txt', 'w00t', {mode: 0750});
    fs.writeFileSync('bar1.txt', 'w00t!', {mode: 0744});
    file.cpR('bar.txt', 'baz.txt');
    file.cpR('bar1.txt', 'baz1.txt');

    assert.ok(existsSync('baz.txt'));
    assert.ok(existsSync('baz1.txt'));
    var bazStat = fs.statSync('baz.txt');
    var bazStat1 = fs.statSync('baz1.txt');
    assert.equal(0750, bazStat.mode & 07777);
    assert.equal(0744, bazStat1.mode & 07777);

    file.rmRf('bar.txt');
    file.rmRf('baz.txt');
    file.rmRf('bar1.txt');
    file.rmRf('baz1.txt');
  });

  test('cpR keeps file mode when overwriting with preserveMode', function () {
    fs.writeFileSync('bar.txt', 'w00t', {mode: 0755});
    fs.writeFileSync('baz.txt', 'w00t!', {mode: 0744});
    file.cpR('bar.txt', 'baz.txt', {silent: true, preserveMode: true});

    assert.ok(existsSync('baz.txt'));
    var bazStat = fs.statSync('baz.txt');
    assert.equal(0755, bazStat.mode & 07777);

    file.rmRf('bar.txt');
    file.rmRf('baz.txt');
  });

  test('cpR does not keep file mode when overwriting', function () {
    fs.writeFileSync('bar.txt', 'w00t', {mode: 0766});
    fs.writeFileSync('baz.txt', 'w00t!', {mode: 0744});
    file.cpR('bar.txt', 'baz.txt');

    assert.ok(existsSync('baz.txt'));
    var bazStat = fs.statSync('baz.txt');
    assert.equal(0744, bazStat.mode & 07777);

    file.rmRf('bar.txt');
    file.rmRf('baz.txt');
  });

  test('cpR copies file mode recursively', function () {
    fs.mkdirSync('foo');
    fs.writeFileSync('foo/bar.txt', 'w00t', {mode: 0740});
    file.cpR('foo', 'baz');

    assert.ok(existsSync('baz'));
    var barStat = fs.statSync('baz/bar.txt');
    assert.equal(0740, barStat.mode & 07777);

    file.rmRf('foo');
    file.rmRf('baz');
  });

  test('cpR keeps file mode recursively', function () {
    fs.mkdirSync('foo');
    fs.writeFileSync('foo/bar.txt', 'w00t', {mode: 0740});
    fs.mkdirSync('baz');
    fs.mkdirSync('baz/foo');
    fs.writeFileSync('baz/foo/bar.txt', 'w00t!', {mode: 0755});
    file.cpR('foo', 'baz', {silent: true, preserveMode: true});

    assert.ok(existsSync('baz'));
    var barStat = fs.statSync('baz/foo/bar.txt');
    assert.equal(0740, barStat.mode & 07777);

    file.rmRf('foo');
    file.rmRf('baz');
  });

  test('cpR copies directory mode recursively', function () {
    fs.mkdirSync('foo', 0755);
    fs.mkdirSync('foo/bar', 0700);
    file.cpR('foo', 'bar');

    assert.ok(existsSync('foo'));
    var fooBarStat = fs.statSync('bar/bar');
    assert.equal(0700, fooBarStat.mode & 07777);

    file.rmRf('foo');
    file.rmRf('bar');
  });

});


