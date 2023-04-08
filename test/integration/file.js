/*
 * Jake JavaScript build tool
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

const assert = require('assert');
const fs = require('fs');
const file = require('../../lib/utils/file');
const { assertFileMode, testRequiresWindowsElevation, ensureDirs } = require('./helpers');
const { suite, setup, test } = require('mocha');

suite('fileUtils', function () {

  suite('mkdirP', function () {

    setup(function () {
      // we need to clear the dirs here, since we're testing dir creation itself.
      ensureDirs(false, 'foo');
    });

    test('with dir', function () {
      file.mkdirP('foo');
      assert.ok(fs.existsSync('foo'));
      ensureDirs(false, 'foo');
    });

    test('with subdir', function () {
      file.mkdirP('foo/bar/baz/qux');
      assert.ok(fs.existsSync('foo/bar/baz/qux'));
      ensureDirs(false, 'foo');
    });

  });

  suite('rmRf', function () {

    test('with subdir', function () {
      ensureDirs('foo/bar/baz/qux');
      file.rmRf('foo/bar');
      assert.deepStrictEqual(fs.readdirSync('foo'), []);
      assert.strictEqual(fs.existsSync('foo/bar'), false);
      ensureDirs(false, 'foo');
    });

    test('with symlink subdir', function () {
      testRequiresWindowsElevation(this);

      ensureDirs('foo', 'bar');
      fs.writeFileSync('foo/hello.txt', 'hello, it\'s me');
      fs.symlinkSync('../foo', 'bar/foo');

      file.rmRf('bar');

      // Make sure the bar directory was successfully deleted
      assert.strictEqual(fs.existsSync('bar'), false);

      // Make sure that the file inside the linked folder wasn't deleted
      assert.strictEqual(fs.existsSync('foo/hello.txt'), true);

      // Cleanup
      fs.unlinkSync('foo/hello.txt');
      ensureDirs(false, 'foo', 'bar');
    });

    test('with symlinked dir', function () {
      testRequiresWindowsElevation(this);

      ensureDirs('foo');
      fs.writeFileSync('foo/hello.txt', 'hello!');
      fs.symlinkSync('foo', 'bar');

      file.rmRf('bar');

      // Make sure the bar directory was successfully deleted
      assert.strictEqual(fs.existsSync('bar'), false);

      // Make sure that the file inside the linked folder wasn't deleted
      assert.strictEqual(fs.existsSync('foo/hello.txt'), true);

      // Cleanup
      fs.unlinkSync('foo/hello.txt');
      ensureDirs(false, 'foo', 'bar');
    });

  });

  suite('cpR', function () {

    test('with same name and different directory', function () {
      ensureDirs('foo', false, 'bar');
      fs.writeFileSync('foo/bar.txt', 'w00t');

      file.cpR('foo', 'bar');
      assert.ok(fs.existsSync('bar/bar.txt'));

      ensureDirs(false, 'foo', 'bar');
    });

    test('with same to and from will throw', function () {
      assert.throws(function () {
        file.cpR('foo.txt', 'foo.txt');
      });
    });

    test('rename via copy in directory', function () {
      ensureDirs('foo');
      fs.writeFileSync('foo/bar.txt', 'w00t');

      file.cpR('foo/bar.txt', 'foo/baz.txt');
      assert.ok(fs.existsSync('foo/baz.txt'));

      ensureDirs(false, 'foo');
    });

    test('rename via copy in base', function () {
      fs.writeFileSync('bar.txt', 'w00t');

      file.cpR('bar.txt', 'baz.txt');
      assert.ok(fs.existsSync('baz.txt'));

      fs.rmSync('bar.txt');
      fs.rmSync('baz.txt');
    });

    test('keeps file mode', function () {
      [ 0o750, 0o744 ].forEach((mode) => {
        fs.writeFileSync('bar.txt', 'w00t', { mode: mode });

        file.cpR('bar.txt', 'baz.txt');
        assertFileMode('baz.txt', mode);

        fs.rmSync('bar.txt');
        fs.rmSync('baz.txt');
      });
    });

    test('keeps file mode when overwriting with preserveMode', function () {
      fs.writeFileSync('bar.txt', 'w00t', {mode: 0o755});
      fs.writeFileSync('baz.txt', 'w00t!', {mode: 0o744});

      file.cpR('bar.txt', 'baz.txt', {silent: true, preserveMode: true});
      assertFileMode('baz.txt', 0o755);

      fs.rmSync('bar.txt');
      fs.rmSync('baz.txt');
    });

    test('does not keep file mode when overwriting', function () {
      fs.writeFileSync('bar.txt', 'w00t', {mode: 0o766});
      fs.writeFileSync('baz.txt', 'w00t!', {mode: 0o744});

      file.cpR('bar.txt', 'baz.txt');
      assertFileMode('baz.txt', 0o744);

      fs.rmSync('bar.txt');
      fs.rmSync('baz.txt');
    });

    test('copies file mode recursively', function () {
      ensureDirs('foo', false, 'baz');
      fs.writeFileSync('foo/bar.txt', 'w00t', {mode: 0o740});

      file.cpR('foo', 'baz');
      assertFileMode('baz/bar.txt', 0o740);

      ensureDirs(false, 'foo', 'baz');
    });

    test('keeps file mode recursively', function () {
      ensureDirs('foo', 'baz/foo');
      fs.writeFileSync('foo/bar.txt', 'w00t', {mode: 0o740});
      fs.writeFileSync('baz/foo/bar.txt', 'w00t!', {mode: 0o755});

      file.cpR('foo', 'baz', {silent: true, preserveMode: true});
      assertFileMode('baz/foo/bar.txt', 0o740);

      ensureDirs(false, 'foo', 'baz');
    });

    test('copies directory mode recursively', function () {
      ensureDirs(0o755, 'foo', 0o700, 'foo/bar');

      file.cpR('foo', 'bar');
      assertFileMode('bar/bar', 0o700);

      ensureDirs(false, 'foo', 'bar');
    });

  });
});


