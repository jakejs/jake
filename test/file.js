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
  , file = require('../lib/file')
  , tests;

tests = {

  'before': function () {
    process.chdir('./test');
  }

, 'after': function () {
    process.chdir('../');
  }

, 'test mkdirP': function () {
    var expected = [
          'foo'
        , 'foo/bar'
        , 'foo/bar/baz'
        , 'foo/bar/baz/qux'
        ]
      , res;
    file.mkdirP('foo/bar/baz/qux');
    res = file.readdirR('foo');
    for (var i = 0, ii = res.length; i < ii; i++) {
      assert.equal(expected[i], res[i]);
    }
    file.rmRf('foo', {silent: true});
  }

, 'test rmRf': function () {
    file.mkdirP('foo/bar/baz/qux', {silent: true});
    file.rmRf('foo/bar', {silent: true});
    res = file.readdirR('foo');
    assert.equal(1, res.length);
    assert.equal('foo', res[0]);
    fs.rmdirSync('foo');
  }

, 'test basedir with Unix absolute path': function () {
    var p = '/foo/bar/baz';
    assert.equal('/', file.basedir(p));
  }

, 'test basedir with Win absolute path': function () {
    var p = 'C:\\foo\\bar\\baz';
    assert.equal('C:\\', file.basedir(p));
  }

, 'test basedir with Unix absolute path and double-asterisk': function () {
    var p = '/**/foo/bar/baz';
    assert.equal('/', file.basedir(p));
  }

, 'test basedir with leading double-asterisk': function () {
    var p = '**/foo';
    assert.equal('.', file.basedir(p));
  }

, 'test basedir with leading asterisk': function () {
    var p = '*.js';
    assert.equal('.', file.basedir(p));
  }

, 'test basedir with leading dot-slash and double-asterisk': function () {
    var p = './**/foo';
    assert.equal('.', file.basedir(p));
  }

, 'test basedir with leading dirname and double-asterisk': function () {
    var p = 'a/**/*.js';
    assert.equal('a', file.basedir(p));
  }

, 'test basedir with leading dot-dot-slash and double-asterisk': function () {
    var p = '../test/**/*.js';
    assert.equal('..', file.basedir(p));
  }

};

module.exports = tests;


