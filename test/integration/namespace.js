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

const PROJECT_DIR = process.env.PROJECT_DIR;

// Load the jake global
require(`${PROJECT_DIR}/lib/jake`);

let assert = require('assert');
let exec = require('child_process').execSync;

suite('namespace', function () {

  this.timeout(7000);

  test('resolve namespace by relative name', function () {
    let foo;
    let bar;
    let baz;

    foo = namespace('foo', function () {
      bar = namespace('bar', function () {
        baz = namespace('baz', function () {
        });
      });
    });

    assert.ok(foo === baz.resolveNamespace('foo'),
      'foo -> "foo"');
    assert.ok(bar === baz.resolveNamespace('foo:bar'),
      'bar -> "foo:bar"');
    assert.ok(bar === baz.resolveNamespace('bar'),
      'bar -> "bar"');
    assert.ok(baz === baz.resolveNamespace('foo:bar:baz'),
      'baz -> "foo:bar:baz"');
    assert.ok(baz === baz.resolveNamespace('bar:baz'),
      'baz -> "bar:baz"');
  });

  test('modifying a namespace by adding a new task', function () {
    let out = exec('./node_modules/.bin/jake -q one:two').toString().trim();
    assert.equal('one:one\none:two', out);
  });

});
