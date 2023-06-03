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

let assert = require('assert');
let fs = require('fs');
let { rmRf } = require('../../lib/jake');
const { execJake } = require('./helpers');

let cleanUpAndNext = function (callback) {
  rmRf('./foo', {
    silent: true
  });
  callback && callback();
};

suite('fileTask', function () {
  this.timeout(7000);

  setup(function () {
    cleanUpAndNext();
  });

  test('where a file-task prereq does not change with --always-make', function () {

    let out = execJake('-q fileTest:foo/from-src1.txt');
    assert.equal(out, [
      'fileTest:foo/src1.txt task',
      'fileTest:foo/from-src1.txt task',
    ].join("\n"));

    out = execJake('-q -B fileTest:foo/from-src1.txt');
    assert.equal(out, [
      'fileTest:foo/src1.txt task',
      'fileTest:foo/from-src1.txt task',
    ].join("\n"));

    cleanUpAndNext();
  });

  test('concating two files', function () {

    let out = execJake('-q fileTest:foo/concat.txt');
    assert.equal(out, [
      'fileTest:foo/src1.txt task',
      'default task',
      'fileTest:foo/src2.txt task',
      'fileTest:foo/concat.txt task',
    ].join('\n'));

    // Check to see the two files got concat'd
    let data = fs.readFileSync('foo/concat.txt');
    assert.equal(data.toString(), 'src1src2');

    cleanUpAndNext();
  });

  test('where a file-task prereq does not change', function () {

    let out = execJake('-q fileTest:foo/from-src1.txt');
    assert.equal(out, [
      'fileTest:foo/src1.txt task',
      'fileTest:foo/from-src1.txt task',
    ].join("\n"));

    out = execJake('-q fileTest:foo/from-src1.txt');
    // Second time should be a no-op
    assert.equal(out, '');

    cleanUpAndNext();
  });

  test('where a file-task prereq does change, then does not', function (next) {
    fs.mkdirSync('foo', { recursive: true });
    fs.writeFileSync('foo/from-src1.txt', '');
    setTimeout(() => {
      fs.writeFileSync('./foo/src1.txt', '-SRC');

      // Task should run the first time
      let out = execJake('-q fileTest:foo/from-src1.txt');
      assert.equal(out, 'fileTest:foo/from-src1.txt task');

      // Task should not run on subsequent invocation
      out = execJake('-q fileTest:foo/from-src1.txt');
      assert.equal(out, '');

      cleanUpAndNext(next);
    }, 1000);
  });

  suite('a preexisting file', function () {
    const prereqData = 'howdy';

    setup(function () {

      // Set up the prerequisite file.
      fs.mkdirSync('foo', { recursive: true });
      fs.writeFileSync('foo/prereq.txt', prereqData);

      // Run jake to generate the output.
      const out = execJake('-q fileTest:foo/from-prereq.txt');
      assert.equal(out, 'fileTest:foo/from-prereq.txt task');

      // Ensure the prerequisite data was copied successfully.
      const data = fs.readFileSync('foo/from-prereq.txt');
      assert.equal(data.toString(), prereqData);

    });

    test('with no changes', function () {
      const out = execJake('-q fileTest:foo/from-prereq.txt');
      // Second time should be a no-op
      assert.equal(out, '');
      cleanUpAndNext();
    });

    test('with --always-make flag', function () {
      const out = execJake('-q -B fileTest:foo/from-prereq.txt');
      assert.equal(out, 'fileTest:foo/from-prereq.txt task');
      cleanUpAndNext();
    });

  });

  test('nested directory-task', function () {
    execJake('-q fileTest:foo/bar/baz/bamf.txt');
    let data = fs.readFileSync('foo/bar/baz/bamf.txt');
    assert.equal(data, 'w00t');
    cleanUpAndNext();
  });

  test('partially existing prereqs', function () {
    /*
     dependency graph:
                               /-- foo/output2a.txt --\
     foo -- foo/output1.txt --+                        +-- output3.txt
                               \-- foo/output2b.txt --/
    */
    // build part of the prereqs
    exec(`${JAKE_CMD} -q fileTest:foo/output2a.txt`);
    // verify the final target gets built
    exec(`${JAKE_CMD} -q fileTest:foo/output3.txt`);
    let data = fs.readFileSync(process.cwd() + '/foo/output3.txt');
    assert.equal('w00t', data);
    cleanUpAndNext();
  });
});

